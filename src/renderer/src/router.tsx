import { Outlet, RootRoute, Route, RouterProvider, createRouter } from '@tanstack/react-router'
import { KanbanBoard } from './components/KanbanBoard'
import { Settings } from './pages/Settings'
import { Analytics } from './pages/Analytics'
import Schedule from './components/Schedule'
import { Sidebar } from './components/Sidebar'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button'
import { AiChat } from './components/AiChat'
import { useEffect } from 'react'

// Create a root layout route
function RootLayout(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1">
          <Outlet />
        </div>
        <Toaster />
        <AiChat />
      </div>
    </ThemeProvider>
  )
}

// Not Found Component
function NotFoundComponent(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button variant="link" asChild className="mt-4">
          <a href="/">Go back home</a>
        </Button>
      </div>
    </div>
  )
}

// Create the root route
const rootRoute = new RootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent
})

// Create the index route
const indexRoute = new Route({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: '/',
  component: KanbanBoard
})

// Create the settings route
const settingsRoute = new Route({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: '/settings',
  component: Settings
})

// Create the schedule route
const scheduleRoute = new Route({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: '/schedule',
  component: Schedule
})

// Create the analytics route
const analyticsRoute = new Route({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: '/analytics',
  component: Analytics
})

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, analyticsRoute, scheduleRoute])

// Create the router
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  notFoundMode: 'root',
  defaultComponent: KanbanBoard
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Initialize the router synchronously
router.load()

// Export the router component
export function Router(): JSX.Element {
  useEffect(() => {
    // Ensure we're at the root route on initial load
    void router.navigate({ to: '/', replace: true })
  }, [])

  return <RouterProvider router={router} />
}
