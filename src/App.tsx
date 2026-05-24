import { AdminRoutes } from "@/routes/adminRoutes"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { EmulatorProvider } from "@/context/EmulatorContext"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <EmulatorProvider>
        <AdminRoutes />
        <Toaster richColors position="top-right" />
      </EmulatorProvider>
    </ThemeProvider>
  )
}

export default App
