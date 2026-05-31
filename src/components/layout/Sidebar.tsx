import React from "react"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { menuItems } from "@/config/menu"
import { useEmulator } from "@/context/EmulatorContext"
import { Cable, ChevronsLeft, ChevronsRight, Database, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConsoleRail() {
  const location = useLocation()
  const { user, localGames, cloudSaves } = useEmulator()
  const collapsed = localStorage.getItem("rom-deck-sidebar-collapsed") === "true"

  return <ConsoleRailInner locationPath={location.pathname} user={user} localGames={localGames.length} cloudSaves={cloudSaves.length} initialCollapsed={collapsed} />
}

function ConsoleRailInner({
  locationPath,
  user,
  localGames,
  cloudSaves,
  initialCollapsed,
}: {
  locationPath: string
  user: { email: string; displayName: string | null } | null
  localGames: number
  cloudSaves: number
  initialCollapsed: boolean
}) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed)

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("rom-deck-sidebar-collapsed", String(next))
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-sidebar/84 px-3 py-4 backdrop-blur-xl transition-[width] duration-300 md:flex md:flex-col",
        collapsed ? "w-[88px] items-center" : "w-[244px]",
      )}
    >
      <div className="relative">
        <Link
          to="/library"
          className={cn("control-face flex h-12 items-center text-primary", collapsed ? "w-12 justify-center" : "w-full px-3 pr-10")}
        >
          <Cable className="size-6 shrink-0" />
          {!collapsed ? (
            <div className="ml-3 min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">ROM Deck</div>
              <div className="truncate text-xs text-muted-foreground">Console station</div>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "absolute flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground shadow-sm hover:text-primary",
            collapsed ? "-right-1 -top-1" : "right-2 top-1/2 -translate-y-1/2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
        </button>
      </div>

      <nav className={cn("mt-6 flex flex-1 flex-col gap-2", collapsed && "items-center")}>
        {menuItems.map((item) => {
          const active = locationPath === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex h-12 items-center rounded-xl border border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/10 hover:text-primary",
                collapsed ? "w-12 justify-center" : "w-full gap-3 px-3",
                active && "border-primary/35 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              title={item.label}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className={cn("grid gap-2", collapsed ? "w-12" : "grid-cols-2")}>
        <RailStat icon={<HardDrive className="size-3" />} label="ROMs" value={String(localGames)} collapsed={collapsed} />
        <RailStat icon={<Database className="size-3" />} label="Saves" value={String(cloudSaves)} collapsed={collapsed} />
      </div>
      <div className={cn("mt-3 flex items-center gap-3 rounded-xl border bg-card/60 p-2", collapsed ? "justify-center" : "w-full")}>
        <Avatar className="size-10 rounded-xl">
          <AvatarFallback className="rounded-xl bg-card text-xs">{user?.email?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
        </Avatar>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user?.displayName ?? "Guest player"}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.email ?? "Local browser mode"}</div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

export function BottomDock() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 gap-1 rounded-2xl border bg-background/92 p-1 shadow-2xl backdrop-blur-xl md:hidden">
      {menuItems.map((item) => {
        const active = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] text-muted-foreground",
              active && "bg-primary text-primary-foreground",
            )}
          >
            {item.icon}
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export const AdminSidebar = ConsoleRail

function RailStat({ icon, label, value, collapsed }: { icon: React.ReactNode; label: string; value: string; collapsed: boolean }) {
  return (
    <div className={cn("control-face flex text-primary", collapsed ? "h-12 w-12 flex-col items-center justify-center gap-0.5" : "h-14 min-w-0 flex-col justify-center px-3")}>
      <div className="flex items-center gap-2">
        {icon}
        {!collapsed ? <span className="truncate text-xs text-muted-foreground">{label}</span> : null}
      </div>
      <span className="font-mono text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}


