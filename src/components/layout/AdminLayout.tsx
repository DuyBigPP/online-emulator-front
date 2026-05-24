import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "./Sidebar"
import { BreadcrumbHeader } from "./Header"

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="relative flex-1 min-w-0">
          <BreadcrumbHeader />
          <div className="absolute inset-0 top-14 overflow-auto bg-background">
            <main className="w-full p-4 md:p-6 xl:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

