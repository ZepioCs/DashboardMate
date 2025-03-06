import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { is } from '@electron-toolkit/utils'

// Configure logging
log.transports.file.level = 'info'
autoUpdater.logger = log

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.allowDowngrade = false
autoUpdater.allowPrerelease = false
autoUpdater.autoInstallOnAppQuit = true

// Configure update source
if (!is.dev) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'ZepioCs',
    repo: 'DashboardMate',
    private: false,
    releaseType: 'release'
  })
}

export function initAutoUpdater(mainWindow: Electron.BrowserWindow): void {
  // Skip update check in development
  if (is.dev) {
    log.info('Skipping auto-update in development mode')
    return
  }

  // Update events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
    mainWindow.webContents.send('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    mainWindow.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    mainWindow.webContents.send('update-not-available')
  })

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err)
    mainWindow.webContents.send('update-error', err.message || 'Unknown error occurred')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj.percent)
    mainWindow.webContents.send('download-progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    mainWindow.webContents.send('update-downloaded')
  })

  // IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    try {
      log.info('Manually checking for updates...')
      const checkResult = await autoUpdater.checkForUpdates()
      log.info('Check result:', checkResult)
      return checkResult
    } catch (error) {
      log.error('Failed to check for updates:', error)
      mainWindow.webContents.send(
        'update-error',
        error instanceof Error ? error.message : 'Failed to check for updates'
      )
      throw error
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      log.info('Starting update download...')
      const downloadResult = await autoUpdater.downloadUpdate()
      log.info('Download result:', downloadResult)
      return downloadResult
    } catch (error) {
      log.error('Failed to download update:', error)
      mainWindow.webContents.send(
        'update-error',
        error instanceof Error ? error.message : 'Failed to download update'
      )
      throw error
    }
  })

  ipcMain.handle('restart-app', () => {
    log.info('Restarting app to install update...')
    autoUpdater.quitAndInstall(true, true)
  })

  // Initial update check (after a delay)
  setTimeout(() => {
    if (!is.dev) {
      log.info('Performing initial update check...')
      autoUpdater.checkForUpdates().catch((error) => {
        log.error('Failed to check for updates on startup:', error)
      })
    }
  }, 10000) // Increased delay to 10 seconds to ensure app is fully loaded
}
