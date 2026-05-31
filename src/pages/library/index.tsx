import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Cloud, Gamepad2, HardDrive, Play, Plus, ShieldCheck, Trash2, Upload } from "lucide-react"
import { EmptyState, MetricTile, PageHeader } from "@/components/app/PageShell"
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
  const localBytes = localGames.reduce((total, game) => total + game.fileSize, 0)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!isValidRomFile(file.name, consoleSystem)) {
          toast.error(`${file.name} is not a valid ${consoleInfo.label} ROM`)
          continue
        }

        const game = await createLocalGame(file, consoleSystem)
        await addLocalGame(game)
        toast.success(`${game.displayName} added to library`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cartridge bay"
        title="ROM Library"
        description="Add local Nintendo ROMs, pick a console, and launch them from the player. ROM files stay in this browser."
        icon={<Gamepad2 className="size-5" />}
        actions={
          <>
            <Select value={consoleSystem} onValueChange={(value) => setConsoleSystem(value as ConsoleSystem)}>
              <SelectTrigger className="w-full sm:w-[220px]">
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
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Local ROMs" value={String(localGames.length)} detail={formatBytes(localBytes)} icon={<HardDrive className="size-4" />} tone="primary" />
        <MetricTile label="Cloud metadata" value={user ? "Online" : "Local"} detail={user?.email ?? "Login to sync"} icon={<Cloud className="size-4" />} />
        <MetricTile label="Console slot" value={consoleInfo.id} detail={consoleInfo.label} icon={<Gamepad2 className="size-4" />} tone="accent" />
        <MetricTile label="Privacy" value="Browser" detail="ROM files never upload" icon={<ShieldCheck className="size-4" />} />
      </section>

      {localGames.length === 0 ? (
        <EmptyState
          icon={<Plus className="size-5" />}
          title="Library empty"
          description="Pick a console, add a ROM file, then boot it from Play."
          action={<Button onClick={() => inputRef.current?.click()}>Add first ROM</Button>}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {localGames.map((game) => {
            const synced = syncedHashes.has(`${game.console}:${game.sha256}`)
            const system = getConsoleInfo(game.console)

            return (
              <Card key={game.localId} className="overflow-hidden console-panel py-0">
                <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
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
                <CardContent className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border bg-background/55 p-3">
                      <div className="text-xs text-muted-foreground">File</div>
                      <div className="mt-1 truncate font-medium">{game.fileName}</div>
                    </div>
                    <div className="rounded-lg border bg-background/55 p-3">
                      <div className="text-xs text-muted-foreground">Size</div>
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

