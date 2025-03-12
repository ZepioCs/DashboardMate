export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'inProgress' | 'done' | 'archived'

export interface TaskNote {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
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
  archivedAt?: string
  notes: TaskNote[]
  tags?: string[]
  subtasks?: Subtask[]
}
