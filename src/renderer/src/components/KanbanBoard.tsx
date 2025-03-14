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
import { useState, useCallback } from 'react'
import { TaskCard } from './TaskCard'
import { useStore } from '../stores/StoreProvider'
import { cn } from '../lib/utils'
import { AddTaskDialog } from './AddTaskDialog'
import { Task, TaskStatus, TaskPriority } from '../models'
import { closestCorners } from '@dnd-kit/core'
import { Input } from './ui/input'
import { Search, Filter, ArrowRight, ArrowLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { useToast } from './ui/use-toast'

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-blue-500/20' },
  { id: 'inProgress', title: 'In Progress', color: 'border-yellow-500/20' },
  { id: 'done', title: 'Done', color: 'border-green-500/20' }
]

export const KanbanBoard = observer(function KanbanBoard(): JSX.Element {
  const { taskStore } = useStore()
  const { toast } = useToast()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [dueDateFilter, setDueDateFilter] = useState<
    'all' | 'overdue' | 'today' | 'upcoming' | 'none'
  >('all')
  const [moveConfirmation, setMoveConfirmation] = useState<{
    fromColumn: TaskStatus
    toColumn: TaskStatus
    isOpen: boolean
  } | null>(null)

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

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setPriorityFilter('all')
    setDueDateFilter('all')
  }, [])

  const getFilteredTasks = useCallback(
    (status: TaskStatus) => {
      return taskStore.getTasksByStatus(status).filter((task) => {
        const matchesSearch =
          searchQuery === '' ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

        let matchesDueDate = true
        if (dueDateFilter !== 'all' && task.dueDate) {
          const dueDate = new Date(task.dueDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)

          switch (dueDateFilter) {
            case 'overdue':
              matchesDueDate = dueDate < today
              break
            case 'today':
              matchesDueDate = dueDate >= today && dueDate < tomorrow
              break
            case 'upcoming':
              matchesDueDate = dueDate >= today && dueDate <= nextWeek
              break
            case 'none':
              matchesDueDate = !task.dueDate
              break
          }
        }

        return matchesSearch && matchesPriority && matchesDueDate
      })
    },
    [searchQuery, priorityFilter, dueDateFilter]
  )

  const handleMoveAllTasks = useCallback(
    (fromColumn: TaskStatus, toColumn: TaskStatus) => {
      const tasks = getFilteredTasks(fromColumn)
      const tasksToMove = tasks.map((task) => task.id)
      tasksToMove.forEach((taskId) => {
        taskStore.moveTask(taskId, toColumn)
      })
      toast({
        title: 'Tasks moved',
        description: `All tasks moved from ${columns.find((c) => c.id === fromColumn)?.title} to ${columns.find((c) => c.id === toColumn)?.title}`
      })
      setMoveConfirmation(null)
    },
    [taskStore, getFilteredTasks, toast]
  )

  return (
    <>
      <div className="flex h-screen flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-6">
            <h1 className="text-xl font-semibold">Tasks</h1>
            <div className="flex-1 mx-4 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Priority</p>
                        <Select
                          value={priorityFilter}
                          onValueChange={(value: TaskPriority | 'all') => setPriorityFilter(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Due Date</p>
                        <Select
                          value={dueDateFilter}
                          onValueChange={(
                            value: 'all' | 'overdue' | 'today' | 'upcoming' | 'none'
                          ) => setDueDateFilter(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select due date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="today">Due Today</SelectItem>
                            <SelectItem value="upcoming">Upcoming (7 days)</SelectItem>
                            <SelectItem value="none">No Due Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>Clear filters</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
            <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3 auto-rows-fr">
              {columns.map((column) => {
                const tasks = getFilteredTasks(column.id)
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
                      (hoveredColumn === column.id || isOver) && 'ring-2 ring-primary'
                    )}
                  >
                    <div ref={setNodeRef} className="flex flex-col flex-1 min-h-0">
                      <div className="border-b px-4 py-3 bg-background/50">
                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold">{column.title}</h2>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                              {tasks.length}
                            </span>
                            {tasks.length > 0 && (
                              <div className="flex gap-1">
                                {column.id === 'todo' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setMoveConfirmation({
                                        fromColumn: column.id,
                                        toColumn: 'inProgress',
                                        isOpen: true
                                      })
                                    }
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                )}
                                {column.id === 'inProgress' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setMoveConfirmation({
                                        fromColumn: column.id,
                                        toColumn: 'todo',
                                        isOpen: true
                                      })
                                    }
                                  >
                                    <ArrowLeft className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex-1 min-h-0 p-3 overflow-y-auto',
                          'scrollbar-thin scrollbar-track-transparent',
                          'scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20',
                          'scrollbar-thumb-rounded-full'
                        )}
                      >
                        <div className="space-y-3">
                          <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                            {tasks.length > 0 ? (
                              tasks.map((task) => <TaskCard key={task.id} task={task} />)
                            ) : (
                              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                                {searchQuery || priorityFilter !== 'all' || dueDateFilter !== 'all'
                                  ? 'No matching tasks'
                                  : 'Drop tasks here'}
                              </div>
                            )}
                          </SortableContext>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
          </DndContext>
        </main>
      </div>

      {moveConfirmation && (
        <AlertDialog
          open={moveConfirmation.isOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setMoveConfirmation(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move All Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to move all tasks from{' '}
                {columns.find((c) => c.id === moveConfirmation.fromColumn)?.title} to{' '}
                {columns.find((c) => c.id === moveConfirmation.toColumn)?.title}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleMoveAllTasks(moveConfirmation.fromColumn, moveConfirmation.toColumn)
                }
              >
                Move All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
})
