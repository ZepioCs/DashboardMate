import { observer } from 'mobx-react-lite'
import { useStore } from '../stores/StoreProvider'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog'
import { Task, TaskHistory } from '../models'
import { useState, useMemo } from 'react'
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
  ChevronUp,
  Search,
  Filter,
  RotateCcw,
  History as HistoryRestore
} from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu'
import { useToast } from '../components/ui/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'

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
  const { toast } = useToast()
  const { taskStore } = useStore()
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [entryToRestore, setEntryToRestore] = useState<TaskHistory | null>(null)

  const handleRestore = async (entry: TaskHistory): Promise<void> => {
    try {
      if (!task) return
      await taskStore.restoreTaskToState(task.id, entry)
      await taskStore.loadTasks()
      toast({
        title: 'State Restored',
        description: 'Task has been restored to the selected state.'
      })
      setRestoreDialogOpen(false)
      setEntryToRestore(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore task state.',
        variant: 'destructive'
      })
    }
  }

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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full border bg-background p-1 shrink-0">{icon}</div>
                        <div className="min-w-0">
                          <h4 className="font-medium">{label}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.timestamp), 'PPp')}
                          </div>
                        </div>
                      </div>
                      <Dialog
                        open={restoreDialogOpen && entryToRestore?.id === entry.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setRestoreDialogOpen(false)
                            setEntryToRestore(null)
                          }
                        }}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEntryToRestore(entry)
                                  setRestoreDialogOpen(true)
                                }}
                              >
                                <HistoryRestore className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                          </Tooltip>
                        </TooltipProvider>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Restore Task State</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to restore the task to this state? This will
                              revert all changes made after this point.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRestoreDialogOpen(false)
                                setEntryToRestore(null)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={() => entryToRestore && handleRestore(entryToRestore)}>
                              Restore State
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
  const { toast } = useToast()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'inProgress' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'changes'>('recent')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [taskToReset, setTaskToReset] = useState<string | null>(null)

  // Get tasks that have history entries and apply filters
  const filteredTasks = useMemo(() => {
    return taskStore.tasks
      .filter((task) => task.history && task.history.length > 0)
      .filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        return matchesSearch && matchesStatus && matchesPriority
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        }
        return b.history.length - a.history.length
      })
  }, [taskStore.tasks, searchQuery, statusFilter, priorityFilter, sortBy])

  const handleResetHistory = async (taskId: string): Promise<void> => {
    try {
      await taskStore.resetTaskHistory(taskId)

      // Close the dialog
      setResetDialogOpen(false)
      setTaskToReset(null)

      // Show success toast
      toast({
        title: 'History Deleted',
        description: 'Task history has been successfully deleted.'
      })
    } catch (error) {
      console.error('Failed to reset task history:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task history.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Task History</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value: 'recent' | 'changes') => setSortBy(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="changes">Most Changes</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Status</p>
                        <Select
                          value={statusFilter}
                          onValueChange={(value: 'all' | 'todo' | 'inProgress' | 'done') =>
                            setStatusFilter(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Priority</p>
                        <Select
                          value={priorityFilter}
                          onValueChange={(value: 'all' | 'low' | 'medium' | 'high') =>
                            setPriorityFilter(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setPriorityFilter('all')
                      setSortBy('recent')
                    }}
                  >
                    Reset filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      await taskStore.loadTasks()
                      toast({
                        title: 'Refreshed',
                        description: 'Task history has been refreshed.'
                      })
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh history</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-sm text-muted-foreground">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} with history
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="mt-16 rounded-lg border border-dashed p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No History Available</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'No tasks match your current filters.'
                      : "When you make changes to your tasks, they'll be tracked and displayed here for reference."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'group relative rounded-xl border bg-card/50 p-6 transition-all',
                        'hover:bg-muted/50 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium truncate">{task.title}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 px-2.5 py-0.5 text-sm',
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
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize px-2.5 py-0.5',
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
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <HistoryIcon className="h-4 w-4" />
                              {task.history.length} changes
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Updated {format(new Date(task.updatedAt), 'PPp')}
                            </span>
                            {task.status === 'done' && task.completedAt && (
                              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Completed {format(new Date(task.completedAt), 'PPp')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Dialog
                              open={resetDialogOpen && taskToReset === task.id}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setResetDialogOpen(false)
                                  setTaskToReset(null)
                                }
                              }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setTaskToReset(task.id)
                                      setResetDialogOpen(true)
                                    }}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset history</p>
                                </TooltipContent>
                              </Tooltip>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset Task History</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete all history entries for this
                                    task? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setResetDialogOpen(false)
                                      setTaskToReset(null)
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => taskToReset && handleResetHistory(taskToReset)}
                                    variant="destructive"
                                  >
                                    Delete History
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setSelectedTask(task)}
                                >
                                  <HistoryRestore className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View history</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </main>

      <HistoryDialog
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
})
