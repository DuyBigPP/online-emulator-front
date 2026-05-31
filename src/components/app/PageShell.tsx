import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type CommandHeaderProps = {
  kicker?: string
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CommandHeader({ kicker, eyebrow, title, description, icon, actions, className }: CommandHeaderProps) {
  return (
    <section className={cn("console-panel overflow-hidden p-4 md:p-5", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {(kicker ?? eyebrow) ? <div className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground">{kicker ?? eyebrow}</div> : null}
          <div className="mt-2 flex min-w-0 items-center gap-3">
            {icon ? <div className="control-face flex size-11 shrink-0 items-center justify-center text-primary">{icon}</div> : null}
            <div className="min-w-0">
              <h1 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">{title}</h1>
              {description ? <p className="mt-1 max-w-[68ch] text-sm leading-6 text-muted-foreground">{description}</p> : null}
            </div>
          </div>
        </div>
        {actions ? <div className="grid shrink-0 gap-2 sm:flex sm:items-center">{actions}</div> : null}
      </div>
    </section>
  )
}

type StatusStripProps = {
  children: ReactNode
  className?: string
}

export function StatusStrip({ children, className }: StatusStripProps) {
  return <section className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</section>
}

type ConsolePanelProps = {
  title?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function ConsolePanel({ title, icon, action, children, className, contentClassName }: ConsolePanelProps) {
  return (
    <section className={cn("console-panel overflow-hidden", className)}>
      {title || action ? (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3">
          {title ? (
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              {icon ? <span className="text-primary">{icon}</span> : null}
              <span className="truncate">{title}</span>
            </div>
          ) : <span />}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  )
}

type MetricPlateProps = {
  label: string
  value: string
  detail?: string
  icon?: ReactNode
  tone?: "default" | "primary" | "warm" | "accent"
}

export function MetricPlate({ label, value, detail, icon, tone = "default" }: MetricPlateProps) {
  return (
    <div className={cn("metric-plate", tone === "primary" && "metric-plate-primary", (tone === "warm" || tone === "accent") && "metric-plate-warm")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground">{label}</div>
          <div className="mt-2 truncate font-mono text-2xl font-semibold leading-none tabular-nums">{value}</div>
          {detail ? <div className="mt-2 truncate text-xs text-muted-foreground">{detail}</div> : null}
        </div>
        {icon ? <div className="control-face flex size-9 shrink-0 items-center justify-center text-primary">{icon}</div> : null}
      </div>
    </div>
  )
}

type EmptyDockStateProps = {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyDockState({ icon, title, description, action, className }: EmptyDockStateProps) {
  return (
    <div className={cn("console-panel grid min-h-[340px] place-items-center border-dashed p-8 text-center", className)}>
      <div className="max-w-sm">
        {icon ? <div className="control-face mx-auto flex size-14 items-center justify-center text-primary">{icon}</div> : null}
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}

export const PageHeader = CommandHeader
export const MetricTile = MetricPlate
export const EmptyState = EmptyDockState


