require('dotenv').config()
const { notarize } = require('@electron/notarize')

async function notarizeMacos(context) {
  const { appOutDir } = context
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID, SKIP_NOTARIZE } = process.env

  if (!(APPLE_ID && APPLE_APP_SPECIFIC_PASSWORD && APPLE_TEAM_ID)) {
    console.log(
      'Skipping notarizing step. APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID env variables must be set'
    )
    return
  }

  console.log('SKIP_NOTARIZE', SKIP_NOTARIZE)

  if (SKIP_NOTARIZE !== undefined) {
    console.warn('Skipping notarizing step. SKIP_NOTARIZE env variable is set.')
    return
  }

  const appName = context.packager.appInfo.productFilename
  console.log('Starting macOS app notarization...')

  await notarize({
    appBundleId: 'com.zepiocs.apps',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
    tool: 'notarytool'
  })
  console.log('Notarization completed successfully!')
}

exports.default = async function notarizeOrSign(context) {
  const { electronPlatformName } = context
  if (electronPlatformName === 'darwin') {
    await notarizeMacos(context)
  } else {
    console.log(`No notarization or signing for platform ${electronPlatformName}`)
  }
}
