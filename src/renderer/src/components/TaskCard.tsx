import { observer } from 'mobx-react-lite'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Trash2, GripVertical, Calendar, MoreVertical } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { Task, TaskStatus } from '../models'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { useStore } from '../stores/StoreProvider'
import { Badge } from './ui/badge'
import { useState, useCallback } from 'react'
import { TaskDialog } from './TaskDialog'

interface TaskCardProps {
  task: Task
}

const statusOptions: Array<{ label: string; value: TaskStatus }> = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'inProgress' },
  { label: 'Done', value: 'done' }
]

export const TaskCard = observer(function TaskCard({ task }: TaskCardProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { taskStore } = useStore()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const isNewTask = new Date().getTime() - new Date(task.createdAt).getTime() < 24 * 60 * 60 * 1000 // 24 hours

  const handleDialogClose = useCallback((): void => {
    setIsDialogOpen(false)
  }, [])

  const handleCardClick = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDialogOpen(true)
  }, [])

  const handleDeleteTask = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      taskStore.deleteTask(task.id)
    },
    [task.id, taskStore]
  )

  const handleStatusChange = useCallback(
    (status: TaskStatus): void => {
      taskStore.updateTaskStatus(task.id, status)
    },
    [task.id, taskStore]
  )

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md dark:bg-card/50',
          isDragging && 'opacity-50'
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-medium leading-none">{task.title}</h3>
            {task.description && (
              <div
                className="line-clamp-2 text-sm text-muted-foreground [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            )}
            <Badge
              variant="outline"
              className={cn(
                'capitalize',
                task.priority === 'low' &&
                  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
                task.priority === 'medium' &&
                  'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
                task.priority === 'high' &&
                  'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
              )}
            >
              {task.priority}
            </Badge>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {statusOptions.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                  >
                    Move to {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {isNewTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleDeleteTask}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <TaskDialog task={task} open={isDialogOpen} onClose={handleDialogClose} />
    </>
  )
})
