import { useEffect, useState } from 'react'
import { LoadingScreen } from './LoadingScreen'
import { useToast } from './ui/use-toast'

interface SettingsCheckProps {
  children: React.ReactNode
}

export function SettingsCheck({ children }: SettingsCheckProps): JSX.Element {
  const [isCheckingSettings, setIsCheckingSettings] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkSettings = async (): Promise<void> => {
      try {
        // Check if settings file exists
        const settingsExist = await window.api.checkFileExists('settings')

        if (!settingsExist) {
          // Create settings file with defaults
          await window.api.createFile('settings')
          toast({
            title: 'Settings Initialized',
            description: 'Created settings file with default values.'
          })
        } else {
          try {
            // Try to load and validate settings
            await window.api.loadSettings()
          } catch (loadError) {
            console.error('Settings file is corrupted:', loadError)

            // Create a new settings file with defaults
            await window.api.createFile('settings')

            toast({
              title: 'Settings Recovery',
              description:
                'Your settings file was corrupted and has been reset to defaults. Previous settings were backed up.',
              variant: 'destructive',
              duration: 6000
            })
          }
        }
      } catch (error) {
        console.error('Failed to check/initialize settings:', error)
        toast({
          title: 'Settings Error',
          description: 'Failed to initialize settings. Some features may not work correctly.',
          variant: 'destructive'
        })
      } finally {
        setIsCheckingSettings(false)
      }
    }

    checkSettings()
  }, [])

  if (isCheckingSettings) {
    return <LoadingScreen message="Checking application settings..." />
  }

  return <>{children}</>
}
