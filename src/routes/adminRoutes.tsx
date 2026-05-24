import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { generateRoutes } from "@/utils/routeGenerator"
import { menuItems } from "@/config/menu"

export function AdminRoutes() {
  const autoRoutes = generateRoutes(menuItems)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/library" replace />} />
          {autoRoutes}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
