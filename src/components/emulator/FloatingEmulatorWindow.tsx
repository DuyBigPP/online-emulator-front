import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize2, RotateCcw, X } from "lucide-react"
import { Rnd } from "react-rnd"
import { Button } from "@/components/ui/button"
import type { FloatingWindowLayout } from "@/hooks/use-floating-layout"
import { cn } from "@/lib/utils"

type FloatingEmulatorWindowProps = {
  title: string
  layout: FloatingWindowLayout
  minWidth: number
  minHeight: number
  children: ReactNode
  className?: string
  onLayoutChange: (layout: FloatingWindowLayout) => void
  onFullscreen?: () => void
  onReset?: () => void
  onClose?: () => void
}

const dragHandleClassName = "emulator-window-drag-handle"

export function FloatingEmulatorLayer({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">{children}</div>,
    document.body,
  )
}

export function FloatingEmulatorWindow({
  title,
  layout,
  minWidth,
  minHeight,
  children,
  className,
  onLayoutChange,
  onFullscreen,
  onReset,
  onClose,
}: FloatingEmulatorWindowProps) {
  return (
    <Rnd
      bounds="parent"
      dragHandleClassName={dragHandleClassName}
      minWidth={minWidth}
      minHeight={minHeight}
      size={{ width: layout.width, height: layout.height }}
      position={{ x: layout.x, y: layout.y }}
      onDragStop={(_event, data) => {
        onLayoutChange({ ...layout, x: data.x, y: data.y })
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        onLayoutChange({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        })
      }}
      className={cn("pointer-events-auto z-10 overflow-hidden rounded-lg border bg-black shadow-2xl", className)}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={cn(
            dragHandleClassName,
            "flex h-10 shrink-0 cursor-move items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-3 text-white",
          )}
        >
          <span className="min-w-0 truncate text-sm font-medium">{title}</span>
          <div className="flex shrink-0 items-center gap-1">
            {onFullscreen ? (
              <Button size="icon" variant="ghost" className="size-7 text-white hover:bg-white/10" onClick={onFullscreen}>
                <Maximize2 className="size-4" />
              </Button>
            ) : null}
            {onReset ? (
              <Button size="icon" variant="ghost" className="size-7 text-white hover:bg-white/10" onClick={onReset}>
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            {onClose ? (
              <Button size="icon" variant="ghost" className="size-7 text-white hover:bg-white/10" onClick={onClose}>
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-black">{children}</div>
      </div>
    </Rnd>
  )
}
