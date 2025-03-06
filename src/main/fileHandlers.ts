import { ipcMain, dialog } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import log from 'electron-log'
import { Settings } from '../global_model'

const APP_DATA_PATH = join(homedir(), '.dashboardmate')
const FILES = {
  todos: join(APP_DATA_PATH, 'todos.json'),
  settings: join(APP_DATA_PATH, 'settings.json'),
  backups: join(APP_DATA_PATH, 'backups'),
  logs: join(APP_DATA_PATH, 'logs'),
  cache: join(APP_DATA_PATH, 'cache')
}

const DEFAULT_SETTINGS: Settings = {
  notifications: {
    push: false,
    email: false
  },
  ai: {
    autoCreate: false
  }
}

export function initFileHandlers(mainWindow: Electron.BrowserWindow): void {
  // Remove any existing handlers
  ipcMain.removeHandler('getAppInfo')
  ipcMain.removeHandler('checkFileExists')
  ipcMain.removeHandler('createFile')
  ipcMain.removeHandler('loadSettings')
  ipcMain.removeHandler('saveSettings')
  ipcMain.removeHandler('saveTodos')
  ipcMain.removeHandler('loadTodos')
  ipcMain.removeHandler('exportTodos')
  ipcMain.removeHandler('importTodos')

  // Ensure all required directories exist
  Promise.all([
    fs.mkdir(APP_DATA_PATH, { recursive: true }),
    fs.mkdir(FILES.backups, { recursive: true }),
    fs.mkdir(FILES.logs, { recursive: true }),
    fs.mkdir(FILES.cache, { recursive: true })
  ]).catch((error) => {
    log.error('Failed to create app directories:', error)
  })

  // Get app info
  ipcMain.handle('getAppInfo', () => {
    return {
      appPath: APP_DATA_PATH,
      files: FILES,
      version: process.env.npm_package_version || '1.0.0',
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch
    }
  })

  // Check if file exists
  ipcMain.handle('checkFileExists', async (_event, type: 'todos' | 'settings') => {
    try {
      const filePath = FILES[type]
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // Create file
  ipcMain.handle('createFile', async (_event, type: 'todos' | 'settings') => {
    try {
      const filePath = FILES[type]
      const defaultContent = type === 'todos' ? '[]' : JSON.stringify(DEFAULT_SETTINGS, null, 2)
      await fs.writeFile(filePath, defaultContent, 'utf-8')
    } catch (error) {
      log.error(`Failed to create ${type} file:`, error)
      throw error
    }
  })

  // Settings handlers
  ipcMain.handle('loadSettings', async () => {
    try {
      const data = await fs.readFile(FILES.settings, 'utf-8')
      return data
    } catch (error) {
      log.error('Failed to load settings:', error)
      throw error
    }
  })

  ipcMain.handle('saveSettings', async (_event, data: string) => {
    try {
      await fs.writeFile(FILES.settings, data, 'utf-8')
    } catch (error) {
      log.error('Failed to save settings:', error)
      throw error
    }
  })

  // Todos handlers
  ipcMain.handle('saveTodos', async (_event, data: string) => {
    try {
      await fs.writeFile(FILES.todos, data, 'utf-8')
    } catch (error) {
      log.error('Failed to save todos:', error)
      throw error
    }
  })

  ipcMain.handle('loadTodos', async () => {
    try {
      const data = await fs.readFile(FILES.todos, 'utf-8')
      return data
    } catch (error) {
      log.error('Failed to load todos:', error)
      throw error
    }
  })

  // Export todos
  ipcMain.handle('exportTodos', async (_event, data: string) => {
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Tasks',
        defaultPath: join(homedir(), 'Desktop', 'tasks-backup.json'),
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (filePath) {
        await fs.writeFile(filePath, data, 'utf-8')
      }
    } catch (error) {
      log.error('Failed to export todos:', error)
      throw error
    }
  })

  // Import todos
  ipcMain.handle('importTodos', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Tasks',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (filePaths.length > 0) {
        const data = await fs.readFile(filePaths[0], 'utf-8')
        return data
      }
      return null
    } catch (error) {
      log.error('Failed to import todos:', error)
      throw error
    }
  })
}
