export interface FileAPI {
  saveTodos: (data: string) => Promise<void>
  loadTodos: () => Promise<string>
  checkFileExists: (type: 'todos' | 'settings') => Promise<boolean>
  createFile: (type: 'todos' | 'settings') => Promise<void>
  exportTodos: (data: string) => Promise<void>
  importTodos: () => Promise<string | null>
  saveSettings: (data: string) => Promise<void>
  loadSettings: () => Promise<string>
  getAppInfo: () => Promise<AppInfo>
}

export interface AppInfo {
  appPath: string
  files: {
    todos: string
    settings: string
    backups: string
    logs: string
    cache: string
  }
  version: string
  electronVersion: string
  nodeVersion: string
  platform: string
  arch: string
}

export interface Settings {
  version: string
  notifications: {
    push: boolean
    email: boolean
  }
  ai: {
    autoCreate: boolean
  }
  schedule: {
    showWeekends: boolean
  }
}

export type SettingsVersion = {
  major: number
  minor: number
  patch: number
}

export interface UpdateInfo {
  checking: boolean
  available: boolean
  downloading: boolean
  downloaded: boolean
  error: string | null
  progress: number
  version: string | null
}
