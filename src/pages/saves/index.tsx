import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { CloudUpload, Download, Info, Save, Trash2, Upload } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/app/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmulator } from "@/context/EmulatorContext"
import { api, type SaveFile } from "@/lib/api"

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
      <EmptyState
        icon={<Save className="size-5" />}
        title="Login required"
        description="Cloud save sync is tied to your account. Local ROM playback still works without signing in."
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cloud memory card"
        title="Save Manager"
        description="Upload manual save files, download cloud slots, or manage states created from the Play page."
        icon={<Save className="size-5" />}
        actions={<Badge variant="outline">{saves.length} files</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="console-panel overflow-hidden py-0">
            <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="size-4 text-primary" />
                Manual upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-lg border bg-background/50 p-3 text-sm">
                <div className="truncate font-medium">{selectedGame?.displayName ?? "No selected game"}</div>
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
              <Input ref={inputRef} type="file" className="hidden" onChange={(event) => void uploadSave(event.target.files)} />
              <Button className="w-full" disabled={!cloudGame || uploading} onClick={() => inputRef.current?.click()}>
                <CloudUpload className="size-4" />
                Pick savefile
              </Button>
            </CardContent>
          </Card>

          <Card className="console-panel overflow-hidden py-0">
            <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-4 text-primary" />
                Save guide
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 text-sm">
              <GuideItem title="Fast cloud save" text="Use Save cloud in Play. Same slot overwrites old state." />
              <GuideItem title="Auto-load" text="Power on downloads newest cloud state for the selected game." />
              <GuideItem title="Manual files" text="Use this page for exported SRAM or state files." />
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          {saves.length === 0 ? (
            <EmptyState title="No cloud saves" description="Boot a game and use Save cloud, or upload a save file manually." className="min-h-[420px]" />
          ) : (
            saves.map((save) => (
              <div key={save.id} className="flex flex-col gap-3 console-panel p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Slot {save.slot}</span>
                    <Badge>{save.kind}</Badge>
                    <Badge variant="outline">{formatBytes(save.sizeBytes)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Updated {new Date(save.updatedAt).toLocaleString()}</div>
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
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function GuideItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-background/55 p-3">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  )
}

