import { useState } from "react"
import { toast } from "sonner"
import { Copy, Gamepad2, Palette, RefreshCcw, ServerCog, Trash2, UserRound } from "lucide-react"
import { PageHeader } from "@/components/app/PageShell"
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

  const activeProfile = profiles.find((profile) => profile.id === profileId) ?? getActiveControlProfile(controlSystem)

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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Console settings"
        title="Settings"
        description="Manage API health, cloud session, theme, and input profiles for each console."
        icon={<Gamepad2 className="size-5" />}
        actions={
          <>
            <Button variant="outline" disabled={checking} onClick={() => void checkBackend()}>
              <RefreshCcw className="size-4" />
              Check backend
            </Button>
            <Button variant="outline" onClick={() => void refreshAll()}>Refresh data</Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-3">
            <InfoCard
              title="Backend"
              icon={<ServerCog className="size-4 text-primary" />}
              rows={[
                ["Health", health],
                ["API", API_BASE_URL],
              ]}
              badge={health}
            />
            <InfoCard
              title="Session"
              icon={<UserRound className="size-4 text-primary" />}
              rows={[
                ["Mode", user ? "Cloud sync" : "Local guest"],
                ["Account", user?.email ?? "None"],
              ]}
              badge={user ? "Cloud" : "Local"}
            />
            <Card className="console-panel overflow-hidden py-0">
              <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="size-4 text-primary" />
                  Display
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div>
                  <div className="text-sm font-medium">Theme</div>
                  <div className="mt-1 text-xs capitalize text-muted-foreground">{theme}</div>
                </div>
                <ModeToggle />
              </CardContent>
            </Card>
          </section>

          <Card className="console-panel overflow-hidden py-0">
            <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <CardTitle className="text-base">Control profiles</CardTitle>
                <div className="grid gap-2 sm:grid-cols-2 xl:w-[520px]">
                  <Select value={controlSystem} onValueChange={(value) => updateControlSystem(value as ConsoleSystem)}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(260px,360px)_auto]">
                <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background/55 p-3">
                  <Badge variant={activeProfile.device === "keyboard" ? "default" : "secondary"}>{activeProfile.device}</Badge>
                  <span className="min-w-0 truncate text-sm font-medium">{activeProfile.name}</span>
                  {activeProfile.builtIn ? <Badge variant="outline">Default</Badge> : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input value={newProfileName} onChange={(event) => setNewProfileName(event.target.value)} placeholder={`Copy ${activeProfile.name}`} />
                  <Button variant="outline" onClick={createProfile}>
                    <Copy className="size-4" />
                    New
                  </Button>
                </div>
                <Button variant="outline" disabled={activeProfile.builtIn} onClick={deleteProfile}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {activeProfile.bindings.map((binding) => (
                  <label key={binding.index} className="grid min-w-0 gap-1.5 rounded-lg border bg-background/55 p-3 text-sm">
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
          <GuideCard
            title="Quick guide"
            items={[
              "Add ROM in Library. ROM remains in this browser.",
              "Open Play, choose game, press Power on.",
              "Power on auto-loads the newest cloud state when available.",
              "Use Save cloud to write state to database.",
              "Pick a keyboard or gamepad profile before powering on.",
            ]}
          />
          <GuideCard
            title="Cloud saves"
            items={[
              "Save cloud writes current state to selected slot.",
              "Using the same slot overwrites the old state.",
              "Manual upload is for exported files only.",
              "Login is only needed for cloud metadata and save sync.",
            ]}
          />
        </aside>
      </div>
    </div>
  )
}

function InfoCard({ title, icon, rows, badge }: { title: string; icon: React.ReactNode; rows: Array<[string, string]>; badge: string }) {
  return (
    <Card className="console-panel overflow-hidden py-0">
      <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">{icon}{title}</span>
          <Badge variant={badge === "ok" || badge === "Cloud" ? "default" : "outline"}>{badge}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-background/55 p-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="min-w-0 max-w-[220px] truncate text-right text-sm font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GuideCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="console-panel overflow-hidden py-0">
      <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 text-sm text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-4">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </CardContent>
    </Card>
  )
}

