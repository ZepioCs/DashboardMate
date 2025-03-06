import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Configure logging
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = false

// Configure update source
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'ZepioCs',
  repo: 'DashboardMate'
})

export function initAutoUpdater(mainWindow: Electron.BrowserWindow): void {
  // Update events
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available')
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('download-progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  // IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('Failed to check for updates:', error)
      mainWindow.webContents.send('update-error', 'Failed to check for updates')
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('Failed to download update:', error)
      mainWindow.webContents.send('update-error', 'Failed to download update')
    }
  })

  ipcMain.handle('restart-app', () => {
    autoUpdater.quitAndInstall()
  })

  // Check for updates on app start (after a delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('Failed to check for updates on startup:', error)
    })
  }, 3000)
}
