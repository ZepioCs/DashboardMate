import { observer } from 'mobx-react-lite'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Trash2, GripVertical, Calendar, MoreVertical, CheckCircle2 } from 'lucide-react'
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
          'group relative flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md dark:bg-card/50',
          'max-w-full w-full',
          isDragging && 'opacity-50 ring-2 ring-primary'
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium leading-tight truncate">{task.title}</h3>
            {task.description && (
              <div
                className="mt-1 line-clamp-2 text-sm text-muted-foreground break-words [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80"
                dangerouslySetInnerHTML={{
                  __html: task.description
                }}
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.tagName === 'A') {
                    e.stopPropagation()
                    const href = target.getAttribute('href')
                    if (href) {
                      window.open(href, '_blank')
                    }
                  }
                }}
              />
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2 max-w-full">
              <Badge
                variant="outline"
                className={cn(
                  'capitalize text-xs',
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
              <div className="flex items-center gap-2 flex-wrap">
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                )}
                {task.status === 'done' && task.completedAt && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed {format(new Date(task.completedAt), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1">
          <div className="absolute -inset-2 rounded bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          {isNewTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 relative z-10"
              onClick={handleDeleteTask}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 relative z-10"
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
            className="cursor-grab active:cursor-grabbing relative z-10"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
      <TaskDialog task={task} open={isDialogOpen} onClose={handleDialogClose} />
    </>
  )
})
