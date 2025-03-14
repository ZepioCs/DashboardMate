import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  X,
  Calendar,
  AlertCircle,
  Trash2,
  Clock,
  CheckCircle2,
  RefreshCw,
  Hash,
  ListTodo,
  Timer,
  CheckCircle,
  Archive,
  History,
  Link,
  Copy,
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { Task, TaskPriority, TaskNote, TaskStatus } from '../models'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import * as React from 'react'
import { useStore } from '../stores/StoreProvider'
import { DateTimePicker } from './ui/date-time-picker'
import { Separator } from './ui/separator'
import { useToast } from './ui/use-toast'
import { observer } from 'mobx-react-lite'
import { ScrollArea } from './ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inProgress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
]

interface TaskDialogProps {
  task: Task | undefined
  onClose: () => void
  open: boolean
  onManualTimeAdjust?: (taskId: string) => void
}

// Create a context for force updates
export const ForceUpdateContext = createContext<(() => void) | null>(null)

export const TaskDialog = observer(function TaskDialog({
  task,
  onClose,
  open,
  onManualTimeAdjust
}: TaskDialogProps): JSX.Element | null {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const forceUpdate = useContext(ForceUpdateContext)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDateTime, setDueDateTime] = useState<Date | undefined>(undefined)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [isLinksExpanded, setIsLinksExpanded] = useState(true)

  // Reset form state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority)
      setDueDateTime(task.dueDate ? new Date(task.dueDate) : undefined)
      setIsEditing(false)
    }
  }, [task])

  // Reset editing state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setNewNote('')
    }
  }, [open])

  // Reset form state when dialog opens
  useEffect(() => {
    if (open && task) {
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority)
      setDueDateTime(task.dueDate ? new Date(task.dueDate) : undefined)
    }
  }, [open, task])

  const handleClose = useCallback((): void => {
    setIsEditing(false)
    setNewNote('')
    onClose()
  }, [onClose])

  const handleSave = async (): Promise<void> => {
    if (!task) return

    const updates: Partial<Task> = {
      title,
      description,
      priority
    }

    if (dueDateTime) {
      updates.dueDate = dueDateTime.toISOString()
      // Mark this as a manual time adjustment
      onManualTimeAdjust?.(task.id)
    }

    await taskStore.updateTask(task.id, updates)
    forceUpdate?.()
    setIsEditing(false)
  }

  const handleAddNote = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault()
      if (!task || !newNote.trim()) return

      // Initialize notes array if it doesn't exist
      if (!task.notes) {
        task.notes = []
      }

      taskStore.addNote(task.id, newNote.trim()).then(() => {
        forceUpdate?.()
        setNewNote('')
      })
    },
    [task, newNote, taskStore, forceUpdate]
  )

  const handleDeleteNote = useCallback(
    (noteId: string): void => {
      if (!task) return
      taskStore.deleteNote(task.id, noteId).then(() => {
        forceUpdate?.()
        toast({
          title: 'Note deleted',
          description: 'The note has been successfully deleted.'
        })
      })
    },
    [task, taskStore, toast, forceUpdate]
  )

  const handleEditNote = useCallback((note: TaskNote): void => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }, [])

  const handleSaveNote = useCallback((): void => {
    if (!task || !editingNoteId || !editingNoteContent.trim()) return
    taskStore.updateNote(task.id, editingNoteId, editingNoteContent.trim()).then(() => {
      forceUpdate?.()
      setEditingNoteId(null)
      setEditingNoteContent('')
    })
  }, [task, editingNoteId, editingNoteContent, taskStore, forceUpdate])

  const handleCancelEditNote = useCallback((): void => {
    setEditingNoteId(null)
    setEditingNoteContent('')
  }, [])

  const handleArchive = useCallback(async (): Promise<void> => {
    if (task) {
      await taskStore.archiveTask(task.id)
      handleClose()
      toast({
        title: 'Task archived',
        description: 'The task has been moved to the archive.'
      })
    }
  }, [task, taskStore, handleClose, toast])

  // If no task is provided or dialog is not open, don't render anything
  if (!task || !open) return null

  const isNewTask = new Date().getTime() - new Date(task.createdAt).getTime() < 24 * 60 * 60 * 1000
  const notes = task.notes || []

  const getStatusConfig = (
    status: string
  ): { icon: React.ElementType; label: string; class: string } => {
    switch (status) {
      case 'todo':
        return {
          icon: ListTodo,
          label: 'To Do',
          class:
            'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
        }
      case 'inProgress':
        return {
          icon: Timer,
          label: 'In Progress',
          class:
            'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
        }
      case 'done':
        return {
          icon: CheckCircle,
          label: 'Done',
          class:
            'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
        }
      default:
        return {
          icon: ListTodo,
          label: status,
          class: ''
        }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold w-full"
                />
              ) : (
                <DialogTitle className="text-xl font-semibold break-words pr-4">
                  {task.title}
                </DialogTitle>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <ArrowRight className="h-3.5 w-3.5 mr-1" />
                    Move to
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {columns.map((targetColumn) => {
                    if (targetColumn.id !== task.status) {
                      const StatusIcon = getStatusConfig(targetColumn.id).icon
                      return (
                        <DropdownMenuItem
                          key={targetColumn.id}
                          onClick={() => {
                            taskStore.moveTask(task.id, targetColumn.id)
                            toast({
                              title: 'Task moved',
                              description: `Task moved to ${targetColumn.title}`
                            })
                          }}
                        >
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {targetColumn.title}
                        </DropdownMenuItem>
                      )
                    }
                    return null
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {!isEditing && (
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                  <span className="sr-only">Edit task</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {isNewTask && (
              <div className="flex items-center gap-2 rounded-md bg-yellow-500/15 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span>This is a new task created within the last 24 hours</span>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={priority === p ? 'default' : 'outline'}
                        onClick={() => setPriority(p)}
                        className="flex-1 capitalize"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="rounded-md border">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter task description..."
                      className={cn(
                        'min-h-[200px] max-h-[400px] w-full resize-y p-4 text-sm focus-visible:outline-none',
                        'bg-transparent',
                        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-md'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date & Time</Label>
                  <DateTimePicker date={dueDateTime} onSelect={setDueDateTime} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
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
                  {((): JSX.Element => {
                    const statusConfig = getStatusConfig(task.status)
                    const StatusIcon = statusConfig.icon
                    return (
                      <Badge
                        variant="outline"
                        className={cn('flex items-center gap-1 capitalize', statusConfig.class)}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    )
                  })()}
                  {task.dueDate && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {format(new Date(task.dueDate), 'PPp')}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Description</h4>
                  <div className="rounded-md bg-muted p-4">
                    <div
                      className={cn(
                        'text-sm whitespace-pre-wrap break-words',
                        'max-h-[150px] overflow-y-auto',
                        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-md'
                      )}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {task.description || 'No description provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Links Section */}
                <Collapsible
                  open={isLinksExpanded}
                  onOpenChange={setIsLinksExpanded}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Links
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-transform duration-200',
                            isLinksExpanded ? 'rotate-180' : ''
                          )}
                        />
                        <span className="sr-only">Toggle links</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-2">
                    <div className="rounded-lg border bg-card/50 divide-y divide-border">
                      <ScrollArea className="max-h-[250px]">
                        {task.description ? (
                          ((): JSX.Element | JSX.Element[] => {
                            const urlRegex = /(https?:\/\/[^\s]+)/g
                            const matches = task.description.match(urlRegex)

                            if (!matches) {
                              return (
                                <div className="p-3 text-sm text-muted-foreground">
                                  No links found in description
                                </div>
                              )
                            }

                            return matches.map((url, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 group hover:bg-muted/50 gap-2"
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline truncate min-w-[200px] max-w-[300px] block"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          window.open(url, '_blank')
                                        }}
                                      >
                                        {url}
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{url}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(url)
                                    toast({
                                      title: 'Link copied',
                                      description: 'The link has been copied to your clipboard.'
                                    })
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          })()
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            No description available
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Task Details</h4>
                  <div className="rounded-lg border bg-card/50 divide-y divide-border text-sm">
                    <div className="flex items-center gap-2 p-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-medium">Created</span>
                        <span className="text-muted-foreground">
                          {format(new Date(task.createdAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-medium">Last Updated</span>
                        <span className="text-muted-foreground">
                          {format(new Date(task.updatedAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    {task.completedAt && (
                      <div className="flex items-center gap-2 p-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 shrink-0" />
                        <div className="flex items-center justify-between flex-1">
                          <span className="font-medium">Completed</span>
                          <span className="text-muted-foreground">
                            {format(new Date(task.completedAt), 'PPp')}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2">
                      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="font-medium">Task ID</span>
                        <code className="font-mono text-muted-foreground text-xs bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[200px] hover:max-w-full transition-all duration-300 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
                          {task.id}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task History Section - Simplified */}
                {task.history &&
                  task.history.some((entry) => entry.type === 'description_change') && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Recent Changes
                      </h4>
                      <div className="rounded-lg border bg-card/50 p-2 text-sm text-muted-foreground">
                        Description was recently modified
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Notes & Updates</h4>
              <span className="text-sm text-muted-foreground">{notes.length} notes</span>
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <Input
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newNote.trim()}>
                Add Note
              </Button>
            </form>
            <div className="flex-1 rounded-md border p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    No notes yet. Add one to track progress or leave updates.
                  </div>
                ) : (
                  notes
                    .slice()
                    .reverse()
                    .map((note) => (
                      <div key={note.id} className="group relative space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(note.createdAt), 'PPp')}
                          {note.updatedAt !== note.createdAt && ' (edited)'}
                        </div>
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <div className="relative rounded-md border bg-muted/30">
                              <textarea
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                placeholder="Enter note content..."
                                className={cn(
                                  'w-full min-h-[100px] max-h-[300px] p-2 text-sm resize-y',
                                  'bg-transparent focus-visible:outline-none',
                                  'scrollbar-thin scrollbar-track-transparent',
                                  'scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30'
                                )}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={handleCancelEditNote}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveNote}
                                disabled={!editingNoteContent.trim()}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="relative bg-muted/30 rounded-md cursor-pointer"
                            onClick={() =>
                              setExpandedNoteId(expandedNoteId === note.id ? null : note.id)
                            }
                          >
                            <div
                              className={cn(
                                'text-sm p-2 break-words whitespace-pre-wrap',
                                'overflow-y-auto transition-all duration-300',
                                expandedNoteId === note.id ? 'max-h-[300px]' : 'max-h-[100px]',
                                'scrollbar-thin scrollbar-track-transparent',
                                'scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30'
                              )}
                            >
                              {note.content}
                            </div>
                            <div
                              className={cn(
                                'absolute bottom-0 left-0 right-0 h-6',
                                'bg-gradient-to-t from-background/80 to-transparent',
                                'pointer-events-none transition-opacity',
                                expandedNoteId === note.id ? 'opacity-0' : 'opacity-100'
                              )}
                            />
                          </div>
                        )}
                        <div className="absolute right-0 top-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {!editingNoteId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditNote(note)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this note? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.status === 'done' && !task.archivedAt && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to archive this task? You can find it later in the
                      archive section.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-9 w-9">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      taskStore.deleteTask(task.id)
                      handleClose()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
