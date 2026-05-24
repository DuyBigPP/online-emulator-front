import { useEffect, useState } from "react"

const detectTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches ||
  window.matchMedia("(max-width: 768px)").matches ||
  navigator.maxTouchPoints > 0

export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice())

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: coarse)")
    const widthQuery = window.matchMedia("(max-width: 768px)")
    const update = () => setIsTouchDevice(detectTouchDevice())

    pointerQuery.addEventListener("change", update)
    widthQuery.addEventListener("change", update)

    return () => {
      pointerQuery.removeEventListener("change", update)
      widthQuery.removeEventListener("change", update)
    }
  }, [])

  return isTouchDevice
}
