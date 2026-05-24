import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Cloud, Gamepad2, Play, Plus, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONSOLES, getConsoleInfo, isValidRomFile, type ConsoleSystem } from "@/config/systems"
import { useEmulator } from "@/context/EmulatorContext"
import { createLocalGame } from "@/lib/localLibrary"

const formatBytes = (value: number) => {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export default function LibraryPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { user, localGames, cloudGames, addLocalGame, removeLocalGame, selectGame } = useEmulator()
  const [consoleSystem, setConsoleSystem] = useState<ConsoleSystem>("GBA")
  const [uploading, setUploading] = useState(false)

  const consoleInfo = getConsoleInfo(consoleSystem)
  const syncedHashes = useMemo(() => new Set(cloudGames.map((game) => `${game.console}:${game.sha256}`)), [cloudGames])

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!isValidRomFile(file.name, consoleSystem)) {
          toast.error(`${file.name} khong dung dinh dang ${consoleInfo.label}`)
          continue
        }

        const game = await createLocalGame(file, consoleSystem)
        await addLocalGame(game)
        toast.success(`${game.displayName} da vao library`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="size-5 text-primary" />
                <h1 className="text-2xl font-semibold tracking-normal">ROM Library</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                ROM stays in this browser. Backend only receives metadata and savefiles.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={consoleSystem} onValueChange={(value) => setConsoleSystem(value as ConsoleSystem)}>
                <SelectTrigger className="w-full sm:w-[210px]">
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
              <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
                <Upload className="size-4" />
                Add ROM
              </Button>
              <Input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept={consoleInfo.extensions.join(",")}
                onChange={(event) => void handleFiles(event.target.files)}
              />
            </div>
          </div>
        </div>
        <Card className="rounded-lg py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-base">Console slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">{consoleInfo.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{consoleInfo.extensions.join(", ")}</div>
              </div>
              <span className={`size-3 rounded-full ${consoleInfo.accent}`} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Cloud sync</div>
                <div className="mt-1 text-xs text-muted-foreground">{user ? user.email : "Login required"}</div>
              </div>
              <Badge variant={user ? "default" : "outline"}>{user ? "On" : "Off"}</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {localGames.length === 0 ? (
        <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
          <div className="max-w-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Library empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Pick a console, add a ROM, then launch from Play.</p>
          </div>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {localGames.map((game) => {
            const synced = syncedHashes.has(`${game.console}:${game.sha256}`)
            const system = getConsoleInfo(game.console)

            return (
              <Card key={game.localId} className="rounded-lg py-5">
                <CardHeader className="px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{game.displayName}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{system.label}</Badge>
                        <Badge variant={synced ? "default" : "outline"}>
                          <Cloud className="size-3" />
                          {synced ? "Synced" : "Local"}
                        </Badge>
                      </div>
                    </div>
                    <span className={`mt-1 size-3 rounded-full ${system.accent}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground">File</div>
                      <div className="mt-1 truncate font-medium">{game.fileName}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground">Size</div>
                      <div className="mt-1 font-medium">{formatBytes(game.fileSize)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1" onClick={() => void selectGame(game.localId)}>
                      <Link to="/play">
                        <Play className="size-4" />
                        Play
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => void removeLocalGame(game.localId)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </div>
  )
}
