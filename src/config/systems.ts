export type ConsoleSystem = "DS" | "GBA" | "GBC" | "GB" | "N64" | "SNES" | "NES"

export type ConsoleInfo = {
  id: ConsoleSystem
  label: string
  core: string
  extensions: string[]
  accent: string
}

export const CONSOLES: ConsoleInfo[] = [
  { id: "DS", label: "Nintendo DS", core: "nds", extensions: [".nds"], accent: "bg-red-500" },
  { id: "GBA", label: "Game Boy Advance", core: "gba", extensions: [".gba"], accent: "bg-violet-500" },
  { id: "GBC", label: "Game Boy Color", core: "gb", extensions: [".gbc"], accent: "bg-amber-500" },
  { id: "GB", label: "Game Boy", core: "gb", extensions: [".gb"], accent: "bg-emerald-500" },
  { id: "N64", label: "Nintendo 64", core: "n64", extensions: [".z64", ".n64", ".v64"], accent: "bg-blue-500" },
  { id: "SNES", label: "Super Nintendo", core: "snes", extensions: [".sfc", ".smc"], accent: "bg-fuchsia-500" },
  { id: "NES", label: "Nintendo Entertainment System", core: "nes", extensions: [".nes", ".fds"], accent: "bg-orange-500" },
]

export const getConsoleInfo = (id: ConsoleSystem) => CONSOLES.find((system) => system.id === id)!

export const isValidRomFile = (fileName: string, console: ConsoleSystem) => {
  const lower = fileName.toLowerCase()
  return getConsoleInfo(console).extensions.some((extension) => lower.endsWith(extension))
}
