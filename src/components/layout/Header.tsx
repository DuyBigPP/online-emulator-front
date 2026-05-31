import { Link, useLocation } from "react-router-dom"
import { Gamepad2, LogOut, UserRound, Wifi, WifiOff } from "lucide-react"
import { AuthDialog } from "@/components/layout/AuthDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getConsoleInfo } from "@/config/systems"
import { useEmulator } from "@/context/EmulatorContext"
import { menuItems } from "@/config/menu"

export function BreadcrumbHeader() {
  const location = useLocation()
  const current = menuItems.find((item) => item.path === location.pathname) ?? menuItems[0]
  const { selectedGame, user, logout } = useEmulator()
  const system = selectedGame ? getConsoleInfo(selectedGame.console) : null

  return (
    <header className="sticky top-0 z-40 border-b bg-background/78 px-3 py-2 backdrop-blur-xl md:px-5">
      <div className="flex h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/library" className="control-face flex size-10 shrink-0 items-center justify-center text-primary md:hidden">
            <Gamepad2 className="size-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-primary">{current?.icon}</span>
              <span>{current?.label ?? "ROM Deck"}</span>
            </div>
            <div className="mt-0.5 max-w-[52vw] truncate text-xs text-muted-foreground sm:max-w-[420px]">
              {selectedGame && system ? `${selectedGame.displayName} - ${system.label}` : "Insert a local ROM to start playing"}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {selectedGame && system ? (
            <Badge variant="outline" className="hidden max-w-[280px] gap-1.5 truncate bg-card/70 sm:inline-flex">
              <span className={`size-2 rounded-full ${system.accent}`} />
              <span className="truncate">{selectedGame.console}</span>
            </Badge>
          ) : null}
          <Badge variant={user ? "default" : "outline"} className="hidden gap-1.5 sm:inline-flex">
            {user ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
            {user ? "Cloud" : "Local"}
          </Badge>
          {user ? (
            <Button size="sm" variant="outline" onClick={() => void logout()}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <AuthDialog>
              <Button size="sm">
                <UserRound className="size-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </AuthDialog>
          )}
        </div>
      </div>
    </header>
  )
}

