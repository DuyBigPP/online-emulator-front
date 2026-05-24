import { useState } from "react"
import { toast } from "sonner"
import { Copy, RefreshCcw, ServerCog, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/components/ui/theme-provider"
import { API_BASE_URL } from "@/config/env"
import { CONSOLES, type ConsoleSystem } from "@/config/systems"
import { useEmulator } from "@/context/EmulatorContext"
import {
  createControlProfile,
  deleteControlProfile,
  getActiveControlProfile,
  getActiveProfileId,
  getControlProfiles,
  setActiveProfileId,
  updateControlProfileBinding,
  type ControlIndex,
} from "@/lib/controls"

export default function SettingsPage() {
  const { theme } = useTheme()
  const { user, refreshCloud, refreshLocalGames } = useEmulator()
  const [checking, setChecking] = useState(false)
  const [health, setHealth] = useState<"unknown" | "ok" | "down">("unknown")
  const [controlSystem, setControlSystem] = useState<ConsoleSystem>("GBA")
  const [profiles, setProfiles] = useState(() => getControlProfiles("GBA"))
  const [profileId, setProfileId] = useState(() => getActiveProfileId("GBA"))
  const [newProfileName, setNewProfileName] = useState("")

  const activeProfile =
    profiles.find((profile) => profile.id === profileId) ?? getActiveControlProfile(controlSystem)

  const checkBackend = async () => {
    setChecking(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, { credentials: "include" })
      setHealth(response.ok ? "ok" : "down")
      toast.success(response.ok ? "Backend online" : "Backend returned error")
    } catch {
      setHealth("down")
      toast.error("Backend offline")
    } finally {
      setChecking(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([refreshLocalGames(), refreshCloud()])
    toast.success("Refreshed")
  }

  const updateControlSystem = (system: ConsoleSystem) => {
    setControlSystem(system)
    setProfiles(getControlProfiles(system))
    setProfileId(getActiveProfileId(system))
  }

  const updateProfile = (id: string) => {
    setActiveProfileId(controlSystem, id)
    setProfileId(id)
  }

  const updateKey = (index: ControlIndex, value: string) => {
    if (activeProfile.builtIn) return
    updateControlProfileBinding(controlSystem, activeProfile.id, index, value)
    setProfiles(getControlProfiles(controlSystem))
  }

  const createProfile = () => {
    const profile = createControlProfile(controlSystem, activeProfile.id, newProfileName)
    setProfiles(getControlProfiles(controlSystem))
    setProfileId(profile.id)
    setNewProfileName("")
    toast.success("Profile created")
  }

  const deleteProfile = () => {
    if (activeProfile.builtIn) return
    deleteControlProfile(controlSystem, activeProfile.id)
    setProfiles(getControlProfiles(controlSystem))
    setProfileId(getActiveProfileId(controlSystem))
    toast.success("Profile deleted")
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ServerCog className="size-4 text-primary" />
                Backend connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">API base URL</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{API_BASE_URL}</div>
                </div>
                <Badge variant={health === "ok" ? "default" : "outline"}>{health}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button disabled={checking} onClick={() => void checkBackend()}>
                  <RefreshCcw className="size-4" />
                  Check backend
                </Button>
                <Button variant="outline" onClick={() => void refreshAll()}>
                  Refresh data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Session</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Mode</span>
                <Badge variant={user ? "default" : "outline"}>{user ? "Cloud sync" : "Local guest"}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Theme</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm capitalize text-muted-foreground">{theme}</span>
                  <ModeToggle />
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border p-3 sm:col-span-2 lg:col-span-1">
                <span className="text-sm text-muted-foreground">Account</span>
                <span className="min-w-0 max-w-[220px] truncate text-right text-sm font-medium">{user?.email ?? "None"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Control profiles</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={controlSystem} onValueChange={(value) => updateControlSystem(value as ConsoleSystem)}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSOLES.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={profileId} onValueChange={updateProfile}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="flex min-w-0 items-center gap-2 rounded-md border p-3">
                <Badge variant={activeProfile.device === "keyboard" ? "default" : "secondary"}>
                  {activeProfile.device}
                </Badge>
                <span className="min-w-0 truncate text-sm font-medium">{activeProfile.name}</span>
                {activeProfile.builtIn ? <Badge variant="outline">Default</Badge> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[320px]">
                <Input
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  placeholder={`Copy ${activeProfile.name}`}
                />
                <Button variant="outline" onClick={createProfile}>
                  <Copy className="size-4" />
                  New profile
                </Button>
              </div>
              <Button variant="outline" disabled={activeProfile.builtIn} onClick={deleteProfile}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeProfile.bindings.map((binding) => (
                <label key={binding.index} className="grid min-w-0 gap-1.5 rounded-md border p-3 text-sm">
                  <span className="font-medium">{binding.label}</span>
                  <Input
                    value={binding.value}
                    disabled={activeProfile.builtIn}
                    onChange={(event) => updateKey(binding.index, event.target.value)}
                    placeholder={activeProfile.device === "keyboard" ? "key name" : "button index"}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Built-in profiles are read-only. Create a profile to edit. Keyboard uses names like z, enter, up arrow. Gamepad uses button indexes.
            </p>
          </CardContent>
        </Card>
      </div>

      <aside className="grid gap-5 xl:block xl:space-y-5">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Quick guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Add ROM in Library. ROM remains in this browser.</li>
              <li>Open Play, choose game, press Power on.</li>
              <li>Power on auto-loads the newest cloud state when available.</li>
              <li>Use Power off to stop emulator and release current ROM.</li>
              <li>Use Save cloud to write state to database.</li>
              <li>Pick a keyboard or gamepad profile before powering on.</li>
              <li>Login only if you want cloud metadata and savefile sync.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Cloud saves</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="font-medium">Save cloud</div>
              <p className="mt-1 text-xs text-muted-foreground">Pick a slot in Play and save current state directly.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">Auto-load</div>
              <p className="mt-1 text-xs text-muted-foreground">Power on downloads the newest state for the selected game.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">Overwrite</div>
              <p className="mt-1 text-xs text-muted-foreground">Saving to the same slot replaces the old state.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">Gamepad</div>
              <p className="mt-1 text-xs text-muted-foreground">Create a gamepad profile, then choose it in Play before booting.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">Manual upload</div>
              <p className="mt-1 text-xs text-muted-foreground">Use Saves page only when you export a file manually.</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
