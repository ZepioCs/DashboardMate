import { TaskStore } from './TaskStore'
import { NotificationService } from '../services/NotificationService'

export class RootStore {
  taskStore: TaskStore
  notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
    this.taskStore = new TaskStore(this)
  }
}
