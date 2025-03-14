import { makeAutoObservable } from 'mobx'

export type NotificationPermission = 'granted' | 'denied' | 'not-supported'

export class NotificationService {
  permission: NotificationPermission = 'denied'

  constructor() {
    makeAutoObservable(this)
    this.checkPermission()
  }

  async checkPermission(): Promise<void> {
    try {
      const permission = await window.electron.ipcRenderer.invoke('check-notification-permission')
      this.permission = permission as NotificationPermission
    } catch (error) {
      console.error('Failed to check notification permission:', error)
      this.permission = 'not-supported'
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await window.electron.ipcRenderer.invoke('request-notification-permission')
      this.permission = permission as NotificationPermission
      return this.permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      this.permission = 'not-supported'
      return 'not-supported'
    }
  }

  async notify(
    title: string,
    body: string,
    urgency: 'normal' | 'critical' | 'low' = 'normal'
  ): Promise<boolean> {
    if (this.permission !== 'granted') {
      return false
    }

    try {
      return await window.electron.ipcRenderer.invoke('send-notification', { title, body, urgency })
    } catch (error) {
      console.error('Failed to send notification:', error)
      return false
    }
  }
}
