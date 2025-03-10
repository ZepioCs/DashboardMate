import { Task, TaskNote, TaskStatus } from '../models'
import { makeAutoObservable } from 'mobx'

export class TaskStore {
  tasks: Task[] = []
  isLoading = true

  constructor() {
    makeAutoObservable(this)
    this.loadTasks()
  }

  private async loadTasks(): Promise<void> {
    try {
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
    task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'notes'>
  ): Promise<void> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: []
    }
    this.tasks.push(newTask)
    await this.saveTasks()
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt' | 'notes'>>
  ): Promise<void> {
    const taskIndex = this.tasks.findIndex((task) => task.id === id)
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await this.saveTasks()
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
      // Set completedAt when task is moved to done
      if (newStatus === 'done') {
        task.completedAt = new Date().toISOString()
      } else {
        task.completedAt = undefined // Reset completedAt if moved out of done
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
}

export const taskStore = new TaskStore()
