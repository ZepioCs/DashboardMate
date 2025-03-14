import { Task, TaskNote, TaskStatus, TaskHistory, TaskHistoryType, TaskPriority } from '../models'
import { makeAutoObservable } from 'mobx'
import type { RootStore } from './RootStore'

export class TaskStore {
  rootStore: RootStore
  tasks: Task[] = []
  isLoading = true
  private notificationTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this)
    this.loadTasks()
    this.setupAutoArchive()
  }

  async loadTasks(): Promise<void> {
    try {
      this.isLoading = true
      const data = await window.api.loadTodos()
      const tasks = JSON.parse(data)
      // Ensure each task has a notes array
      this.tasks = tasks.map((task: Task) => ({
        ...task,
        notes: task.notes || []
      }))
    } catch (error) {
      console.error('Failed to load tasks:', error)
      this.tasks = []
    } finally {
      this.isLoading = false
    }
  }

  private async saveTasks(): Promise<void> {
    try {
      await window.api.saveTodos(JSON.stringify(this.tasks))
    } catch (error) {
      console.error('Failed to save tasks:', error)
    }
  }

  async addTask(
    task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'notes' | 'history'>
  ): Promise<void> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      history: [
        {
          id: crypto.randomUUID(),
          type: 'status_change',
          timestamp: new Date().toISOString(),
          newValue: 'todo'
        }
      ]
    }
    this.tasks.push(newTask)
    await this.saveTasks()
  }

  private createHistoryEntry(
    type: TaskHistoryType,
    oldValue: string | undefined,
    newValue: string
  ): TaskHistory {
    return {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      oldValue,
      newValue
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return

      const oldTask = this.tasks[taskIndex]
      const historyEntries: TaskHistory[] = []

      // Track changes
      if (updates.title && updates.title !== oldTask.title) {
        historyEntries.push(this.createHistoryEntry('title_change', oldTask.title, updates.title))
      }
      if (updates.description && updates.description !== oldTask.description) {
        historyEntries.push(
          this.createHistoryEntry('description_change', oldTask.description, updates.description)
        )
      }
      if (updates.priority && updates.priority !== oldTask.priority) {
        historyEntries.push(
          this.createHistoryEntry('priority_change', oldTask.priority, updates.priority)
        )
      }
      if (updates.status && updates.status !== oldTask.status) {
        historyEntries.push(
          this.createHistoryEntry('status_change', oldTask.status, updates.status)
        )
      }
      if (updates.dueDate && updates.dueDate !== oldTask.dueDate) {
        historyEntries.push(
          this.createHistoryEntry('due_date_change', oldTask.dueDate, updates.dueDate)
        )
      }

      const updatedTask = {
        ...oldTask,
        ...updates,
        updatedAt: new Date().toISOString(),
        history: [...(oldTask.history || []), ...historyEntries]
      }

      // Add completedAt if task is being marked as done
      if (updates.status === 'done' && oldTask.status !== 'done') {
        updatedTask.completedAt = new Date().toISOString()
        // Clear notification timer when task is completed
        this.clearNotificationTimer(taskId)

        await this.rootStore.notificationService.notify(
          'Task Completed! 🎉',
          `"${updatedTask.title}" has been marked as complete.`,
          'normal'
        )
      }

      this.tasks[taskIndex] = updatedTask

      // Schedule notification if due date changed
      if (updates.dueDate) {
        this.scheduleNotification(updatedTask)
      }

      await this.saveTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }

  async addNote(taskId: string, content: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId)
    if (taskIndex !== -1) {
      // Initialize notes array if it doesn't exist
      if (!this.tasks[taskIndex].notes) {
        this.tasks[taskIndex].notes = []
      }
      const note: TaskNote = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.tasks[taskIndex].notes.push(note)
      this.tasks[taskIndex].updatedAt = new Date().toISOString()
      await this.saveTasks()
    }
  }

  async updateNote(taskId: string, noteId: string, content: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId)
    if (taskIndex !== -1) {
      const noteIndex = this.tasks[taskIndex].notes.findIndex((note) => note.id === noteId)
      if (noteIndex !== -1) {
        this.tasks[taskIndex].notes[noteIndex] = {
          ...this.tasks[taskIndex].notes[noteIndex],
          content,
          updatedAt: new Date().toISOString()
        }
        this.tasks[taskIndex].updatedAt = new Date().toISOString()
        await this.saveTasks()
      }
    }
  }

  async deleteNote(taskId: string, noteId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId)
    if (taskIndex !== -1 && this.tasks[taskIndex].notes) {
      this.tasks[taskIndex].notes = this.tasks[taskIndex].notes.filter((note) => note.id !== noteId)
      this.tasks[taskIndex].updatedAt = new Date().toISOString()
      await this.saveTasks()
    }
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.status = newStatus
      task.updatedAt = new Date().toISOString()
      if (newStatus === 'done') {
        task.completedAt = new Date().toISOString()
      } else {
        task.completedAt = undefined
      }
      await this.saveTasks()
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks = this.tasks.filter((task) => task.id !== taskId)
    await this.saveTasks()
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((task) => task.status === status)
  }

  async moveTask(id: string, newStatus: TaskStatus): Promise<void> {
    await this.updateTask(id, { status: newStatus })
    await this.updateTaskStatus(id, newStatus)
  }

  async updateTaskOrder(tasks: Task[]): Promise<void> {
    this.tasks = tasks
    await this.saveTasks()
  }

  async exportTasks(): Promise<void> {
    try {
      await window.api.exportTodos(JSON.stringify(this.tasks))
    } catch (error) {
      console.error('Failed to export tasks:', error)
      throw error
    }
  }

  async importTasks(): Promise<void> {
    try {
      const data = await window.api.importTodos()
      if (data) {
        const tasks = JSON.parse(data)
        this.tasks = tasks.map((task: Task) => ({
          ...task,
          notes: task.notes || []
        }))
        await this.saveTasks()
      }
    } catch (error) {
      console.error('Failed to import tasks:', error)
      throw error
    }
  }

  private setupAutoArchive(): void {
    // Check for tasks to archive every hour
    setInterval(
      () => {
        this.autoArchiveTasks()
      },
      60 * 60 * 1000
    )
    // Run initial check
    this.autoArchiveTasks()
  }

  private async autoArchiveTasks(): Promise<void> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    let hasChanges = false
    this.tasks.forEach((task) => {
      if (
        task.status === 'done' &&
        task.completedAt &&
        new Date(task.completedAt) < oneWeekAgo &&
        !task.archivedAt
      ) {
        task.status = 'archived'
        task.archivedAt = new Date().toISOString()
        hasChanges = true
      }
    })

    if (hasChanges) {
      await this.saveTasks()
    }
  }

  async archiveTask(taskId: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.status = 'archived'
      task.archivedAt = new Date().toISOString()
      await this.saveTasks()
    }
  }

  async unarchiveTask(taskId: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task && task.status === 'archived') {
      task.status = task.completedAt ? 'done' : 'todo'
      task.archivedAt = undefined
      await this.saveTasks()
    }
  }

  getArchivedTasks(): Task[] {
    return this.tasks.filter((task) => task.status === 'archived')
  }

  private async scheduleNotification(task: Task): Promise<void> {
    // Clear existing timer if any
    this.clearNotificationTimer(task.id)

    if (!task.dueDate || task.status === 'done' || task.status === 'archived') {
      return
    }

    try {
      // Get settings
      const settingsData = await window.api.loadSettings()
      const settings = JSON.parse(settingsData)

      if (!settings?.notifications?.push) {
        return // Don't schedule if notifications are disabled
      }

      const defaultReminderTime = settings?.notifications?.defaultReminderTime ?? 30 // fallback to 30 minutes

      const dueDate = new Date(task.dueDate)
      const notificationTime = new Date(dueDate.getTime() - defaultReminderTime * 60 * 1000)
      const now = new Date()

      // Don't schedule if notification time is in the past
      if (notificationTime <= now) {
        return
      }

      // Schedule notification
      const timer = setTimeout(async () => {
        await this.rootStore.notificationService.notify(
          'Task Due Soon! ⏰',
          `"${task.title}" is due in ${defaultReminderTime} minute${defaultReminderTime !== 1 ? 's' : ''}.`,
          'normal'
        )
        this.notificationTimers.delete(task.id)
      }, notificationTime.getTime() - now.getTime())

      this.notificationTimers.set(task.id, timer)
    } catch (error) {
      console.error('Failed to schedule notification:', error)
    }
  }

  private clearNotificationTimer(taskId: string): void {
    const timer = this.notificationTimers.get(taskId)
    if (timer) {
      clearTimeout(timer)
      this.notificationTimers.delete(taskId)
    }
  }

  // Clean up notification timers when component unmounts
  dispose(): void {
    this.notificationTimers.forEach((timer) => clearTimeout(timer))
    this.notificationTimers.clear()
  }

  async resetTaskHistory(taskId: string): Promise<void> {
    try {
      const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return

      // Keep only the initial history entry
      const initialHistory = this.tasks[taskIndex].history[0]
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        history: [initialHistory],
        updatedAt: new Date().toISOString()
      }

      await this.saveTasks()
    } catch (error) {
      console.error('Failed to reset task history:', error)
      throw error
    }
  }

  async restoreTaskToState(taskId: string, historyEntry: TaskHistory): Promise<void> {
    try {
      const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return

      const task = this.tasks[taskIndex]
      const entryIndex = task.history.findIndex((h) => h.id === historyEntry.id)
      if (entryIndex === -1) return

      // Get all history entries up to and including the selected entry
      const newHistory = task.history.slice(0, entryIndex + 1)

      // Apply the state from the history entry
      const updates: Partial<Task> = {}
      switch (historyEntry.type) {
        case 'status_change':
          updates.status = historyEntry.newValue as TaskStatus
          break
        case 'priority_change':
          updates.priority = historyEntry.newValue as TaskPriority
          break
        case 'title_change':
          updates.title = historyEntry.newValue
          break
        case 'description_change':
          updates.description = historyEntry.newValue
          break
        case 'due_date_change':
          updates.dueDate = historyEntry.newValue
          break
      }

      // Update the task with the historical state and new history
      this.tasks[taskIndex] = {
        ...task,
        ...updates,
        history: newHistory,
        updatedAt: new Date().toISOString()
      }

      await this.saveTasks()
    } catch (error) {
      console.error('Failed to restore task state:', error)
      throw error
    }
  }
}
