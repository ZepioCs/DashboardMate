require('dotenv').config()
const { notarize } = require('@electron/notarize')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

async function verifyCodeSigning(appPath) {
  try {
    console.log('Verifying code signing...')
    const { stdout } = await execAsync(`codesign -vv --deep --strict "${appPath}"`)
    console.log('Code signing verification successful:', stdout)
    return true
  } catch (error) {
    console.error('Code signing verification failed:', error.message)
    return false
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function zipApp(appPath) {
  const zipPath = appPath.replace('.app', '.zip')
  console.log('Creating ZIP archive...')
  await execAsync(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`)
  console.log('ZIP archive created successfully.')
  return zipPath
}

async function unzipApp(zipPath) {
  const targetDir = path.dirname(zipPath)
  console.log('Extracting ZIP archive...')
  await execAsync(`ditto -x -k "${zipPath}" "${targetDir}"`)
  console.log('ZIP archive extracted successfully.')
  await fs.promises.unlink(zipPath)
  console.log('ZIP archive deleted successfully.')
}

async function notarizeMacos(context) {
  const { appOutDir } = context

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env

  if (!(APPLE_ID && APPLE_APP_SPECIFIC_PASSWORD && APPLE_TEAM_ID)) {
    console.log(
      'Skipping notarizing step. APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID env variables must be set'
    )
    return
  }

  if (process.env.SKIP_NOTARIZE !== undefined) {
    console.warn('Skipping notarizing step. SKIP_NOTARIZE env variable is set.')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  // Verify code signing before attempting notarization
  const isCodeSigned = await verifyCodeSigning(appPath)
  if (!isCodeSigned) {
    throw new Error(
      'Application must be code signed before notarization. Please ensure proper code signing is completed first.'
    )
  }

  console.log('Starting macOS app notarization...')

  const maxAttempts = 3
  let attempt = 0
  let zipPath

  while (attempt < maxAttempts) {
    try {
      attempt++
      console.log(`Notarization attempt ${attempt} of ${maxAttempts}...`)

      zipPath = await zipApp(appPath)
      console.log('ZIP created successfully, starting notarization...')

      await notarize({
        appBundleId: 'com.zepiocs.apps',
        appPath: zipPath,
        appleId: APPLE_ID,
        appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
        teamId: APPLE_TEAM_ID,
        tool: 'notarytool'
      })

      await unzipApp(zipPath)

      console.log('Notarization completed successfully!')
      return
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)

      if (zipPath && fs.existsSync(zipPath)) {
        await fs.promises.unlink(zipPath).catch(console.error)
      }

      if (attempt === maxAttempts) {
        throw new Error(`Notarization failed after ${maxAttempts} attempts: ${error.message}`)
      }

      console.log('Waiting 30 seconds before next attempt...')
      await wait(30000)
    }
  }
}

exports.default = async function notarizeOrSign(context) {
  const { electronPlatformName } = context
  if (electronPlatformName === 'darwin') {
    await notarizeMacos(context)
  } else {
    console.log(`No notarization or signing for platform ${electronPlatformName}`)
  }
}
