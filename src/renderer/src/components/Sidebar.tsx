import { LayoutGrid, Settings, Menu, BarChart, Calendar, Archive } from 'lucide-react'
import { Link, useMatches } from '@tanstack/react-router'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { observer } from 'mobx-react-lite'

export const Sidebar = observer(function Sidebar(): JSX.Element {
  export const Sidebar = observer(function Sidebar(): JSX.Element {
    const [isCollapsed, setIsCollapsed] = useState(() => {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    })
    const matches = useMatches()
    const currentPath = matches.length > 0 ? matches[matches.length - 1].pathname : '/'

    useEffect(() => {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }, [isCollapsed])

    return (
      <div
        className={cn(
          'flex h-screen flex-col border-r bg-muted/10 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!isCollapsed && <span className="text-lg font-semibold">DashboardMate</span>}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <nav className="space-y-1 p-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                isCollapsed && 'justify-center px-2',
                currentPath === '/' && 'bg-muted'
              )}
              asChild
            >
              <Link to="/">
                <LayoutGrid className="h-5 w-5" />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                isCollapsed && 'justify-center px-2',
                currentPath === '/schedule' && 'bg-muted'
              )}
              asChild
            >
              <Link to="/schedule">
                <Calendar className="h-5 w-5" />
                {!isCollapsed && <span>Schedule</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                isCollapsed && 'justify-center px-2',
                currentPath === '/schedule' && 'bg-muted'
              )}
              asChild
            >
              <Link to="/schedule">
                <Calendar className="h-5 w-5" />
                {!isCollapsed && <span>Schedule</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                isCollapsed && 'justify-center px-2',
                currentPath === '/analytics' && 'bg-muted'
              )}
              asChild
            >
              <Link to="/analytics">
                <BarChart className="h-5 w-5" />
                {!isCollapsed && <span>Analytics</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                isCollapsed && 'justify-center px-2',
                currentPath === '/archive' && 'bg-muted'
              )}
              asChild
            >
              <Link to="/archive">
                <Archive className="h-5 w-5" />
                {!isCollapsed && <span>Archive</span>}
              </Link>
            </Button>
          </nav>
          <div className="p-2">
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2',
                  isCollapsed && 'justify-center px-2',
                  currentPath === '/settings' && 'bg-muted'
                )}
                asChild
              >
                <Link to="/settings">
                  <Settings className="h-5 w-5" />
                  {!isCollapsed && <span>Settings</span>}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  })
})
