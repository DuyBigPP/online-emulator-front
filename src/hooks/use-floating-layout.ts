import { useCallback, useEffect, useMemo, useState } from "react"

export type FloatingWindowId = "single" | "dsTop" | "dsBottom"

export type FloatingWindowLayout = {
  x: number
  y: number
  width: number
  height: number
}

export type FloatingLayouts = Record<FloatingWindowId, FloatingWindowLayout>

const STORAGE_KEY = "rom-deck-floating-layout"

const DEFAULT_LAYOUTS: FloatingLayouts = {
  single: { x: 360, y: 140, width: 720, height: 540 },
  dsTop: { x: 340, y: 120, width: 512, height: 384 },
  dsBottom: { x: 880, y: 180, width: 384, height: 288 },
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const clampLayout = (layout: FloatingWindowLayout, viewportWidth: number, viewportHeight: number) => {
  const width = clamp(layout.width, 256, Math.max(320, viewportWidth - 24))
  const height = clamp(layout.height, 192, Math.max(240, viewportHeight - 24))

  return {
    width,
    height,
    x: clamp(layout.x, 0, Math.max(0, viewportWidth - width - 12)),
    y: clamp(layout.y, 0, Math.max(0, viewportHeight - height - 12)),
  }
}

const readLayouts = (): FloatingLayouts => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LAYOUTS

    return {
      ...DEFAULT_LAYOUTS,
      ...(JSON.parse(raw) as Partial<FloatingLayouts>),
    }
  } catch {
    return DEFAULT_LAYOUTS
  }
}

const getViewport = () => ({
  width: Math.max(640, window.innerWidth),
  height: Math.max(420, window.innerHeight),
})

export const useFloatingLayout = () => {
  const [layouts, setLayouts] = useState<FloatingLayouts>(() => readLayouts())

  const clampedLayouts = useMemo(() => {
    const viewport = getViewport()
    return {
      single: clampLayout(layouts.single, viewport.width, viewport.height),
      dsTop: clampLayout(layouts.dsTop, viewport.width, viewport.height),
      dsBottom: clampLayout(layouts.dsBottom, viewport.width, viewport.height),
    }
  }, [layouts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
  }, [layouts])

  useEffect(() => {
    const handleResize = () => {
      const viewport = getViewport()
      setLayouts((current) => ({
        single: clampLayout(current.single, viewport.width, viewport.height),
        dsTop: clampLayout(current.dsTop, viewport.width, viewport.height),
        dsBottom: clampLayout(current.dsBottom, viewport.width, viewport.height),
      }))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const setLayout = useCallback((id: FloatingWindowId, layout: FloatingWindowLayout) => {
    const viewport = getViewport()
    setLayouts((current) => ({
      ...current,
      [id]: clampLayout(layout, viewport.width, viewport.height),
    }))
  }, [])

  const resetLayouts = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS)
  }, [])

  return {
    layouts: clampedLayouts,
    setLayout,
    resetLayouts,
  }
}
