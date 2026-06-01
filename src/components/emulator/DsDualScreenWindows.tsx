import type { ReactNode, RefObject } from "react"
import { useEffect, useRef, useState } from "react"
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

// melonDS in EmulatorJS renders BOTH screens (top + bottom) stacked into a
// single canvas. We pick the brightest of any canvas the iframe exposes and
// share one MediaStream with the top window.
const getCanvasScore = (canvas: HTMLCanvasElement) => {
  const scanCanvas = document.createElement("canvas")
  scanCanvas.width = SCAN_SIZE
  scanCanvas.height = SCAN_SIZE
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

const pickBrightestCanvas = (iframe: HTMLIFrameElement | null): HTMLCanvasElement | null => {
  try {
    const canvases = Array.from(iframe?.contentDocument?.querySelectorAll("canvas") ?? [])
    if (canvases.length === 0) return null
    return canvases.sort((a, b) => getCanvasScore(b) - getCanvasScore(a))[0] ?? null
  } catch {
    return null
  }
}

const useStreamFromCanvas = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  running: boolean,
) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
  }, [running])

  useEffect(() => {
    if (!running) return

    let cancelled = false
    let attempts = 0
    let timer: number | null = null
    const backoffSteps = [0, 500, 1000, 1500, 2000, 2500, 3000]

    const tryAttach = () => {
      if (cancelled || streamRef.current) return
      const canvas = pickBrightestCanvas(iframeRef.current)
      if (!canvas) {
        scheduleNext()
        return
      }

      try {
        // 30 fps gives a noticeably smoother top screen than the old 8 fps.
        const stream = canvas.captureStream(30)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {
            // Autoplay may be blocked; user can press play.
          })
        }
        setReady(true)
        return
      } catch {
        scheduleNext()
      }
    }

    const scheduleNext = () => {
      if (cancelled) return
      attempts += 1
      if (attempts >= 12) {
        setReady(false)
        return
      }
      const delay = backoffSteps[Math.min(attempts, backoffSteps.length - 1)] ?? 3000
      timer = window.setTimeout(tryAttach, delay)
    }

    tryAttach()

    const handleVisibility = () => {
      if (!videoRef.current) return
      if (document.hidden) {
        videoRef.current.pause()
      } else if (streamRef.current) {
        void videoRef.current.play().catch(() => undefined)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [iframeRef, running])

  return { videoRef, ready }
}

export function DsDualScreenWindows({
  iframeRef,
  running,
  sourceFrame,
  layouts,
  onLayoutChange,
  onReset,
}: DsDualScreenWindowsProps) {
  const top = useStreamFromCanvas(iframeRef, running)

  return (
    <>
      <DsScreenWindow
        title="DS Top screen"
        layout={layouts.dsTop}
        onLayoutChange={(layout) => onLayoutChange("dsTop", layout)}
        onReset={onReset}
      >
        <TopScreenView videoRef={top.videoRef} ready={top.ready} />
      </DsScreenWindow>
      <DsScreenWindow
        title="DS Touch screen"
        layout={layouts.dsBottom}
        onLayoutChange={(layout) => onLayoutChange("dsBottom", layout)}
        onReset={onReset}
      >
        {/* Iframe is visible here at 1× so taps on the touch screen reach
            melonDS. clip-path shows only the bottom half of the combined
            canvas. Saves ~50% of the iframe's pixel work vs the old 2×
            height trick. */}
        <div className="h-full w-full overflow-hidden bg-black">
          <div className="h-full w-full" style={{ clipPath: "inset(50% 0 0 0)" }}>
            {sourceFrame}
          </div>
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

function TopScreenView({
  videoRef,
  ready,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  ready: boolean
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Video displays the 256×384 source at 1×; clip-path shows the top half. */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="absolute inset-0 h-full w-full object-fill [image-rendering:pixelated]"
        style={{ clipPath: "inset(0 0 50% 0)" }}
      />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/70">
          Waiting for DS video
        </div>
      ) : null}
    </div>
  )
}
