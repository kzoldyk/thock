"use client"

import { useEffect } from "react"
import { useAppStore } from "@/stores/useAppStore"

export function useReducedMotion() {
  const setReducedMotion = useAppStore((s) => s.setReducedMotion)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [setReducedMotion])

  return reducedMotion
}
