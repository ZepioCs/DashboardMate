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
  useSensors,
  useDroppable
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { taskStore } from '../stores/TaskStore'
import { cn } from '../lib/utils'
import { AddTaskDialog } from './AddTaskDialog'
import { ScrollArea } from './ui/scroll-area'
import { Task, TaskStatus } from '../models'
import { closestCorners } from '@dnd-kit/core'

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-blue-500/20' },
  { id: 'inProgress', title: 'In Progress', color: 'border-yellow-500/20' },
  { id: 'done', title: 'Done', color: 'border-green-500/20' }
]

export const KanbanBoard = observer(function KanbanBoard(): JSX.Element {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)

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
    if (task && !event.active.id.toString().startsWith('placeholder-')) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent): void => {
    const { active, over } = event
    if (!over) return

    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    const overId = String(over.id)

    if (overId.startsWith('col_')) {
      const columnId = overId.replace('col_', '')
      setHoveredColumn(columnId)
    } else {
      const overTask = taskStore.tasks.find((t) => t.id === over.id)
      if (overTask) {
        setHoveredColumn(overTask.status)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    // Clear states first
    setActiveTask(null)
    setHoveredColumn(null)

    if (!over) return

    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    const overId = String(over.id)

    // Handle dropping on a column or task
    if (overId.startsWith('col_')) {
      // Dropping directly on a column
      const newStatus = overId.replace('col_', '') as TaskStatus
      taskStore.moveTask(activeTask.id, newStatus)
    } else {
      // Dropping on another task
      const overTask = taskStore.tasks.find((t) => t.id === over.id)
      if (!overTask) return

      if (activeTask.status !== overTask.status) {
        // Moving to a different column
        taskStore.moveTask(activeTask.id, overTask.status)
      } else if (activeTask.id !== overTask.id) {
        // Reordering within the same column
        const activeIndex = taskStore.tasks.findIndex((t) => t.id === active.id)
        const overIndex = taskStore.tasks.findIndex((t) => t.id === over.id)

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newTasks = arrayMove(taskStore.tasks, activeIndex, overIndex)
          taskStore.updateTaskOrder(newTasks)
        }
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
          collisionDetection={closestCorners}
        >
          <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
            {columns.map((column) => {
              const tasks = taskStore.getTasksByStatus(column.id)
              const { setNodeRef, isOver } = useDroppable({
                id: `col_${column.id}`
              })

              return (
                <div
                  key={column.id}
                  className={cn(
                    'flex flex-col rounded-lg border bg-card/50 shadow-sm dark:bg-muted/50',
                    'border-t-4',
                    column.color,
                    (hoveredColumn === column.id || isOver) && 'ring-4 ring-indigo-500'
                  )}
                >
                  <div ref={setNodeRef} className="flex flex-col flex-1">
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
                            {tasks.length > 0 ? (
                              tasks.map((task) => <TaskCard key={task.id} task={task} />)
                            ) : (
                              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                                Drop tasks here
                              </div>
                            )}
                          </SortableContext>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
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
