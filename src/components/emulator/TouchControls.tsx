import type { ControlBinding } from "@/lib/controls"
import { cn } from "@/lib/utils"

type TouchControlsProps = {
  bindings: ControlBinding[]
  targetWindow: Window | null
  enabled: boolean
}

const primaryButtons = ["A", "B", "X", "Y"]
const shoulderButtons = ["L", "R", "Select", "Start"]

export function TouchControls({ bindings, targetWindow, enabled }: TouchControlsProps) {
  if (!enabled) return null

  const byLabel = new Map(bindings.map((binding) => [binding.label, binding]))

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-between p-3 sm:p-5">
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <TouchButton binding={byLabel.get("Up")} targetWindow={targetWindow} className="col-start-2" />
        <div />
        <TouchButton binding={byLabel.get("Left")} targetWindow={targetWindow} />
        <div className="rounded-md border border-white/15 bg-black/30" />
        <TouchButton binding={byLabel.get("Right")} targetWindow={targetWindow} />
        <div />
        <TouchButton binding={byLabel.get("Down")} targetWindow={targetWindow} className="col-start-2" />
        <div />
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-3">
        <div className="grid grid-cols-2 gap-2">
          {primaryButtons.map((label) => (
            <TouchButton key={label} binding={byLabel.get(label)} targetWindow={targetWindow} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {shoulderButtons.map((label) => (
            <TouchButton key={label} binding={byLabel.get(label)} targetWindow={targetWindow} size="sm" />
          ))}
        </div>
      </div>
    </div>
  )
}

function TouchButton({
  binding,
  targetWindow,
  size = "md",
  className,
}: {
  binding?: ControlBinding
  targetWindow: Window | null
  size?: "sm" | "md"
  className?: string
}) {
  const press = (pressed: boolean) => {
    if (!binding || !targetWindow) return
    targetWindow.dispatchEvent(
      new KeyboardEvent(pressed ? "keydown" : "keyup", {
        key: binding.value,
        code: binding.value,
        bubbles: true,
      }),
    )
  }

  return (
    <button
      type="button"
      className={cn(
        "select-none rounded-md border border-white/20 bg-black/55 font-semibold text-white shadow-lg backdrop-blur-sm active:bg-primary/80",
        size === "md" ? "size-12 text-sm sm:size-14" : "h-9 min-w-12 px-2 text-[11px]",
        className,
      )}
      onPointerDown={(event) => {
        event.preventDefault()
        press(true)
      }}
      onPointerUp={(event) => {
        event.preventDefault()
        press(false)
      }}
      onPointerCancel={() => press(false)}
      onPointerLeave={() => press(false)}
    >
      {binding?.label ?? ""}
    </button>
  )
}
