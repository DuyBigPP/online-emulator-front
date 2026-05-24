import React from "react"
import { Gamepad2, HardDrive, Library, Save, Settings } from "lucide-react"

export type MenuItem = {
  label: string
  path: string
  icon: React.ReactNode
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  { label: "Library", path: "/library", icon: <Library size={16} /> },
  { label: "Play", path: "/play", icon: <Gamepad2 size={16} /> },
  { label: "Saves", path: "/saves", icon: <Save size={16} /> },
  { label: "Storage", path: "/storage", icon: <HardDrive size={16} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={16} /> },
]
