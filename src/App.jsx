import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './utils/ThemeContext'
import router from './routes'
import GlobalToast from './components/ui/GlobalToast'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <GlobalToast />
    </ThemeProvider>
  )
}