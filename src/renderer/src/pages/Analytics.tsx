import { observer } from 'mobx-react-lite'
import { useStore } from '../stores/StoreProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { format, subDays, isWithinInterval, differenceInDays, parseISO } from 'date-fns'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { useTheme } from '../components/theme-provider'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ScrollArea } from '../components/ui/scroll-area'
import { Progress } from '../components/ui/progress'
import { BarChart2 } from 'lucide-react'

const COLORS = {
  light: ['#3498db', '#f1c40f', '#2ecc71', '#e74c3c', '#9b59b6'],
  dark: ['#60a5fa', '#fcd34d', '#4ade80', '#f87171', '#c084fc']
}

const PRIORITY_COLORS = {
  light: {
    low: '#3498db',
    medium: '#f1c40f',
    high: '#e74c3c'
  },
  dark: {
    low: '#60a5fa',
    medium: '#fcd34d',
    high: '#f87171'
  }
}

const tooltipItemStyle = {
  light: {
    color: '#374151'
  },
  dark: {
    color: '#e5e7eb'
  }
}

const tooltipStyle = {
  light: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: '#374151',
    padding: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem'
  },
  dark: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    color: '#e5e7eb',
    padding: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem'
  }
}

export const Analytics = observer(function Analytics(): JSX.Element {
  const { taskStore } = useStore()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Calculate task statistics
  const totalTasks = taskStore.tasks.length
  const completedTasks = taskStore.tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = taskStore.tasks.filter((t) => t.status === 'inProgress').length
  const todoTasks = taskStore.tasks.filter((t) => t.status === 'todo').length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate average completion time (in days) for completed tasks
  const completedTasksWithDates = taskStore.tasks.filter(
    (t) => t.status === 'done' && t.createdAt && t.completedAt
  )
  const averageCompletionTime =
    completedTasksWithDates.length > 0
      ? Math.round(
          completedTasksWithDates.reduce(
            (acc, task) =>
              acc + differenceInDays(parseISO(task.completedAt!), parseISO(task.createdAt)),
            0
          ) / completedTasksWithDates.length
        )
      : 0

  // Tasks by status
  const tasksByStatus = [
    { name: 'To Do', value: todoTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Done', value: completedTasks }
  ]

  // Tasks by priority
  const tasksByPriority = [
    { name: 'High', value: taskStore.tasks.filter((t) => t.priority === 'high').length },
    { name: 'Medium', value: taskStore.tasks.filter((t) => t.priority === 'medium').length },
    { name: 'Low', value: taskStore.tasks.filter((t) => t.priority === 'low').length }
  ]

  // Recent activity (last 14 days)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), i)
    const tasksCreated = taskStore.tasks.filter((task) =>
      isWithinInterval(new Date(task.createdAt), {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      })
    ).length
    const tasksCompleted = taskStore.tasks.filter(
      (task) =>
        task.completedAt &&
        isWithinInterval(new Date(task.completedAt), {
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999))
        })
    ).length
    return {
      date: format(date, 'MMM dd'),
      created: tasksCreated,
      completed: tasksCompleted
    }
  }).reverse()

  // Get most recent completed tasks
  const recentCompletedTasks = [...taskStore.tasks]
    .filter((t) => t.status === 'done' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5)

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <BarChart2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your task completion and progress</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
        <div className="grid gap-4 p-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {todoTasks} todo · {inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {completedTasks} of {totalTasks} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageCompletionTime} days</div>
                <p className="text-xs text-muted-foreground">From creation to completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {taskStore.tasks.filter((t) => t.priority === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground">Tasks needing attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <Tabs defaultValue="overview" className="w-full">
                  <div className="flex items-center justify-between">
                    <CardTitle>Task Analytics</CardTitle>
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                      <TabsTrigger value="priorities">Priorities</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="mt-4 space-y-4">
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="md:col-span-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Activity Timeline</CardTitle>
                              <CardDescription>Task creation and completion trends</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={last14Days}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDark ? '#374151' : '#e5e7eb'}
                                  />
                                  <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                                  <YAxis
                                    allowDecimals={false}
                                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                                  />
                                  <Tooltip contentStyle={tooltipStyle[isDark ? 'dark' : 'light']} />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="created"
                                    name="Created"
                                    stroke={isDark ? '#60a5fa' : '#3498db'}
                                    strokeWidth={2}
                                    animationDuration={300}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="completed"
                                    name="Completed"
                                    stroke={isDark ? '#4ade80' : '#2ecc71'}
                                    strokeWidth={2}
                                    animationDuration={300}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="md:col-span-3">
                          <Card>
                            <CardHeader>
                              <CardTitle>Status Distribution</CardTitle>
                              <CardDescription>Tasks by current status</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={tasksByStatus}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    animationDuration={300}
                                  >
                                    {tasksByStatus.map((_, index) => (
                                      <Cell
                                        key={index}
                                        fill={COLORS[isDark ? 'dark' : 'light'][index]}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    itemStyle={tooltipItemStyle[isDark ? 'dark' : 'light']}
                                    contentStyle={tooltipStyle[isDark ? 'dark' : 'light']}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="progress" className="space-y-4">
                      <div className="grid gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Task Progress</CardTitle>
                            <CardDescription>Completion status over time</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>To Do</span>
                                  <span className="text-muted-foreground">{todoTasks} tasks</span>
                                </div>
                                <Progress value={(todoTasks / totalTasks) * 100} className="h-2" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>In Progress</span>
                                  <span className="text-muted-foreground">
                                    {inProgressTasks} tasks
                                  </span>
                                </div>
                                <Progress
                                  value={(inProgressTasks / totalTasks) * 100}
                                  className="h-2"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Completed</span>
                                  <span className="text-muted-foreground">
                                    {completedTasks} tasks
                                  </span>
                                </div>
                                <Progress
                                  value={(completedTasks / totalTasks) * 100}
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="priorities" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Priority Distribution</CardTitle>
                            <CardDescription>Tasks by priority level</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={tasksByPriority}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={(entry) => `${entry.name}: ${entry.value}`}
                                  animationDuration={300}
                                >
                                  {tasksByPriority.map((_, index) => (
                                    <Cell
                                      key={index}
                                      fill={COLORS[isDark ? 'dark' : 'light'][index]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  itemStyle={tooltipItemStyle[isDark ? 'dark' : 'light']}
                                  contentStyle={tooltipStyle[isDark ? 'dark' : 'light']}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Priority Breakdown</CardTitle>
                            <CardDescription>Tasks by priority and status</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {(['high', 'medium', 'low'] as const).map((priority) => {
                                const priorityTasks = taskStore.tasks.filter(
                                  (t) => t.priority === priority
                                )
                                const priorityTotal = priorityTasks.length
                                const priorityCompleted = priorityTasks.filter(
                                  (t) => t.status === 'done'
                                ).length
                                return (
                                  <div key={priority} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="capitalize">{priority} Priority</span>
                                      <span className="text-muted-foreground">
                                        {priorityCompleted} of {priorityTotal} completed
                                      </span>
                                    </div>
                                    <Progress
                                      value={(priorityCompleted / (priorityTotal || 1)) * 100}
                                      className="h-2"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Completions */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Completed Tasks</CardTitle>
              <CardDescription>Last 5 completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCompletedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Completed {format(new Date(task.completedAt!), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: PRIORITY_COLORS[isDark ? 'dark' : 'light'][task.priority],
                        color: isDark ? '#fff' : '#000'
                      }}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
})
