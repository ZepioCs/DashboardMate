import { observer } from 'mobx-react-lite'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { taskStore } from '../stores/TaskStore'
import { cn } from '../lib/utils'
import { AddTaskDialog } from './AddTaskDialog'
import { ScrollArea } from './ui/scroll-area'
import { Task, TaskStatus } from '../models'
const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-blue-500/20' },
  { id: 'inProgress', title: 'In Progress', color: 'border-yellow-500/20' },
  { id: 'done', title: 'Done', color: 'border-green-500/20' }
]

export const KanbanBoard = observer(function KanbanBoard(): JSX.Element {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8
      }
    })
  )

  const handleDragStart = (event: DragStartEvent): void => {
    const task = taskStore.tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent): void => {
    const { active, over } = event
    if (!over) return

    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    const overId = over.id

    if (!activeTask) return

    // Dropping over a column
    if (columns.find((col) => col.id === overId)) {
      const newStatus = overId as TaskStatus
      if (activeTask.status !== newStatus) {
        taskStore.moveTask(activeTask.id, newStatus)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // If dropping over another task
    const overTask = taskStore.tasks.find((t) => t.id === over.id)
    if (overTask) {
      const activeIndex = taskStore.tasks.findIndex((t) => t.id === active.id)
      const overIndex = taskStore.tasks.findIndex((t) => t.id === over.id)
      if (activeIndex !== overIndex) {
        const newTasks = arrayMove(taskStore.tasks, activeIndex, overIndex)
        taskStore.updateTaskOrder(newTasks)
      }
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <h1 className="text-xl font-semibold">Tasks</h1>
          <div className="flex-1" />
          <AddTaskDialog />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
            {columns.map((column) => {
              const tasks = taskStore.getTasksByStatus(column.id)
              return (
                <div
                  key={column.id}
                  id={column.id}
                  className={cn(
                    'flex flex-col rounded-lg border bg-card/50 shadow-sm dark:bg-muted/50',
                    'border-t-4',
                    column.color
                  )}
                >
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">{column.title}</h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {tasks.length}
                      </span>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 max-h-[calc(100vh-10rem)]">
                    <div className="p-4">
                      <div className="space-y-4">
                        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                          {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </SortableContext>
                        {tasks.length === 0 && (
                          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
          <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
        </DndContext>
      </main>
    </div>
  )
})
