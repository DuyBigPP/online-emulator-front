import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Download, Info, Save, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, type SaveFile } from "@/lib/api"
import { useEmulator } from "@/context/EmulatorContext"

const formatBytes = (value: number) => `${(value / 1024).toFixed(1)} KB`

export default function SavesPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { user, selectedGame, cloudGames, cloudSaves, refreshCloud } = useEmulator()
  const [slot, setSlot] = useState("1")
  const [kind, setKind] = useState<SaveFile["kind"]>("SRAM")
  const [uploading, setUploading] = useState(false)

  const cloudGame = useMemo(() => {
    if (!selectedGame) return null
    return cloudGames.find((game) => game.console === selectedGame.console && game.sha256 === selectedGame.sha256) ?? null
  }, [cloudGames, selectedGame])

  const saves = useMemo(() => {
    if (!cloudGame) return []
    return cloudSaves.filter((save) => save.gameProfileId === cloudGame.id)
  }, [cloudGame, cloudSaves])

  const uploadSave = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !cloudGame) return

    setUploading(true)
    try {
      await api.saves.upload(cloudGame.id, Number(slot), file, kind)
      await refreshCloud()
      toast.success("Savefile synced")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const deleteSave = async (id: number) => {
    await api.saves.delete(id)
    await refreshCloud()
    toast.success("Save deleted")
  }

  if (!user) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border bg-card p-8 text-center">
        <div className="max-w-sm">
          <Save className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Login required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cloud save sync is tied to your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="rounded-lg py-5">
          <CardHeader className="px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4 text-primary" />
              Upload save
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{selectedGame?.displayName ?? "No selected game"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {cloudGame ? "Cloud profile matched" : "Open Library while logged in to sync game metadata"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Slot {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={kind} onValueChange={(value) => setKind(value as SaveFile["kind"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SRAM">SRAM</SelectItem>
                  <SelectItem value="STATE">State</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) => void uploadSave(event.target.files)}
            />
            <Button className="w-full" disabled={!cloudGame || uploading} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              Pick savefile
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-lg py-5">
          <CardHeader className="px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" />
              Save guide
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 text-sm text-muted-foreground">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-foreground">Fast cloud save</div>
                <ol className="mt-2 list-decimal space-y-2 pl-4">
                  <li>Open Play and keep the game running.</li>
                  <li>Choose a slot next to Save cloud.</li>
                  <li>Press Save cloud to write current state to database.</li>
                  <li>Power on auto-loads the newest cloud state for that game.</li>
                  <li>Using the same slot overwrites the old state.</li>
                </ol>
              </div>
              <div>
                <div className="font-medium text-foreground">Manual file save</div>
                <ol className="mt-2 list-decimal space-y-2 pl-4">
                  <li>Export a save from the emulator menu.</li>
                  <li>Pick slot and kind here, then upload the file.</li>
                  <li>Download it later from Cloud Saves.</li>
                </ol>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Badge variant="outline">Save cloud = state</Badge>
              <Badge variant="outline">Power on = auto-load</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Cloud Saves</h1>
              <p className="mt-1 text-sm text-muted-foreground">Database saves for the current selected game.</p>
            </div>
            <Badge variant="outline">{saves.length} files</Badge>
          </div>
        </div>
        {saves.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No cloud saves for this game.
          </div>
        ) : (
          <div className="grid gap-3">
            {saves.map((save) => (
              <div key={save.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Slot {save.slot}</span>
                    <Badge>{save.kind}</Badge>
                    <Badge variant="outline">{formatBytes(save.sizeBytes)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(save.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={api.saves.downloadUrl(save.id)}>
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => void deleteSave(save.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
