import { createContext, useContext, type ReactNode } from 'react'
import { RootStore } from './RootStore'
const rootStore = new RootStore()
const taskStore = rootStore.taskStore

interface StoreContextType {
  taskStore: typeof taskStore
  rootStore: typeof rootStore
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({
  children,
  stores = { taskStore, rootStore }
}: {
  children: ReactNode
  stores?: StoreContextType
}): JSX.Element {
  return <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return context
}
