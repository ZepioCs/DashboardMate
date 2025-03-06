import './styles/globals.css'
import { StrictMode } from 'react'
import { Router } from './router'
import { StoreProvider } from './stores/StoreProvider'

function App(): JSX.Element {
  return (
    <StrictMode>
      <StoreProvider>
        <Router />
      </StoreProvider>
    </StrictMode>
  )
}

export default App
