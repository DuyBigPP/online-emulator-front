import React from "react"
import { useLocation, Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { menuItems } from "@/config/menu"
import { Cable, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEmulator } from "@/context/EmulatorContext"
import { Badge } from "@/components/ui/badge"

export function AdminSidebar() {
  const location = useLocation()
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null)
  const { user, localGames } = useEmulator()

  const toggleSubmenu = (path: string) => {
    setOpenSubmenu((prev) => (prev === path ? null : path))
  }

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r border-border"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Cable className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">ROM Deck</span>
            <span className="truncate text-xs text-muted-foreground">Nintendo emulator</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-background px-2.5 py-2">
            <div className="text-lg font-semibold leading-none">{localGames.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">ROM local</div>
          </div>
          <div className="rounded-md border bg-background px-2.5 py-2">
            <div className="text-lg font-semibold leading-none">{user ? "On" : "Off"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Cloud</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.children) {
              return (
                <SidebarMenuItem key={item.path}>
                  <div>
                    <SidebarMenuButton
                      onClick={() => toggleSubmenu(item.path)}
                      // Check if pathname starts with this item's path (to include children)
                      isActive={location.pathname.startsWith(item.path)}
                      tooltip={item.label}
                      className="flex justify-between items-center transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent/50 data-[active=true]:font-medium"
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${openSubmenu === item.path ? "rotate-90" : ""}`}
                      />
                    </SidebarMenuButton>
                    {openSubmenu === item.path && (
                      <ul className="mt-1 pl-4 transition-all duration-200 ease-out">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname === child.path}
                              tooltip={child.label}
                              className="transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent/50 data-[active=true]:font-medium text-sm"
                            >
                              <Link to={child.path}>
                                {child.icon}
                                <span>{child.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </SidebarMenuItem>
              )
            }
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.label}
                  className="transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent/50 data-[active=true]:font-medium"
                >
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-border p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback>{user?.email?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user?.displayName ?? "Guest player"}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email ?? "Local only"}</span>
          </div>
          <Badge variant={user ? "default" : "outline"} className="ml-auto">
            {user ? "Sync" : "Local"}
          </Badge>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
