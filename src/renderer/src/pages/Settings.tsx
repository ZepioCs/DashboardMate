import { ThemeToggle } from '../components/ThemeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import {
  Bell,
  Zap,
  FileJson,
  Import,
  ArrowUpToLine,
  RefreshCw,
  Plus,
  HardDrive,
  Info,
  History,
  Calendar,
  Settings as SettingsIcon,
  Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../stores/StoreProvider'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import { Progress } from '../components/ui/progress'
import { cn } from '../lib/utils'
import { Settings as SettingsType, UpdateInfo, AppInfo } from '../../../shared/model'
import { CURRENT_SETTINGS_VERSION } from '../../../shared/constants'
import { ChangelogDialog } from '../components/ChangelogDialog'
import { observer } from 'mobx-react-lite'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'

interface Settings {
  notifications: {
    push: boolean
    email: boolean
    defaultReminderTime: number
  }
  ai: {
    autoCreate: boolean
  }
  schedule: {
    showWeekends: boolean
  }
}

const handleError = (error: unknown, context: string): string => {
  console.error(`${context}:`, error)
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const Settings = observer(function Settings(): JSX.Element {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingsType>({
    version: CURRENT_SETTINGS_VERSION,
    notifications: {
      push: false,
      email: false,
      defaultReminderTime: 30
    },
    ai: {
      autoCreate: false
    },
    schedule: {
      showWeekends: true
    }
  })
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
  const [showChangelog, setShowChangelog] = useState(false)

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

  const updateSettings = <T extends boolean | number>(
    path: (keyof SettingsType | string)[],
    value: T
  ): void => {
    setSettings((prev) => {
      const newSettings = structuredClone(prev)
      let current = newSettings as SettingsType
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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your application preferences</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Change the appearance of the app</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 mt-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <Label htmlFor="showWeekends" className="hover:cursor-pointer">
                          Show Weekends
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Display Saturday and Sunday columns in schedule view
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="showWeekends"
                      checked={settings.schedule.showWeekends}
                      onCheckedChange={(checked) =>
                        updateSettings(['schedule', 'showWeekends'], checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>App Information</CardTitle>
                  <CardDescription>Details about your DashboardMate installation</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => setShowChangelog(true)}
                >
                  <History className="mr-2 h-4 w-4" />
                  Changelog
                </Button>
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
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const permission =
                          await taskStore.rootStore.notificationService.requestPermission()
                        if (permission === 'granted') {
                          updateSettings(['notifications', 'push'], true)
                          toast({
                            title: 'Notifications enabled',
                            description: 'You will now receive notifications for task updates.'
                          })
                        } else {
                          toast({
                            title: 'Notifications not available',
                            description:
                              permission === 'not-supported'
                                ? 'Notifications are not supported on your system.'
                                : 'Please enable notifications in your system settings.',
                            variant: 'destructive'
                          })
                        }
                      } else {
                        updateSettings(['notifications', 'push'], false)
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <Label>Default Reminder Time</Label>
                      <p className="text-sm text-muted-foreground">
                        When to send notifications before task due dates
                      </p>
                    </div>
                  </div>
                  <Select
                    value={settings.notifications.defaultReminderTime.toString()}
                    onValueChange={(value) => {
                      updateSettings(['notifications', 'defaultReminderTime'], parseInt(value, 10))
                    }}
                    disabled={!settings.notifications.push}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select reminder time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="120">2 hours before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
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

      <ChangelogDialog open={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  )
})
