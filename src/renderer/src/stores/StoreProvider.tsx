import { createContext, useContext, type ReactNode } from 'react'
import { taskStore } from './TaskStore'

interface StoreContextType {
  taskStore: typeof taskStore
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  return <StoreContext.Provider value={{ taskStore }}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return context
}
