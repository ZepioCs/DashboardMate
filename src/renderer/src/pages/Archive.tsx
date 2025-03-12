import { observer } from 'mobx-react-lite'
import { useStore } from '../stores/StoreProvider'
import { format } from 'date-fns'
import { Archive as ArchiveIcon, Calendar, CheckCircle2, RotateCcw, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
  DialogTrigger
} from '../components/ui/dialog'
import { useToast } from '../components/ui/use-toast'
import { useState } from 'react'

export const Archive = observer(function Archive(): JSX.Element {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const [unarchiveTaskId, setUnarchiveTaskId] = useState<string | null>(null)
  const [viewTaskId, setViewTaskId] = useState<string | null>(null)
  const archivedTasks = taskStore.getArchivedTasks()

  const handleUnarchive = async (taskId: string): Promise<void> => {
    try {
      await taskStore.unarchiveTask(taskId)
      toast({
        title: 'Task unarchived',
        description: 'The task has been moved back to its previous status.'
      })
      setUnarchiveTaskId(null)
    } catch (error) {
      console.error('Failed to unarchive task:', error)
      toast({
        title: 'Error',
        description: 'Failed to unarchive task. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <ArchiveIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">Archive</h1>
              <p className="text-sm text-muted-foreground">View and manage archived tasks</p>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {archivedTasks.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border bg-muted/10 p-8 text-center">
              <ArchiveIcon className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="font-semibold">No archived tasks</h3>
              <p className="text-sm text-muted-foreground">
                Tasks that are completed for more than a week will appear here
              </p>
            </div>
          ) : (
            archivedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border bg-muted/10 p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.title}</span>
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {task.completedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed {format(new Date(task.completedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                    {task.archivedAt && (
                      <span className="flex items-center gap-1">
                        <ArchiveIcon className="h-3 w-3" />
                        Archived {format(new Date(task.archivedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Dialog
                    open={viewTaskId === task.id}
                    onOpenChange={(open) => !open && setViewTaskId(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewTaskId(task.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg data-[state=closed]:animate-[dialog-content-hide_200ms] data-[state=open]:animate-[dialog-content-show_200ms]">
                      <DialogTitle className="text-xl font-semibold border-b pb-4">
                        {task.title}
                      </DialogTitle>
                      <div className="mt-6 space-y-6">
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
                          {task.status && (
                            <Badge variant="secondary" className="capitalize">
                              {task.status}
                            </Badge>
                          )}
                          {task.tags &&
                            task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="bg-muted">
                                {tag}
                              </Badge>
                            ))}
                        </div>

                        {task.description && (
                          <div className="space-y-2.5 rounded-lg border bg-muted/50 p-4">
                            <h3 className="font-semibold text-sm">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {task.description}
                            </p>
                          </div>
                        )}

                        {task.notes && task.notes.length > 0 && (
                          <div className="space-y-2.5 rounded-lg border bg-muted/50 p-4">
                            <h3 className="font-semibold text-sm">Notes</h3>
                            <div className="space-y-3">
                              {task.notes.map((note) => (
                                <div key={note.id} className="space-y-1">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {note.content}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Added {format(new Date(note.createdAt), 'PPp')}
                                    {note.updatedAt !== note.createdAt &&
                                      ` • Updated ${format(new Date(note.updatedAt), 'PPp')}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2.5 rounded-lg border bg-muted/50 p-4">
                          <h3 className="font-semibold text-sm">Timeline</h3>
                          <div className="grid gap-2 text-sm text-muted-foreground">
                            {task.createdAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created: {format(new Date(task.createdAt), 'PPpp')}</span>
                              </div>
                            )}
                            {task.completedAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Completed: {format(new Date(task.completedAt), 'PPpp')}</span>
                              </div>
                            )}
                            {task.archivedAt && (
                              <div className="flex items-center gap-2">
                                <ArchiveIcon className="h-4 w-4" />
                                <span>Archived: {format(new Date(task.archivedAt), 'PPpp')}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(task.dueDate), 'PPpp')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-2.5 rounded-lg border bg-muted/50 p-4">
                            <h3 className="font-semibold text-sm">Subtasks</h3>
                            <div className="space-y-2">
                              {task.subtasks.map((subtask, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2
                                    className={cn(
                                      'h-4 w-4 mt-0.5',
                                      subtask.completed ? 'text-green-500' : 'text-muted-foreground'
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      subtask.completed && 'line-through text-muted-foreground'
                                    )}
                                  >
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogClose asChild>
                        <Button
                          className="mt-6"
                          variant="outline"
                          onClick={() => setViewTaskId(null)}
                        >
                          Close
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={unarchiveTaskId === task.id}
                    onOpenChange={(open) => !open && setUnarchiveTaskId(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setUnarchiveTaskId(task.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg data-[state=closed]:animate-[dialog-content-hide_200ms] data-[state=open]:animate-[dialog-content-show_200ms]">
                      <DialogTitle className="text-lg font-semibold">Unarchive Task</DialogTitle>
                      <DialogDescription className="mt-2 text-sm text-muted-foreground">
                        Are you sure you want to unarchive this task? It will be moved back to its
                        previous status.
                      </DialogDescription>

                      <div className="mt-6 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button variant="outline" onClick={() => setUnarchiveTaskId(null)}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button onClick={() => handleUnarchive(task.id)}>Unarchive</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
})
