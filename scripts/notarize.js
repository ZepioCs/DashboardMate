const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`Notarizing ${appPath} with Apple ID ${process.env.APPLE_ID}`)

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appBundleId: 'com.zepiocs.dashboardmate',
      teamId: process.env.APPLE_TEAM_ID,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD
    })
  } catch (error) {
    console.error('Notarization failed:', error)
    throw error
  }

  console.log('Notarization completed successfully')
}
