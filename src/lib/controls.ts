import type { ConsoleSystem } from "@/config/systems"

export type ControlIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29

export type ControlDevice = "keyboard" | "gamepad"

export type ControlBinding = {
  index: ControlIndex
  label: string
  value: string
}

export type ControlProfile = {
  id: string
  name: string
  system: ConsoleSystem
  device: ControlDevice
  bindings: ControlBinding[]
  builtIn?: boolean
}

const CONTROL_DEFS: Array<Omit<ControlBinding, "value">> = [
  { index: 4, label: "Up" },
  { index: 5, label: "Down" },
  { index: 6, label: "Left" },
  { index: 7, label: "Right" },
  { index: 8, label: "A" },
  { index: 0, label: "B" },
  { index: 9, label: "X" },
  { index: 1, label: "Y" },
  { index: 2, label: "Select" },
  { index: 3, label: "Start" },
  { index: 10, label: "L" },
  { index: 11, label: "R" },
  { index: 12, label: "L2" },
  { index: 13, label: "R2" },
  { index: 24, label: "Quick save" },
  { index: 25, label: "Quick load" },
  { index: 26, label: "State slot" },
  { index: 27, label: "Fast forward" },
  { index: 28, label: "Rewind" },
  { index: 29, label: "Slow motion" },
]

const KEYBOARD_VALUES: Record<ControlIndex, string> = {
  0: "x",
  1: "s",
  2: "v",
  3: "enter",
  4: "up arrow",
  5: "down arrow",
  6: "left arrow",
  7: "right arrow",
  8: "z",
  9: "a",
  10: "q",
  11: "e",
  12: "tab",
  13: "r",
  24: "1",
  25: "2",
  26: "3",
  27: "add",
  28: "space",
  29: "subtract",
}

const GAMEPAD_VALUES: Record<ControlIndex, string> = {
  0: "0",
  1: "3",
  2: "8",
  3: "9",
  4: "12",
  5: "13",
  6: "14",
  7: "15",
  8: "1",
  9: "2",
  10: "4",
  11: "5",
  12: "6",
  13: "7",
  24: "10",
  25: "11",
  26: "16",
  27: "17",
  28: "18",
  29: "19",
}

const STORAGE_KEY = "rom-deck-control-profiles"
const ACTIVE_PROFILE_KEY = "rom-deck-active-control-profile"

type StoredProfiles = Partial<Record<ConsoleSystem, ControlProfile[]>>
type ActiveProfiles = Partial<Record<ConsoleSystem, string>>

const createBindings = (values: Record<ControlIndex, string>) =>
  CONTROL_DEFS.map((binding) => ({
    ...binding,
    value: values[binding.index],
  }))

const builtInProfiles = (system: ConsoleSystem): ControlProfile[] => [
  {
    id: `${system}:keyboard-default`,
    name: "Keyboard default",
    system,
    device: "keyboard",
    bindings: createBindings(KEYBOARD_VALUES),
    builtIn: true,
  },
  {
    id: `${system}:gamepad-default`,
    name: "Gamepad default",
    system,
    device: "gamepad",
    bindings: createBindings(GAMEPAD_VALUES),
    builtIn: true,
  },
]

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const readStoredProfiles = () => readJson<StoredProfiles>(STORAGE_KEY, {})
const writeStoredProfiles = (profiles: StoredProfiles) => writeJson(STORAGE_KEY, profiles)
const readActiveProfiles = () => readJson<ActiveProfiles>(ACTIVE_PROFILE_KEY, {})
const writeActiveProfiles = (profiles: ActiveProfiles) => writeJson(ACTIVE_PROFILE_KEY, profiles)

export const getControlProfiles = (system: ConsoleSystem) => [
  ...builtInProfiles(system),
  ...(readStoredProfiles()[system] ?? []),
]

export const getActiveProfileId = (system: ConsoleSystem) =>
  readActiveProfiles()[system] ?? `${system}:keyboard-default`

export const setActiveProfileId = (system: ConsoleSystem, profileId: string) => {
  const active = readActiveProfiles()
  active[system] = profileId
  writeActiveProfiles(active)
}

export const getActiveControlProfile = (system: ConsoleSystem) => {
  const profiles = getControlProfiles(system)
  return profiles.find((profile) => profile.id === getActiveProfileId(system)) ?? profiles[0]
}

export const createControlProfile = (
  system: ConsoleSystem,
  sourceProfileId: string,
  name: string,
  device?: ControlDevice,
) => {
  const source = getControlProfiles(system).find((profile) => profile.id === sourceProfileId) ?? getActiveControlProfile(system)
  const profile: ControlProfile = {
    ...source,
    id: crypto.randomUUID(),
    name: name.trim() || `${source.name} copy`,
    device: device ?? source.device,
    builtIn: false,
    bindings: source.bindings.map((binding) => ({ ...binding })),
  }

  const stored = readStoredProfiles()
  stored[system] = [...(stored[system] ?? []), profile]
  writeStoredProfiles(stored)
  setActiveProfileId(system, profile.id)

  return profile
}

export const deleteControlProfile = (system: ConsoleSystem, profileId: string) => {
  const stored = readStoredProfiles()
  stored[system] = (stored[system] ?? []).filter((profile) => profile.id !== profileId)
  writeStoredProfiles(stored)

  if (getActiveProfileId(system) === profileId) {
    setActiveProfileId(system, `${system}:keyboard-default`)
  }
}

export const resetControlProfile = (system: ConsoleSystem, profileId: string) => {
  const stored = readStoredProfiles()
  stored[system] = (stored[system] ?? []).filter((profile) => profile.id !== profileId)
  writeStoredProfiles(stored)
}

export const updateControlProfileBinding = (
  system: ConsoleSystem,
  profileId: string,
  index: ControlIndex,
  value: string,
) => {
  const stored = readStoredProfiles()
  stored[system] = (stored[system] ?? []).map((profile) => {
    if (profile.id !== profileId) return profile

    return {
      ...profile,
      bindings: profile.bindings.map((binding) =>
        binding.index === index ? { ...binding, value: value.trim() } : binding,
      ),
    }
  })
  writeStoredProfiles(stored)
}

export const toEmulatorJsControls = (profile: ControlProfile) => ({
  0: profile.device === "keyboard" ? mapBindings(profile) : {},
  1: profile.device === "gamepad" ? mapBindings(profile) : {},
  2: {},
  3: {},
})

const mapBindings = (profile: ControlProfile) =>
  Object.fromEntries(
    profile.bindings.map((binding) => [
      binding.index,
      {
        value: binding.value,
      },
    ]),
  )
