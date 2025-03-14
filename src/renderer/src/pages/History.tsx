import { observer } from 'mobx-react-lite'
import { useStore } from '../stores/StoreProvider'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Task } from '../models'
import { useState } from 'react'
import { Badge } from '../components/ui/badge'
import { cn } from '../lib/utils'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  History as HistoryIcon,
  Clock,
  ArrowRight,
  Tag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Separator } from '../components/ui/separator'

interface HistoryDialogProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

const formatStatusValue = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'To Do'
    case 'inProgress':
      return 'In Progress'
    case 'done':
      return 'Done'
    case 'archived':
      return 'Archived'
    default:
      return status
  }
}

const isCompactValue = (type: string, value: string): boolean => {
  return (
    type === 'status_change' ||
    type === 'priority_change' ||
    (typeof value === 'string' && value.length < 50)
  )
}

const CompactValue = ({ value, type }: { value: string; type: string }): JSX.Element => {
  const displayValue = type === 'status_change' ? formatStatusValue(value) : value
  return (
    <div className="rounded-md bg-muted/50 px-2.5 py-1.5 font-mono text-sm">{displayValue}</div>
  )
}

const CollapsibleValue = ({ value, type }: { value: string; type: string }): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayValue = type === 'status_change' ? formatStatusValue(value) : value

  if (isCompactValue(type, value)) {
    return <CompactValue value={value} type={type} />
  }

  return (
    <div
      className={cn(
        'relative rounded-md bg-muted/50 cursor-pointer group',
        'transition-all duration-200'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <pre
        className={cn(
          'p-2.5 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden',
          'w-full max-w-full',
          isExpanded ? 'max-h-none' : 'max-h-24'
        )}
      >
        {displayValue}
      </pre>
      {!isExpanded && value.length > 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/80 to-transparent pointer-events-none" />
      )}
      <button
        className={cn(
          'absolute right-2 bottom-1 p-1 rounded-full',
          'bg-background/80 backdrop-blur-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'border shadow-sm'
        )}
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
      >
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}

const getHistoryLabel = (type: string): { label: string; icon: JSX.Element } => {
  switch (type) {
    case 'status_change':
      return { label: 'Status Changed', icon: <Tag className="h-4 w-4" /> }
    case 'priority_change':
      return { label: 'Priority Updated', icon: <AlertCircle className="h-4 w-4" /> }
    case 'due_date_change':
      return { label: 'Due Date Modified', icon: <Calendar className="h-4 w-4" /> }
    case 'description_change':
      return { label: 'Description Updated', icon: <AlertCircle className="h-4 w-4" /> }
    case 'title_change':
      return { label: 'Title Changed', icon: <Tag className="h-4 w-4" /> }
    default:
      return { label: type, icon: <AlertCircle className="h-4 w-4" /> }
  }
}

const HistoryDialog = ({ task, open, onClose }: HistoryDialogProps): JSX.Element | null => {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HistoryIcon className="h-5 w-5" />
            Task History
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {task.title}
            </Badge>
            <span>•</span>
            <span>{task.history.length} changes</span>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="relative space-y-4 pb-4">
            {task.history
              .slice()
              .reverse()
              .map((entry, index) => {
                const { label, icon } = getHistoryLabel(entry.type)
                const isCompact = entry.oldValue && isCompactValue(entry.type, entry.oldValue)

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'relative rounded-lg border bg-card/50 p-3 space-y-2',
                      index !== task.history.length - 1 &&
                        'before:absolute before:left-6 before:top-[calc(100%)] before:h-4 before:w-px before:bg-border'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full border bg-background p-1 shrink-0">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium">{label}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.timestamp), 'PPp')}
                        </div>
                      </div>
                    </div>

                    {isCompact ? (
                      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 text-sm pl-10">
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs">Previous:</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <CollapsibleValue value={entry.oldValue!} type={entry.type} />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                        <div />
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs">New:</div>
                          <CollapsibleValue value={entry.newValue} type={entry.type} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 text-sm pl-10">
                        {entry.oldValue && (
                          <div className="space-y-1">
                            <div className="text-muted-foreground text-xs">Previous value:</div>
                            <CollapsibleValue value={entry.oldValue} type={entry.type} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs">New value:</div>
                          <CollapsibleValue value={entry.newValue} type={entry.type} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export const History = observer(function History(): JSX.Element {
  const { taskStore } = useStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Get tasks that have history entries and sort by most recently updated
  const tasksWithHistory = taskStore.tasks
    .filter((task) => task.history && task.history.length > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <HistoryIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task History</h1>
          <p className="text-muted-foreground">Track changes and updates to your tasks over time</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4">
        {tasksWithHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <HistoryIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No History Available</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              When you make changes to your tasks, they&apos;ll be tracked and displayed here for
              reference.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasksWithHistory.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={cn(
                  'group relative rounded-lg border bg-card p-4 transition-all',
                  'hover:bg-muted/50 hover:shadow-md cursor-pointer'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{task.title}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0',
                          task.status === 'todo' &&
                            'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
                          task.status === 'inProgress' &&
                            'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
                          task.status === 'done' &&
                            'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                        )}
                      >
                        {task.status === 'todo' && 'To Do'}
                        {task.status === 'inProgress' && 'In Progress'}
                        {task.status === 'done' && 'Done'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
                        {task.priority} priority
                      </Badge>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <HistoryIcon className="h-3.5 w-3.5" />
                        {task.history.length} changes
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Updated {format(new Date(task.updatedAt), 'PP')}
                      </span>
                      {task.status === 'done' && task.completedAt && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed {format(new Date(task.completedAt), 'PP')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <HistoryDialog
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
})
