import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus } from 'lucide-react'
import { taskStore } from '../stores/TaskStore'
import { observer } from 'mobx-react-lite'
import { cn } from '../lib/utils'
import { DateTimePicker } from './ui/date-time-picker'
import { TaskPriority } from '../models'

export const AddTaskDialog = observer(function AddTaskDialog(): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<TaskPriority>('medium')
  const [dueDateTime, setDueDateTime] = React.useState<Date | undefined>()

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    taskStore.addTask({
      title,
      description,
      priority,
      dueDate: dueDateTime?.toISOString()
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = (): void => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDateTime(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with title, description, priority, and due date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className="w-full"
            />
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
            <Label>Due Date & Time</Label>
            <DateTimePicker date={dueDateTime} onSelect={setDueDateTime} />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})
