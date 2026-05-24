import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { api, type AuthUser, type GameProfile, type SaveFile } from "@/lib/api"
import { localLibrary, type LocalGame } from "@/lib/localLibrary"

type EmulatorContextValue = {
  user: AuthUser | null
  localGames: LocalGame[]
  cloudGames: GameProfile[]
  cloudSaves: SaveFile[]
  selectedGame: LocalGame | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  refreshLocalGames: () => Promise<void>
  refreshCloud: () => Promise<void>
  addLocalGame: (game: LocalGame) => Promise<void>
  removeLocalGame: (localId: string) => Promise<void>
  selectGame: (localId: string) => Promise<void>
  markPlayed: (localId: string) => Promise<void>
}

const EmulatorContext = createContext<EmulatorContextValue | null>(null)

export function EmulatorProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [localGames, setLocalGames] = useState<LocalGame[]>([])
  const [cloudGames, setCloudGames] = useState<GameProfile[]>([])
  const [cloudSaves, setCloudSaves] = useState<SaveFile[]>([])
  const [selectedGame, setSelectedGame] = useState<LocalGame | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshLocalGames = useCallback(async () => {
    const games = await localLibrary.list()
    games.sort((a, b) => (b.lastPlayedAt ?? b.createdAt).localeCompare(a.lastPlayedAt ?? a.createdAt))
    setLocalGames(games)
    setSelectedGame((current) => {
      if (!current) return games[0] ?? null
      return games.find((game) => game.localId === current.localId) ?? games[0] ?? null
    })
  }, [])

  const refreshCloud = useCallback(async () => {
    if (!user) {
      setCloudGames([])
      setCloudSaves([])
      return
    }

    const [gamesResponse, savesResponse] = await Promise.all([api.games.list(), api.saves.list()])
    setCloudGames(gamesResponse.games)
    setCloudSaves(savesResponse.saves)
  }, [user])

  const syncLocalGamesToCloud = useCallback(async (games: LocalGame[]) => {
    if (!games.length) {
      const [gamesResponse, savesResponse] = await Promise.all([api.games.list(), api.saves.list()])
      setCloudGames(gamesResponse.games)
      setCloudSaves(savesResponse.saves)
      return
    }

    await Promise.all(
      games.map((game) =>
        api.games.create({
          console: game.console,
          displayName: game.displayName,
          fileName: game.fileName,
          fileSize: game.fileSize,
          sha256: game.sha256,
          lastPlayedAt: game.lastPlayedAt ?? undefined,
        }),
      ),
    )

    const [gamesResponse, savesResponse] = await Promise.all([api.games.list(), api.saves.list()])
    setCloudGames(gamesResponse.games)
    setCloudSaves(savesResponse.saves)
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.auth.me()
        setUser(response.user)
      } catch {
        setUser(null)
      } finally {
        await refreshLocalGames()
        setLoading(false)
      }
    })()
  }, [refreshLocalGames])

  useEffect(() => {
    void refreshCloud().catch(() => {
      setCloudGames([])
      setCloudSaves([])
    })
  }, [refreshCloud])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login({ email, password })
    setUser(response.user)
    await syncLocalGamesToCloud(localGames)
    toast.success("Da dang nhap")
  }, [localGames, syncLocalGamesToCloud])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const response = await api.auth.register({ email, password, displayName })
    setUser(response.user)
    await syncLocalGamesToCloud(localGames)
    toast.success("Tai khoan da san sang")
  }, [localGames, syncLocalGamesToCloud])

  const logout = useCallback(async () => {
    await api.auth.logout()
    setUser(null)
    setCloudGames([])
    setCloudSaves([])
    toast.success("Da dang xuat")
  }, [])

  const addLocalGame = useCallback(
    async (game: LocalGame) => {
      await localLibrary.put(game)
      await refreshLocalGames()

      if (user) {
        await syncLocalGamesToCloud([game])
      }
    },
    [refreshLocalGames, syncLocalGamesToCloud, user],
  )

  const removeLocalGame = useCallback(
    async (localId: string) => {
      await localLibrary.delete(localId)
      await refreshLocalGames()
    },
    [refreshLocalGames],
  )

  const selectGame = useCallback(async (localId: string) => {
    const game = await localLibrary.get(localId)
    setSelectedGame(game ?? null)
  }, [])

  const markPlayed = useCallback(
    async (localId: string) => {
      const game = await localLibrary.get(localId)
      if (!game) return

      const updated = { ...game, lastPlayedAt: new Date().toISOString() }
      await localLibrary.put(updated)
      setSelectedGame(updated)
      await refreshLocalGames()

      if (user) {
        const cloudGame = cloudGames.find(
          (item) => item.sha256 === updated.sha256 && item.console === updated.console,
        )
        if (cloudGame) {
          await api.games.update(cloudGame.id, { lastPlayedAt: updated.lastPlayedAt })
          await refreshCloud()
        }
      }
    },
    [cloudGames, refreshCloud, refreshLocalGames, user],
  )

  const value = useMemo(
    () => ({
      user,
      localGames,
      cloudGames,
      cloudSaves,
      selectedGame,
      loading,
      login,
      register,
      logout,
      refreshLocalGames,
      refreshCloud,
      addLocalGame,
      removeLocalGame,
      selectGame,
      markPlayed,
    }),
    [
      user,
      localGames,
      cloudGames,
      cloudSaves,
      selectedGame,
      loading,
      login,
      register,
      logout,
      refreshLocalGames,
      refreshCloud,
      addLocalGame,
      removeLocalGame,
      selectGame,
      markPlayed,
    ],
  )

  return <EmulatorContext.Provider value={value}>{children}</EmulatorContext.Provider>
}

export const useEmulator = () => {
  const value = useContext(EmulatorContext)
  if (!value) {
    throw new Error("useEmulator must be used inside EmulatorProvider")
  }
  return value
}
