import type { ComponentProps, ReactNode, RefObject } from "react"
import { forwardRef, useEffect, useRef, useState } from "react"
import { FloatingEmulatorWindow } from "@/components/emulator/FloatingEmulatorWindow"
import type { FloatingLayouts, FloatingWindowLayout } from "@/hooks/use-floating-layout"

type DsDualScreenWindowsProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  running: boolean
  sourceFrame: ReactNode
  layouts: FloatingLayouts
  onLayoutChange: (id: "dsTop" | "dsBottom", layout: FloatingWindowLayout) => void
  onReset: () => void
}

const SCAN_SIZE = 32
const scanCanvas = document.createElement("canvas")
scanCanvas.width = SCAN_SIZE
scanCanvas.height = SCAN_SIZE

const getCanvasScore = (canvas: HTMLCanvasElement) => {
  const context = scanCanvas.getContext("2d", { willReadFrequently: true })
  if (!context || canvas.width === 0 || canvas.height === 0) return 0

  try {
    context.clearRect(0, 0, SCAN_SIZE, SCAN_SIZE)
    context.drawImage(canvas, 0, 0, SCAN_SIZE, SCAN_SIZE)
    const data = context.getImageData(0, 0, SCAN_SIZE, SCAN_SIZE).data
    let brightPixels = 0

    for (let index = 0; index < data.length; index += 4) {
      if (data[index] + data[index + 1] + data[index + 2] > 36) {
        brightPixels += 1
      }
    }

    return brightPixels * canvas.width * canvas.height
  } catch {
    return canvas.width * canvas.height
  }
}

const getSourceCanvas = (iframe: HTMLIFrameElement | null) => {
  try {
    const canvases = Array.from(iframe?.contentDocument?.querySelectorAll("canvas") ?? [])
    return canvases.sort((a, b) => getCanvasScore(b) - getCanvasScore(a))[0] ?? null
  } catch {
    return null
  }
}

export function DsDualScreenWindows({
  iframeRef,
  running,
  sourceFrame,
  layouts,
  onLayoutChange,
  onReset,
}: DsDualScreenWindowsProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [mirrorReady, setMirrorReady] = useState(false)

  useEffect(() => {
    setMirrorReady(false)
  }, [running])

  useEffect(() => {
    if (!running) return

    let cancelled = false
    let attempts = 0

    const startMirror = () => {
      if (cancelled || streamRef.current) return
      attempts += 1

      const source = getSourceCanvas(iframeRef.current)
      if (!source) {
        if (attempts > 20) setMirrorReady(false)
        return
      }

      try {
        const stream = source.captureStream(8)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
        setMirrorReady(true)
      } catch {
        setMirrorReady(false)
      }
    }

    startMirror()
    const interval = window.setInterval(startMirror, 500)
    const handleVisibility = () => {
      if (!videoRef.current) return
      if (document.hidden) {
        videoRef.current.pause()
      } else if (streamRef.current) {
        void videoRef.current.play()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [iframeRef, running])

  return (
    <>
      <DsScreenWindow
        title="DS Top screen"
        layout={layouts.dsTop}
        onLayoutChange={(layout) => onLayoutChange("dsTop", layout)}
        onReset={onReset}
      >
        <MirrorVideo ref={videoRef} ready={mirrorReady} />
      </DsScreenWindow>
      <DsScreenWindow
        title="DS Touch screen"
        layout={layouts.dsBottom}
        onLayoutChange={(layout) => onLayoutChange("dsBottom", layout)}
        onReset={onReset}
      >
        <div className="h-full w-full overflow-hidden bg-black">
          <div className="h-[200%] w-full -translate-y-1/2">{sourceFrame}</div>
        </div>
      </DsScreenWindow>
    </>
  )
}

function DsScreenWindow({
  title,
  layout,
  children,
  onLayoutChange,
  onReset,
}: {
  title: string
  layout: FloatingWindowLayout
  children: ReactNode
  onLayoutChange: (layout: FloatingWindowLayout) => void
  onReset: () => void
}) {
  return (
    <FloatingEmulatorWindow
      title={title}
      layout={layout}
      minWidth={256}
      minHeight={192}
      onLayoutChange={onLayoutChange}
      onReset={onReset}
    >
      {children}
    </FloatingEmulatorWindow>
  )
}

const MirrorVideo = forwardRef<
  HTMLVideoElement,
  {
    ready: boolean
  } & ComponentProps<"video">
>(({ ready, ...props }, ref) => (
  <div className="relative h-full w-full bg-black">
    <div className="h-full w-full overflow-hidden">
      <video
        ref={ref}
        muted
        playsInline
        {...props}
        className="h-[200%] w-full object-fill [image-rendering:pixelated]"
      />
    </div>
    {!ready ? (
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/70">
        Waiting for DS video
      </div>
    ) : null}
  </div>
))


