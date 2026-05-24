import type { ConsoleSystem } from "@/config/systems"

const DB_NAME = "online-emulator-library"
const DB_VERSION = 1
const STORE_NAME = "roms"

export type LocalGame = {
  localId: string
  console: ConsoleSystem
  displayName: string
  fileName: string
  fileSize: number
  sha256: string
  lastPlayedAt: string | null
  createdAt: string
  file: Blob
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const withStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const request = callback(transaction.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

export const localLibrary = {
  list: () => withStore<LocalGame[]>("readonly", (store) => store.getAll() as IDBRequest<LocalGame[]>),
  put: (game: LocalGame) => withStore<IDBValidKey>("readwrite", (store) => store.put(game)),
  get: (localId: string) => withStore<LocalGame | undefined>("readonly", (store) => store.get(localId)),
  delete: (localId: string) => withStore<undefined>("readwrite", (store) => store.delete(localId)),
}

export const hashFile = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export const createLocalGame = async (file: File, console: ConsoleSystem): Promise<LocalGame> => {
  const sha256 = await hashFile(file)
  const now = new Date().toISOString()
  const displayName = file.name.replace(/\.[^.]+$/, "")

  return {
    localId: crypto.randomUUID(),
    console,
    displayName,
    fileName: file.name,
    fileSize: file.size,
    sha256,
    lastPlayedAt: null,
    createdAt: now,
    file,
  }
}
