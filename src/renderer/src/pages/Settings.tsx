import { ThemeToggle } from '../components/ThemeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import {
  Bell,
  Mail,
  Zap,
  FileJson,
  Import,
  ArrowUpToLine,
  RefreshCw,
  Plus,
  HardDrive,
  Info
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../stores/StoreProvider'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import { Progress } from '../components/ui/progress'
import { cn } from '../lib/utils'
import { Settings as SettingsType, UpdateInfo, AppInfo } from '../../../global_model'

interface Settings {
  notifications: {
    push: boolean
    email: boolean
  }
  ai: {
    autoCreate: boolean
  }
}

const handleError = (error: unknown, context: string): string => {
  console.error(`${context}:`, error)
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function Settings(): JSX.Element {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingsType>(() => ({
    notifications: {
      push: false,
      email: false
    },
    ai: {
      autoCreate: false
    }
  }))
  const [todosFileExists, setTodosFileExists] = useState(false)
  const [settingsFileExists, setSettingsFileExists] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    version: null
  })
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  // Load settings from file on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Save settings to file when they change
  useEffect(() => {
    const saveSettingsToFile = async (): Promise<void> => {
      try {
        if (settingsFileExists) {
          await window.api.saveSettings(JSON.stringify(settings, null, 2))
        }
      } catch (error) {
        const message = handleError(error, 'Failed to save settings')
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        })
      }
    }
    saveSettingsToFile()
  }, [settings, settingsFileExists])

  useEffect(() => {
    checkFiles()
  }, [])

  useEffect(() => {
    const loadAppInfo = async (): Promise<void> => {
      try {
        const info = await window.api.getAppInfo()
        setAppInfo(info)
      } catch (error) {
        const message = handleError(error, 'Failed to load app info')
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        })
      }
    }
    loadAppInfo()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      const data = await window.api.loadSettings()
      setSettings(JSON.parse(data))
    } catch (error) {
      const message = handleError(error, 'Failed to load settings')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const updateSettings = (path: string[], value: boolean): void => {
    setSettings((prev) => {
      const newSettings = { ...prev }
      let current = newSettings
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newSettings
    })
  }

  const checkFiles = async (): Promise<void> => {
    try {
      setIsChecking(true)
      const [todosExists, settingsExists] = await Promise.all([
        window.api.checkFileExists('todos'),
        window.api.checkFileExists('settings')
      ])
      setTodosFileExists(todosExists)
      setSettingsFileExists(settingsExists)
    } catch (error) {
      const message = handleError(error, 'Failed to check files')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreateFile = async (type: 'todos' | 'settings'): Promise<void> => {
    try {
      await window.api.createFile(type)
      await checkFiles()
      if (type === 'settings') {
        await loadSettings()
      }
      toast({
        title: 'Success',
        description: `${type === 'todos' ? 'Todos' : 'Settings'} file created successfully`
      })
    } catch (error) {
      const message = handleError(error, `Failed to create ${type} file`)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const handleCreateAllFiles = async (): Promise<void> => {
    try {
      await Promise.all([
        !todosFileExists && window.api.createFile('todos'),
        !settingsFileExists && window.api.createFile('settings')
      ])
      await checkFiles()
      await loadSettings()
      toast({
        title: 'Success',
        description: 'All files created successfully'
      })
    } catch (error) {
      const message = handleError(error, 'Failed to create files')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    // Listen for update events from main process
    window.electron.ipcRenderer.on('update-available', (...args) => {
      const version = args[1] as string
      setUpdateInfo((prev) => ({ ...prev, available: true, version }))
      toast({
        title: 'Update Available',
        description: `Version ${version} is available to download.`,
        action: (
          <Button variant="outline" size="sm" onClick={handleDownloadUpdate}>
            Download
          </Button>
        )
      })
    })

    window.electron.ipcRenderer.on('update-not-available', () => {
      setUpdateInfo((prev) => ({ ...prev, checking: false }))
      toast({
        title: 'No Updates Available',
        description: 'You are running the latest version.',
        variant: 'default'
      })
    })

    window.electron.ipcRenderer.on('update-downloaded', () => {
      setUpdateInfo((prev) => ({ ...prev, downloading: false, downloaded: true }))
      toast({
        title: 'Update Ready',
        description: 'Restart the app to apply the update.',
        action: (
          <Button variant="outline" size="sm" onClick={handleRestartApp}>
            Restart Now
          </Button>
        ),
        duration: 0 // Don't auto-dismiss
      })
    })

    window.electron.ipcRenderer.on('update-error', (...args) => {
      const error = args[1] as string
      setUpdateInfo((prev) => ({ ...prev, error, checking: false }))
      toast({
        title: 'Update Error',
        description: error,
        variant: 'destructive'
      })
    })

    window.electron.ipcRenderer.on('download-progress', (...args) => {
      const progress = args[1] as number
      setUpdateInfo((prev) => ({ ...prev, progress }))
    })

    // Check for updates on component mount
    handleCheckForUpdates()

    return (): void => {
      // Clean up listeners
      window.electron.ipcRenderer.removeAllListeners('update-available')
      window.electron.ipcRenderer.removeAllListeners('update-not-available')
      window.electron.ipcRenderer.removeAllListeners('update-downloaded')
      window.electron.ipcRenderer.removeAllListeners('update-error')
      window.electron.ipcRenderer.removeAllListeners('download-progress')
    }
  }, [toast])

  const handleCheckForUpdates = async (): Promise<void> => {
    setUpdateInfo((prev) => ({ ...prev, checking: true, error: null }))
    await window.electron.ipcRenderer.invoke('check-for-updates')
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setUpdateInfo((prev) => ({ ...prev, downloading: true }))
    await window.electron.ipcRenderer.invoke('download-update')
  }

  const handleRestartApp = async (): Promise<void> => {
    await window.electron.ipcRenderer.invoke('restart-app')
  }

  const handleExportTodos = async (): Promise<void> => {
    try {
      await taskStore.exportTasks()
      toast({
        title: 'Success',
        description: 'Tasks exported successfully'
      })
    } catch (error) {
      const message = handleError(error, 'Failed to export tasks')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const handleImportTodos = async (): Promise<void> => {
    try {
      await taskStore.importTasks()
      toast({
        title: 'Success',
        description: 'Tasks imported successfully'
      })
    } catch (error) {
      const message = handleError(error, 'Failed to import tasks')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background/95 px-6 py-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how DashboardMate looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>App Information</CardTitle>
                <CardDescription>Details about your DashboardMate installation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>Version Information</Label>
                      {appInfo && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>App Version: {appInfo.version}</p>
                          <p>Electron: {appInfo.electronVersion}</p>
                          <p>Node.js: {appInfo.nodeVersion}</p>
                          <p>
                            Platform: {appInfo.platform} ({appInfo.arch})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>File Locations</Label>
                      {appInfo && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>App Data: {appInfo.appPath}</p>
                          <p className="text-xs opacity-60">Files and directories:</p>
                          <ul className="text-xs list-disc list-inside pl-2 space-y-0.5">
                            <li>Settings: {appInfo.files.settings}</li>
                            <li>Tasks: {appInfo.files.todos}</li>
                            <li>Backups: {appInfo.files.backups}</li>
                            <li>Logs: {appInfo.files.logs}</li>
                            <li>Cache: {appInfo.files.cache}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="relative">
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
                </div>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications for task updates
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) =>
                        updateSettings(['notifications', 'push'], checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get daily/weekly task summaries
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        updateSettings(['notifications', 'email'], checked)
                      }
                    />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Updates</CardTitle>
                <CardDescription>Check for and install app updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-4">
                    <RefreshCw
                      className={cn(
                        'h-5 w-5 text-muted-foreground',
                        updateInfo.checking && 'animate-spin'
                      )}
                    />
                    <div className="space-y-0.5">
                      <Label>Software Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        {updateInfo.checking
                          ? 'Checking for updates...'
                          : updateInfo.downloading
                            ? 'Downloading update...'
                            : updateInfo.downloaded
                              ? 'Update ready to install'
                              : updateInfo.available
                                ? `Version ${updateInfo.version} available`
                                : 'App is up to date'}
                      </p>
                    </div>
                  </div>
                  {!updateInfo.checking && !updateInfo.downloading && !updateInfo.downloaded && (
                    <Button
                      onClick={updateInfo.available ? handleDownloadUpdate : handleCheckForUpdates}
                      variant="outline"
                      size="sm"
                    >
                      {updateInfo.available ? 'Download' : 'Check for Updates'}
                    </Button>
                  )}
                  {updateInfo.downloaded && (
                    <Button onClick={handleRestartApp} variant="outline" size="sm">
                      Restart Now
                    </Button>
                  )}
                </div>
                {updateInfo.downloading && (
                  <Progress value={updateInfo.progress} className="h-2 w-full" />
                )}
                {updateInfo.error && <p className="text-sm text-destructive">{updateInfo.error}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your task data and backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-4">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>Required Files</Label>
                      <p className="text-sm text-muted-foreground">
                        {isChecking
                          ? 'Checking file status...'
                          : !todosFileExists || !settingsFileExists
                            ? 'Some required files are missing'
                            : 'All files are ready'}
                      </p>
                    </div>
                  </div>
                  {!isChecking && (!todosFileExists || !settingsFileExists) && (
                    <div className="flex gap-2">
                      {!todosFileExists && (
                        <Button
                          onClick={() => handleCreateFile('todos')}
                          variant="outline"
                          size="sm"
                        >
                          Create Todos File
                        </Button>
                      )}
                      {!settingsFileExists && (
                        <Button
                          onClick={() => handleCreateFile('settings')}
                          variant="outline"
                          size="sm"
                        >
                          Create Settings File
                        </Button>
                      )}
                      <Button onClick={handleCreateAllFiles} variant="default" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create All Files
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-4">
                    <ArrowUpToLine className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>Export Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Save your tasks to a backup file
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleExportTodos} variant="outline" size="sm">
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-4">
                    <Import className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label>Import Tasks</Label>
                      <p className="text-sm text-muted-foreground">Load tasks from a backup file</p>
                    </div>
                  </div>
                  <Button onClick={handleImportTodos} variant="outline" size="sm">
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="relative">
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
                </div>
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>Configure AI features and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <div>
                        <Label>Auto Task Creation</Label>
                        <p className="text-sm text-muted-foreground">
                          Let AI suggest and create tasks automatically
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.ai.autoCreate}
                      onCheckedChange={(checked) => updateSettings(['ai', 'autoCreate'], checked)}
                    />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
