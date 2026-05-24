import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CloudUpload, Disc3, Gamepad2, Maximize2, Play, Power, Square } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { TouchControls } from "@/components/emulator/TouchControls"
import { EMULATORJS_DATA_URL, EMULATORJS_LOADER_URL } from "@/config/env"
import { getConsoleInfo } from "@/config/systems"
import { useEmulator } from "@/context/EmulatorContext"
import { useTouchDevice } from "@/hooks/use-touch-device"
import { api } from "@/lib/api"
import {
  getActiveControlProfile,
  getActiveProfileId,
  getControlProfiles,
  setActiveProfileId,
  toEmulatorJsControls,
  type ControlProfile,
} from "@/lib/controls"

const buildEmulatorDocument = (
  gameUrl: string,
  core: string,
  gameName: string,
  dataUrl: string,
  loaderUrl: string,
  controls: ReturnType<typeof toEmulatorJsControls>,
  loadStateUrl?: string,
) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #game { width: 100%; height: 100%; margin: 0; background: #050505; overflow: hidden; }
      .fallback { height: 100%; display: grid; place-items: center; color: #f4f4f5; font-family: system-ui, sans-serif; text-align: center; padding: 24px; }
      .fallback strong { display: block; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <div id="game">
      <div class="fallback">
        <div><strong>Loading emulator core</strong><span>Fetching EmulatorJS runtime.</span></div>
      </div>
    </div>
    <script>
      window.EJS_player = "#game";
      window.EJS_core = ${JSON.stringify(core)};
      window.EJS_gameName = ${JSON.stringify(gameName)};
      window.EJS_gameUrl = ${JSON.stringify(gameUrl)};
      window.EJS_pathtodata = ${JSON.stringify(dataUrl)};
      window.EJS_startOnLoaded = true;
      window.EJS_defaultControls = ${JSON.stringify(controls)};
      ${loadStateUrl ? `window.EJS_loadStateURL = ${JSON.stringify(loadStateUrl)};` : ""}
    </script>
    <script src=${JSON.stringify(loaderUrl)}></script>
  </body>
</html>`

export default function PlayPage() {
  const { user, localGames, cloudGames, cloudSaves, selectedGame, selectGame, markPlayed, refreshCloud } = useEmulator()
  const isTouchDevice = useTouchDevice()
  const screenRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [running, setRunning] = useState(false)
  const [gameUrl, setGameUrl] = useState<string | null>(null)
  const [loadStateUrl, setLoadStateUrl] = useState<string | null>(null)
  const [stateSlot, setStateSlot] = useState("1")
  const [savingCloud, setSavingCloud] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(true)

  useEffect(() => {
    setRunning(false)
    setGameUrl(null)
    setLoadStateUrl(null)
  }, [selectedGame?.localId])

  useEffect(() => {
    return () => {
      if (gameUrl) URL.revokeObjectURL(gameUrl)
      if (loadStateUrl) URL.revokeObjectURL(loadStateUrl)
    }
  }, [gameUrl, loadStateUrl])

  const system = selectedGame ? getConsoleInfo(selectedGame.console) : null
  const profiles = useMemo(
    () => (selectedGame ? getControlProfiles(selectedGame.console) : []),
    [selectedGame],
  )
  const activeProfile = useMemo<ControlProfile | null>(() => {
    if (!selectedGame) return null
    return profiles.find((profile) => profile.id === (profileId ?? getActiveProfileId(selectedGame.console))) ?? getActiveControlProfile(selectedGame.console)
  }, [profileId, profiles, selectedGame])

  useEffect(() => {
    if (!selectedGame) return
    setProfileId(getActiveProfileId(selectedGame.console))
  }, [selectedGame?.console, selectedGame])

  const iframeDoc = useMemo(() => {
    if (!selectedGame || !system || !gameUrl || !activeProfile) return ""
    return buildEmulatorDocument(
      gameUrl,
      system.core,
      selectedGame.displayName,
      EMULATORJS_DATA_URL,
      EMULATORJS_LOADER_URL,
      toEmulatorJsControls(activeProfile),
      loadStateUrl ?? undefined,
    )
  }, [activeProfile, gameUrl, loadStateUrl, selectedGame, system])

  const changeProfile = (id: string) => {
    if (!selectedGame) return
    setActiveProfileId(selectedGame.console, id)
    setProfileId(id)
  }

  const start = async () => {
    if (!selectedGame) return
    if (gameUrl) URL.revokeObjectURL(gameUrl)
    if (loadStateUrl) URL.revokeObjectURL(loadStateUrl)

    let nextLoadStateUrl: string | null = null
    if (user) {
      const cloudGame = cloudGames.find(
        (game) => game.console === selectedGame.console && game.sha256 === selectedGame.sha256,
      )
      const latestState = cloudGame
        ? cloudSaves
            .filter((save) => save.gameProfileId === cloudGame.id && save.kind === "STATE")
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
        : undefined

      if (latestState) {
        try {
          const blob = await api.saves.download(latestState.id)
          nextLoadStateUrl = URL.createObjectURL(blob)
          setStateSlot(String(latestState.slot))
          toast.success(`Loaded cloud state slot ${latestState.slot}`)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Cloud state load failed")
        }
      }
    }

    const url = URL.createObjectURL(selectedGame.file)
    setGameUrl(url)
    setLoadStateUrl(nextLoadStateUrl)
    setRunning(true)
    await markPlayed(selectedGame.localId)
  }

  const stop = () => {
    if (gameUrl) URL.revokeObjectURL(gameUrl)
    if (loadStateUrl) URL.revokeObjectURL(loadStateUrl)
    setGameUrl(null)
    setLoadStateUrl(null)
    setRunning(false)
  }

  const fullscreen = async () => {
    await screenRef.current?.requestFullscreen()
  }

  const saveStateToCloud = async () => {
    if (!user) {
      toast.error("Login required for cloud save")
      return
    }

    if (!selectedGame) {
      toast.error("No ROM selected")
      return
    }

    const frameWindow = iframeRef.current?.contentWindow as
      | (Window & {
          EJS_emulator?: {
            gameManager?: {
              getState?: () => Uint8Array | ArrayBuffer | number[]
            }
          }
        })
      | null

    const state = frameWindow?.EJS_emulator?.gameManager?.getState?.()
    if (!state) {
      toast.error("Emulator state not ready")
      return
    }

    const bytes =
      state instanceof Uint8Array
        ? state
        : state instanceof ArrayBuffer
          ? new Uint8Array(state)
          : Uint8Array.from(state)

    setSavingCloud(true)
    try {
      const cloudGame =
        cloudGames.find((game) => game.console === selectedGame.console && game.sha256 === selectedGame.sha256) ??
        (
          await api.games.create({
            console: selectedGame.console,
            displayName: selectedGame.displayName,
            fileName: selectedGame.fileName,
            fileSize: selectedGame.fileSize,
            sha256: selectedGame.sha256,
            lastPlayedAt: new Date().toISOString(),
          })
        ).game

      await api.saves.upload(
        cloudGame.id,
        Number(stateSlot),
        new Blob([bytes], { type: "application/octet-stream" }),
        "STATE",
      )
      await refreshCloud()
      toast.success(`Saved state to cloud slot ${stateSlot}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cloud save failed")
    } finally {
      setSavingCloud(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="rounded-lg py-5">
          <CardHeader className="px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Disc3 className="size-4 text-primary" />
              Insert ROM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            {localGames.length ? (
              <Select value={selectedGame?.localId} onValueChange={(value) => void selectGame(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose game" />
                </SelectTrigger>
                <SelectContent>
                  {localGames.map((game) => (
                    <SelectItem key={game.localId} value={game.localId}>
                      {game.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button asChild className="w-full">
                <Link to="/library">Add ROM</Link>
              </Button>
            )}
            {selectedGame && system ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{selectedGame.displayName}</div>
                    <div className="text-xs text-muted-foreground">{system.label}</div>
                  </div>
                  <span className={`size-3 rounded-full ${system.accent}`} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Badge variant="secondary">{selectedGame.console}</Badge>
                  <Badge variant="outline">{selectedGame.fileSize > 0 ? "Ready" : "Empty"}</Badge>
                </div>
              </div>
            ) : null}
            <Button className="w-full" disabled={!selectedGame} onClick={() => void start()}>
              <Power className="size-4" />
              Power on
            </Button>
            {selectedGame && activeProfile ? (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Control profile</span>
                  <Badge variant={activeProfile.device === "keyboard" ? "default" : "secondary"}>
                    {activeProfile.device}
                  </Badge>
                </div>
                <Select value={activeProfile.id} onValueChange={changeProfile}>
                  <SelectTrigger className="w-full">
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
            ) : null}
            {isTouchDevice ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Touch controls</div>
                  <div className="text-xs text-muted-foreground">Auto shown on mobile</div>
                </div>
                <Switch checked={touchControlsEnabled} onCheckedChange={setTouchControlsEnabled} />
              </div>
            ) : null}
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <Select value={stateSlot} onValueChange={setStateSlot}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((slot) => (
                    <SelectItem key={slot} value={String(slot)}>
                      Slot {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={!running || savingCloud} onClick={() => void saveStateToCloud()}>
                <CloudUpload className="size-4" />
                Save cloud
              </Button>
            </div>
            <Button className="w-full" variant="outline" disabled={!running} onClick={stop}>
              <Square className="size-4" />
              Power off
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-lg py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-base">Keyboard</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeProfile?.bindings.slice(0, 14).map((binding) => (
                <div key={binding.index} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                  <span className="text-muted-foreground">{binding.label}</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">{binding.value}</kbd>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Edit profiles in Settings. Choose profile before Power on.</p>
          </CardContent>
        </Card>
      </aside>

      <section className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Gamepad2 className="size-4 text-primary" />
            <span className="truncate text-sm font-medium">{selectedGame?.displayName ?? "No cartridge"}</span>
          </div>
          <Button variant="outline" size="sm" disabled={!running} onClick={() => void fullscreen()}>
            <Maximize2 className="size-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
        </div>
        <div ref={screenRef} className="relative aspect-[4/3] min-h-[320px] overflow-hidden rounded-md border bg-black">
          {running && iframeDoc ? (
            <>
              <iframe
                ref={iframeRef}
                title="Emulator player"
                srcDoc={iframeDoc}
                className="h-full w-full border-0"
                allow="gamepad; fullscreen; autoplay"
              />
              <TouchControls
                bindings={activeProfile?.bindings ?? []}
                targetWindow={iframeRef.current?.contentWindow ?? null}
                enabled={isTouchDevice && touchControlsEnabled}
              />
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-white">
              <div>
                <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-white/20 bg-white/10">
                  <Play className="size-6" />
                </div>
                <h1 className="mt-4 text-xl font-semibold">Ready when ROM inserted</h1>
                <p className="mt-2 text-sm text-white/70">Select a local ROM and power on.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
