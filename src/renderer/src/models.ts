export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'inProgress' | 'done'

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
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes: TaskNote[]
}
