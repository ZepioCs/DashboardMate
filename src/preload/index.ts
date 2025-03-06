console.log('Preload script is loading...')
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { AppInfo, FileAPI } from '../global_model'

// Custom APIs for renderer
const api: FileAPI = {
  saveTodos: async (data: string): Promise<void> => ipcRenderer.invoke('saveTodos', data),
  loadTodos: async (): Promise<string> => ipcRenderer.invoke('loadTodos'),
  checkFileExists: async (type: 'todos' | 'settings'): Promise<boolean> =>
    ipcRenderer.invoke('checkFileExists', type),
  createFile: async (type: 'todos' | 'settings'): Promise<void> =>
    ipcRenderer.invoke('createFile', type),
  exportTodos: async (data: string): Promise<void> => ipcRenderer.invoke('exportTodos', data),
  importTodos: async (): Promise<string | null> => ipcRenderer.invoke('importTodos'),
  saveSettings: async (data: string): Promise<void> => ipcRenderer.invoke('saveSettings', data),
  loadSettings: async (): Promise<string> => ipcRenderer.invoke('loadSettings'),
  getAppInfo: async (): Promise<AppInfo> => ipcRenderer.invoke('getAppInfo')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
