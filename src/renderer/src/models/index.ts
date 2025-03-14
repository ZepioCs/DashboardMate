export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Completed = 'completed'
}

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskNote {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  dueDate?: string
  notes?: TaskNote[]
}
