import React from "react"
import { Navigate, Route } from "react-router-dom"
import type { MenuItem } from "@/config/menu"

const modules = import.meta.glob("../pages/**/index.tsx")

export const generateRoutes = (items: MenuItem[]): React.ReactElement[] => {
  const routes: React.ReactElement[] = []

  items.forEach((item) => {
    if (!item.children || item.children.length === 0) {
      const modulePath = `../pages${item.path}/index.tsx`
      const moduleLoader = modules[modulePath]

      if (moduleLoader) {
        const Component = React.lazy(() => moduleLoader() as Promise<{ default: React.ComponentType }>)

        routes.push(
          <Route
            key={item.path}
            path={item.path.replace(/^\/+/, "")}
            element={
              <React.Suspense fallback={<div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading...</div>}>
                <Component />
              </React.Suspense>
            }
          />,
        )
      } else {
        console.warn(`No component found for path: ${item.path}`)
      }
    } else {
      routes.push(<Route key={item.path} path={item.path.replace(/^\/+/, "")} element={<Navigate to={item.children[0].path} replace />} />)
      routes.push(...generateRoutes(item.children))
    }
  })

  return routes
}
