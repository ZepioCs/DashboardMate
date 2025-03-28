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

export type TaskHistoryType =
  | 'status_change'
  | 'priority_change'
  | 'due_date_change'
  | 'description_change'
  | 'title_change'

export interface TaskHistory {
  id: string
  type: TaskHistoryType
  timestamp: string
  oldValue?: string
  newValue: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  notificationTime?: number // minutes before due date to send notification
  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
  notes: TaskNote[]
  tags?: string[]
  subtasks?: Subtask[]
  history: TaskHistory[]
}
