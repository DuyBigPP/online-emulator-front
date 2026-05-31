import type { ReactNode, RefObject } from "react"
import { Play } from "lucide-react"

type EmulatorPlayerFrameProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  screenRef: RefObject<HTMLDivElement | null>
  running: boolean
  iframeDoc: string
  children?: ReactNode
}

export function EmulatorPlayerFrame({
  iframeRef,
  screenRef,
  running,
  iframeDoc,
  children,
}: EmulatorPlayerFrameProps) {
  return (
    <div ref={screenRef} className="relative h-full min-h-[320px] overflow-hidden rounded-md border bg-black">
      {running && iframeDoc ? (
        <>
          <iframe
            ref={iframeRef}
            title="Emulator player"
            srcDoc={iframeDoc}
            tabIndex={0}
            className="h-full w-full border-0"
            allow="cross-origin-isolated; gamepad; fullscreen; autoplay"
          />
          {children}
        </>
      ) : (
        <div className="grid h-full place-items-center p-6 text-center text-white">
          <div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-white/20 bg-white/10">
              <Play className="size-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Ready when ROM inserted</h1>
            <p className="mt-2 text-sm text-white/70">Select a local ROM and power on.</p>
          </div>
        </div>
      )}
    </div>
  )
}
