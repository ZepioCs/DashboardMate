import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { X, Calendar, AlertCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Task, TaskPriority, TaskNote } from '../models'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../stores/StoreProvider'
import { DateTimePicker } from './ui/date-time-picker'
import { Separator } from './ui/separator'
import { useToast } from './ui/use-toast'

interface TaskDialogProps {
  task: Task | undefined
  onClose: () => void
  open: boolean
}

export function TaskDialog({ task, onClose, open }: TaskDialogProps): JSX.Element | null {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDateTime, setDueDateTime] = useState<Date | undefined>(undefined)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')

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

  const handleSave = useCallback((): void => {
    if (!task || !title.trim()) return

    taskStore.updateTask(task.id, {
      title: title.trim(),
      description,
      priority,
      dueDate: dueDateTime?.toISOString()
    })
    setIsEditing(false)
  }, [task, taskStore, title, description, priority, dueDateTime])

  const handleAddNote = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault()
      if (!task || !newNote.trim()) return

      // Initialize notes array if it doesn't exist
      if (!task.notes) {
        task.notes = []
      }

      taskStore.addNote(task.id, newNote.trim())
      setNewNote('')
    },
    [task, newNote, taskStore]
  )

  const handleDeleteNote = useCallback(
    (noteId: string): void => {
      if (!task) return
      taskStore.deleteNote(task.id, noteId)
      toast({
        title: 'Note deleted',
        description: 'The note has been successfully deleted.'
      })
    },
    [task, taskStore, toast]
  )

  const handleEditNote = useCallback((note: TaskNote): void => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }, [])

  const handleSaveNote = useCallback((): void => {
    if (!task || !editingNoteId || !editingNoteContent.trim()) return
    taskStore.updateNote(task.id, editingNoteId, editingNoteContent.trim())
    setEditingNoteId(null)
    setEditingNoteContent('')
  }, [task, editingNoteId, editingNoteContent, taskStore])

  const handleCancelEditNote = useCallback((): void => {
    setEditingNoteId(null)
    setEditingNoteContent('')
  }, [])

  // If no task is provided or dialog is not open, don't render anything
  if (!task || !open) return null

  const isNewTask = new Date().getTime() - new Date(task.createdAt).getTime() < 24 * 60 * 60 * 1000
  const notes = task.notes || []

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold w-full"
                />
              ) : (
                <Dialog.Title className="text-xl font-semibold break-words pr-4">
                  {task.title}
                </Dialog.Title>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
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
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

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
                          'min-h-[200px] h-[200px] w-full resize-none p-4 text-sm focus-visible:outline-none',
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
                    <Badge variant="outline" className="capitalize">
                      Status: {task.status.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Badge>
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
                          'h-[200px] overflow-y-auto',
                          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-md'
                        )}
                      >
                        {task.description || 'No description provided'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Task Details</h4>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span>{format(new Date(task.createdAt), 'PPp')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated</span>
                        <span>{format(new Date(task.updatedAt), 'PPp')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Task ID</span>
                        <code className="rounded bg-muted px-1 font-mono">{task.id}</code>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
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
              <div className="h-[400px] rounded-md border p-4">
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
                              <Input
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                className="w-full"
                              />
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
                            <div className="text-sm">{note.content}</div>
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
                            <AlertDialog.Root>
                              <AlertDialog.Trigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Portal>
                                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                                <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                                  <AlertDialog.Title className="text-lg font-semibold">
                                    Delete Note
                                  </AlertDialog.Title>
                                  <AlertDialog.Description className="text-sm text-muted-foreground">
                                    Are you sure you want to delete this note? This action cannot be
                                    undone.
                                  </AlertDialog.Description>
                                  <div className="flex justify-end gap-2">
                                    <AlertDialog.Cancel asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleDeleteNote(note.id)}
                                      >
                                        Delete
                                      </Button>
                                    </AlertDialog.Action>
                                  </div>
                                </AlertDialog.Content>
                              </AlertDialog.Portal>
                            </AlertDialog.Root>
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
