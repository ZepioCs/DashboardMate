import { useStore } from '../stores/StoreProvider'
import { format, startOfWeek, addDays, isToday, parse } from 'date-fns'
import { cn } from '../lib/utils'
import { Task } from '../models'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  CalendarIcon,
  CalendarDays,
  ListFilter,
  CalendarRange
} from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Badge } from './ui/badge'
import { TaskDialog, ForceUpdateContext } from './TaskDialog'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  DragMoveEvent
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { observer } from 'mobx-react-lite'
import { Settings } from '../../../shared/model'
import { CURRENT_SETTINGS_VERSION } from '../../../shared/constants'

interface SortableTaskItemProps {
  task: Task
  onClick: () => void
}

const SortableTaskItem = observer(function SortableTaskItem({
  task,
  onClick
}: SortableTaskItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-2 rounded-md text-sm cursor-pointer transition-colors group',
        'bg-muted hover:bg-muted/80',
        'border border-transparent',
        isDragging && 'opacity-50 border-primary/50 bg-primary/5',
        task.status === 'done' && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{task.title}</div>
          <div className="flex items-center gap-2 mt-1">
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
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.dueDate), 'HH:mm')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

function Schedule(): JSX.Element {
  const { taskStore } = useStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [updateKey, setUpdateKey] = useState(0)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [prioritySort, setPrioritySort] = useState(false)
  const [customOrder, setCustomOrder] = useState<{ [key: string]: string[] }>({})
  const [manuallyAdjustedTimes, setManuallyAdjustedTimes] = useState(new Set<string>())
  const [settings, setSettings] = useState<Settings>({
    notifications: { push: false, email: false },
    ai: { autoCreate: false },
    schedule: { showWeekends: true },
    version: CURRENT_SETTINGS_VERSION
  })

  // Load settings
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const data = await window.api.loadSettings()
        setSettings(JSON.parse(data))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  const forceUpdate = useCallback((): void => {
    setUpdateKey((prev) => prev + 1)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  // Get the start of the current week
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate])

  // Generate array of days, filtering weekends if disabled
  const days = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    return settings.schedule.showWeekends
      ? allDays
      : allDays.filter((day) => {
          const dayOfWeek = day.getDay()
          return dayOfWeek !== 0 && dayOfWeek !== 6 // Filter out Sunday (0) and Saturday (6)
        })
  }, [weekStart, settings.schedule.showWeekends])

  // Group tasks by their due date
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    taskStore.tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, [])
        }
        grouped.get(dateKey)?.push(task)
      }
    })

    // Sort based on mode
    grouped.forEach((tasks, dateKey) => {
      if (prioritySort) {
        // First sort by priority
        tasks.sort((a, b) => {
          if (!a.dueDate || !b.dueDate) return 0
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]

          // If priorities are different, sort by priority
          if (priorityDiff !== 0) return priorityDiff

          // If priorities are the same, maintain their current time order
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })

        // Then update times within each priority group, but respect manually adjusted times
        let currentTime = new Date(tasks[0]?.dueDate || new Date())
        tasks.forEach((task, index) => {
          if (index > 0) {
            const prevTask = tasks[index - 1]
            if (
              prevTask.priority === task.priority &&
              task.dueDate &&
              !manuallyAdjustedTimes.has(task.id)
            ) {
              const taskDate = new Date(task.dueDate)
              taskDate.setHours(currentTime.getHours())
              taskDate.setMinutes(currentTime.getMinutes())
              void taskStore.updateTask(task.id, { dueDate: taskDate.toISOString() })
            } else if (task.dueDate) {
              currentTime = new Date(task.dueDate)
            }
          }
        })
      } else if (customOrder[dateKey]) {
        const orderMap = new Map(customOrder[dateKey].map((id, index) => [id, index]))
        tasks.sort((a, b) => {
          const aIndex = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
          const bIndex = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
          return aIndex - bIndex
        })
      }
    })

    return grouped
  }, [taskStore.tasks, updateKey, prioritySort, customOrder, manuallyAdjustedTimes, taskStore])

  const handlePreviousWeek = (): void => {
    setSelectedDate(addDays(selectedDate, -7))
  }

  const handleNextWeek = (): void => {
    setSelectedDate(addDays(selectedDate, 7))
  }

  const getTasksForDay = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasksByDay.get(dateKey) || []
  }

  const handleDragStart = (event: DragStartEvent): void => {
    const task = taskStore.tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragMove = (event: DragMoveEvent): void => {
    const { over, active } = event
    if (!over) {
      setDropTarget(null)
      return
    }

    // Get the active task
    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    if (!activeTask?.dueDate) {
      return
    }

    if (over.data.current?.type === 'day') {
      setDropTarget(over.id as string)
    } else if (over.id) {
      const overTask = taskStore.tasks.find((t) => t.id === over.id)
      if (overTask?.dueDate) {
        const dateKey = format(new Date(overTask.dueDate), 'yyyy-MM-dd')
        setDropTarget(dateKey)
      }
    } else {
      setDropTarget(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    setActiveTask(null)
    setDropTarget(null)
    const { active, over } = event

    if (!over) return

    const activeTask = taskStore.tasks.find((t) => t.id === active.id)
    if (!activeTask || !activeTask.dueDate) return

    // If dropping onto a task
    const overTask = taskStore.tasks.find((t) => t.id === over.id)
    if (overTask && overTask.dueDate) {
      const overDate = new Date(overTask.dueDate)
      const newDate = new Date(activeTask.dueDate)
      const dateKey = format(overDate, 'yyyy-MM-dd')

      // Update the date to match the target day
      newDate.setFullYear(overDate.getFullYear())
      newDate.setMonth(overDate.getMonth())
      newDate.setDate(overDate.getDate())

      if (!prioritySort) {
        // Get all tasks for the day including the active task
        const dayTasks = getTasksForDay(overDate)
        const currentOrder = dayTasks.map((t) => t.id)

        // If the task is moving within the same day
        if (format(new Date(activeTask.dueDate), 'yyyy-MM-dd') === dateKey) {
          const oldIndex = currentOrder.indexOf(activeTask.id)
          if (oldIndex !== -1) {
            currentOrder.splice(oldIndex, 1)
          }
        }

        const overIndex = currentOrder.indexOf(overTask.id)
        // Insert after the over task if dragging downwards, before if dragging upwards
        const newIndex = overIndex + (event.delta.y > 0 ? 1 : 0)
        currentOrder.splice(newIndex, 0, activeTask.id)

        // Update custom order first
        setCustomOrder((prev) => ({
          ...prev,
          [dateKey]: currentOrder
        }))
      }

      // Update time based on position for both modes
      const dayTasks = getTasksForDay(overDate)
      const isMovingDown = event.delta.y > 0

      // Find the task we're dropping onto
      const overIndex = dayTasks.findIndex((t) => t.id === overTask.id)

      // Determine the tasks above and below the drop position
      const targetIndex = isMovingDown ? overIndex + 1 : overIndex
      const prevTask = targetIndex > 0 ? dayTasks[targetIndex - 1] : null
      const nextTask = targetIndex < dayTasks.length ? dayTasks[targetIndex] : null

      // Update time based on surrounding tasks
      if (prevTask?.dueDate) {
        const prevTime = new Date(prevTask.dueDate)
        newDate.setHours(prevTime.getHours())
        newDate.setMinutes(prevTime.getMinutes())
      } else if (nextTask?.dueDate) {
        const nextTime = new Date(nextTask.dueDate)
        newDate.setHours(nextTime.getHours())
        newDate.setMinutes(nextTime.getMinutes())
      }

      await taskStore.updateTask(activeTask.id, { dueDate: newDate.toISOString() })
      forceUpdate()
    } else if (over.data.current?.type === 'day') {
      // If dropping onto a day container
      const targetDate = parse(over.id as string, 'yyyy-MM-dd', new Date())
      const currentDate = new Date(activeTask.dueDate)
      const dateKey = format(targetDate, 'yyyy-MM-dd')

      const newDate = new Date(targetDate)
      newDate.setHours(currentDate.getHours())
      newDate.setMinutes(currentDate.getMinutes())

      // In custom order mode, add to the end of the day's tasks
      if (!prioritySort) {
        const dayTasks = getTasksForDay(targetDate)
        const currentOrder = dayTasks.map((t) => t.id)
        if (!currentOrder.includes(activeTask.id)) {
          setCustomOrder((prev) => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), activeTask.id]
          }))
        }
      }

      await taskStore.updateTask(activeTask.id, { dueDate: newDate.toISOString() })
      forceUpdate()
    }
  }

  const handleDragOver = async (event: DragOverEvent): Promise<void> => {
    const { over } = event
    if (!over) return

    if (over.data.current?.type === 'day') {
      setDropTarget(over.id as string)
    } else if (over.id) {
      const overTask = taskStore.tasks.find((t) => t.id === over.id)
      if (overTask?.dueDate) {
        const dateKey = format(new Date(overTask.dueDate), 'yyyy-MM-dd')
        setDropTarget(dateKey)
      }
    } else {
      setDropTarget(null)
    }
  }

  const handleManualTimeAdjust = useCallback((taskId: string) => {
    setManuallyAdjustedTimes((prev) => {
      const next = new Set(prev)
      next.add(taskId)
      return next
    })
  }, [])

  // Add a component to handle the sortable list with access to DnD context
  const SortableTaskList = observer(function SortableTaskList({
    tasks
  }: {
    tasks: Task[]
  }): JSX.Element {
    return (
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => {
          return (
            <div key={task.id} className="space-y-2">
              <SortableTaskItem task={task} onClick={() => setSelectedTask(task)} />
            </div>
          )
        })}
      </SortableContext>
    )
  })

  return (
    <ForceUpdateContext.Provider value={forceUpdate}>
      <div className="flex h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <CalendarRange className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-lg font-semibold">Schedule</h1>
                <p className="text-sm text-muted-foreground">
                  Plan and organize your tasks throughout the week
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant={prioritySort ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPrioritySort(!prioritySort)}
                className="gap-2"
              >
                <ListFilter className="h-4 w-4" />
                {prioritySort ? 'Priority sorting' : 'Custom order'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="gap-2 bg-primary/5 hover:bg-primary/10 text-primary"
                >
                  <CalendarDays className="h-4 w-4" />
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'min-w-[240px] justify-center text-sm font-medium',
                        'hover:bg-muted/50'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div
              className={cn(
                'grid h-full gap-4 p-4',
                settings.schedule.showWeekends ? 'grid-cols-7' : 'grid-cols-5'
              )}
            >
              {days.map((day) => {
                const dayTasks = getTasksForDay(day)
                const isCurrentDay = isToday(day)
                const dateKey = format(day, 'yyyy-MM-dd')
                const isDropTarget = dropTarget === dateKey

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'flex flex-col h-full border rounded-lg overflow-hidden transition-colors',
                      isCurrentDay && 'ring-2 ring-primary',
                      isDropTarget && 'bg-muted/50 border-primary'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 text-sm font-medium border-b transition-colors',
                        isCurrentDay && 'bg-primary/10',
                        isDropTarget && 'bg-primary/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{format(day, 'EEE')}</span>
                        <span
                          className={cn('text-muted-foreground', isCurrentDay && 'text-primary')}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                    </div>
                    <div
                      data-type="day"
                      data-id={dateKey}
                      className={cn(
                        'flex-1 p-2 space-y-2 overflow-y-auto transition-colors',
                        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30',
                        isDropTarget && 'bg-muted/50'
                      )}
                    >
                      <SortableTaskList tasks={dayTasks} />
                      {isDropTarget && dayTasks.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-primary/50 rounded-md flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">Drop here</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeTask ? (
                <div
                  className={cn(
                    'p-2 rounded-md text-sm transform-gpu',
                    'bg-background/90 border shadow-lg',
                    'border-primary/50',
                    'opacity-80 backdrop-blur-sm',
                    'shadow-[0_0_15px_rgba(0,0,0,0.15)]',
                    activeTask.status === 'done' && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{activeTask.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            activeTask.priority === 'low' &&
                              'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
                            activeTask.priority === 'medium' &&
                              'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
                            activeTask.priority === 'high' &&
                              'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                          )}
                        >
                          {activeTask.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activeTask.dueDate && format(new Date(activeTask.dueDate), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <TaskDialog
            task={selectedTask}
            open={!!selectedTask}
            onClose={() => setSelectedTask(undefined)}
            onManualTimeAdjust={handleManualTimeAdjust}
          />
        </div>
      </div>
    </ForceUpdateContext.Provider>
  )
}

export default observer(Schedule)
