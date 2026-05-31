import { Outlet } from "react-router-dom"
import { BottomDock, ConsoleRail } from "./Sidebar"
import { BreadcrumbHeader } from "./Header"

export function AdminLayout() {
  return (
    <div className="app-grain flex min-h-[100dvh] w-full overflow-hidden bg-background">
      <ConsoleRail />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <BreadcrumbHeader />
        <div className="min-h-0 flex-1 overflow-auto pb-20 md:pb-0">
          <main className="mx-auto w-full max-w-[1540px] p-3 sm:p-4 md:p-5 xl:p-7">
            <Outlet />
          </main>
        </div>
        <BottomDock />
      </div>
    </div>
  )
}
