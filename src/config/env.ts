export const API_BASE_URL = import.meta.env.VITE_API_URL
export const EMULATORJS_DATA_URL = import.meta.env.VITE_EMULATORJS_DATA_URL
export const EMULATORJS_LOADER_URL = import.meta.env.VITE_EMULATORJS_LOADER_URL

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is required. Set it in frontend/SHADCN_BASE/.env")
}

if (!EMULATORJS_DATA_URL || !EMULATORJS_LOADER_URL) {
  throw new Error("EmulatorJS env vars are required. Set them in frontend/SHADCN_BASE/.env")
}
