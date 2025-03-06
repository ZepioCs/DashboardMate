import { observer } from 'mobx-react-lite'
import { useStore } from '../stores/StoreProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { format, subDays, isWithinInterval } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useTheme } from '../components/theme-provider'

const COLORS = {
  light: ['#3498db', '#f1c40f', '#2ecc71'],
  dark: ['#60a5fa', '#fcd34d', '#4ade80']
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

const tooltipStyle = {
  light: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: '#374151'
  },
  dark: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    color: '#e5e7eb'
  }
}

export const Analytics = observer(function Analytics(): JSX.Element {
  const { taskStore } = useStore()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Calculate task statistics
  const totalTasks = taskStore.tasks.length
  const completedTasks = taskStore.tasks.filter((t) => t.status === 'done').length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Tasks by status
  const tasksByStatus = [
    { name: 'To Do', value: taskStore.tasks.filter((t) => t.status === 'todo').length },
    {
      name: 'In Progress',
      value: taskStore.tasks.filter((t) => t.status === 'inProgress').length
    },
    { name: 'Done', value: taskStore.tasks.filter((t) => t.status === 'done').length }
  ]

  // Recent activity (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i)
    return {
      date: format(date, 'MMM dd'),
      tasks: taskStore.tasks.filter((task) =>
        isWithinInterval(new Date(task.createdAt), {
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999))
        })
      ).length
    }
  }).reverse()

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background/95 px-6 py-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="grid h-full gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Overall task completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">{completionRate}%</div>
                  <div className="text-sm text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
                <CardDescription>Distribution across columns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => entry.name}
                      >
                        {tasksByStatus.map((_, index) => (
                          <Cell key={index} fill={COLORS[isDark ? 'dark' : 'light'][index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle[isDark ? 'dark' : 'light']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Tasks by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(PRIORITY_COLORS[isDark ? 'dark' : 'light']).map(
                    ([priority, color]) => {
                      const count = taskStore.tasks.filter((t) => t.priority === priority).length
                      const percentage = totalTasks ? Math.round((count / totalTasks) * 100) : 0
                      return (
                        <div key={priority} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{priority}</span>
                            <span className="text-muted-foreground">{count} tasks</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Tasks created in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <YAxis allowDecimals={false} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <Tooltip contentStyle={tooltipStyle[isDark ? 'dark' : 'light']} />
                    <Bar dataKey="tasks" fill={isDark ? '#60a5fa' : '#3498db'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
})
