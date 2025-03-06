import {
  Outlet,
  RootRoute,
  Route,
  Router as TanStackRouter,
  RouterProvider,
  AnyRouter
} from '@tanstack/react-router'
import { KanbanBoard } from './components/KanbanBoard'
import { Settings } from './pages/Settings'
import { Analytics } from './pages/Analytics'
import { Sidebar } from './components/Sidebar'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button'
import { AiChat } from './components/AiChat'

// Error component
function ErrorComponent(): JSX.Element {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Oops!</h1>
        <p className="mt-2 text-muted-foreground">Something went wrong.</p>
        <Button variant="link" asChild className="mt-4">
          <a href="/">Go back home</a>
        </Button>
      </div>
    </div>
  )
}

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

// Create the root route
const rootRoute = new RootRoute({
  component: RootLayout,
  errorComponent: ErrorComponent
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

// Create the analytics route
const analyticsRoute = new Route({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: '/analytics',
  component: Analytics
})

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, analyticsRoute])

// Create the router
const router = new TanStackRouter({
  routeTree,
  defaultPreload: 'intent'
})

// Initialize the router
void router.load()

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Export the router component
export function Router(): JSX.Element {
  return <RouterProvider router={router as AnyRouter} />
}
