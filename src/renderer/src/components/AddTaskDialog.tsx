import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, X } from 'lucide-react'
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-xl font-semibold">Add New Task</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted-foreground">
            Create a new task with title, description, priority, and due date.
          </Dialog.Description>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})
