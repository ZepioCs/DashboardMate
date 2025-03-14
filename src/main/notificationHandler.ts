import { Notification, ipcMain } from 'electron'
import log from 'electron-log'

// Check if notifications are supported
const isNotificationSupported = Notification.isSupported()

// Handle notification permission requests
ipcMain.handle('check-notification-permission', () => {
  if (!isNotificationSupported) {
    return 'not-supported'
  }
  // Electron doesn't have a permission system like web notifications
  // We'll return 'granted' if notifications are supported
  return 'granted'
})

// Request notification permission
ipcMain.handle('request-notification-permission', async () => {
  if (!isNotificationSupported) {
    return 'not-supported'
  }

  // Electron doesn't require explicit permission like web notifications
  // If notifications are supported, we can use them
  return 'granted'
})

// Send a notification
ipcMain.handle('send-notification', (_, { title, body, urgency = 'normal' }) => {
  if (!isNotificationSupported) {
    return false
  }

  try {
    const notification = new Notification({
      title,
      body,
      urgency, // 'normal' | 'critical' | 'low'
      silent: false
    })

    notification.show()
    return true
  } catch (error) {
    log.error('Error showing notification:', error)
    return false
  }
})

// Initialize notification handler
export function initNotificationHandler(): void {
  if (!isNotificationSupported) {
    log.warn('Notifications are not supported on this system')
    return
  }

  log.info('Notification handler initialized')
}
