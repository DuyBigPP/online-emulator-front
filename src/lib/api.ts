import type { ConsoleSystem } from "@/config/systems"
import { API_BASE_URL } from "@/config/env"

type ApiOptions = RequestInit & {
  json?: unknown
}

const request = async <T>(path: string, options: ApiOptions = {}) => {
  const headers = new Headers(options.headers)
  const init: RequestInit = {
    ...options,
    credentials: "include",
    headers,
  }

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json")
    init.body = JSON.stringify(options.json)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init)

  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`
    let message = fallback
    try {
      const body = await response.json()
      message = body?.error?.message ?? fallback
    } catch {
      message = fallback
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type AuthUser = {
  id: number
  email: string
  displayName: string | null
}

export type GameProfile = {
  id: number
  userId: number
  console: ConsoleSystem
  displayName: string
  fileName: string
  fileSize: number
  sha256: string
  lastPlayedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SaveFile = {
  id: number
  gameProfileId: number
  slot: number
  kind: "SRAM" | "STATE"
  sizeBytes: number
  checksum: string | null
  createdAt: string
  updatedAt: string
}

export const api = {
  auth: {
    me: () => request<{ user: AuthUser }>("/api/auth/me"),
    register: (data: { email: string; password: string; displayName?: string }) =>
      request<{ user: AuthUser }>("/api/auth/register", { method: "POST", json: data }),
    login: (data: { email: string; password: string }) =>
      request<{ user: AuthUser }>("/api/auth/login", { method: "POST", json: data }),
    logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  },
  games: {
    list: () => request<{ games: GameProfile[] }>("/api/games"),
    create: (data: {
      console: ConsoleSystem
      displayName: string
      fileName: string
      fileSize: number
      sha256: string
      lastPlayedAt?: string
    }) => request<{ game: GameProfile }>("/api/games", { method: "POST", json: data }),
    update: (id: number, data: { displayName?: string; lastPlayedAt?: string | null }) =>
      request<{ game: GameProfile }>(`/api/games/${id}`, { method: "PATCH", json: data }),
    delete: (id: number) => request<void>(`/api/games/${id}`, { method: "DELETE" }),
  },
  saves: {
    list: (gameProfileId?: number) => {
      const query = gameProfileId ? `?gameProfileId=${gameProfileId}` : ""
      return request<{ saves: SaveFile[] }>(`/api/saves${query}`)
    },
    upload: (gameProfileId: number, slot: number, file: Blob, kind: SaveFile["kind"]) =>
      request<{ save: SaveFile }>(`/api/saves/${gameProfileId}/${slot}?kind=${kind}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      }),
    delete: (id: number) => request<void>(`/api/saves/${id}`, { method: "DELETE" }),
    downloadUrl: (id: number) => `${API_BASE_URL}/api/saves/${id}/download`,
    download: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/saves/${id}/download`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      return response.blob()
    },
  },
}
