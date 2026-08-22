"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { audioEngine } from "@/engines/audioEngine"

const PRESS_TARGET = 10

/**
 * F1 — The Initiation: first-visit keycap ritual.
 * A single centered keycap; every keystroke thocks, ripples, and fills
 * the ring. After PRESS_TARGET presses the interface blooms open.
 * Doubles as the Web Audio gesture unlock.
 */
export function Initiation({ onComplete }: { onComplete: () => void }) {
  const [presses, setPresses] = useState(0)
  const [ripples, setRipples] = useState<{ id: number; char: string }[]>([])
  const [lastChar, setLastChar] = useState("·")
  const [done, setDone] = useState(false)
  const completingRef = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || completingRef.current) return
      if (!/^(Key[A-Z]|Space|Semicolon|Comma|Period)$/.test(e.code)) return
      e.preventDefault()

      audioEngine.playDown(e.code, 0)

      const char = e.code === "Space" ? "␣" : e.code.startsWith("Key") ? e.code[3].toLowerCase() : ";"
      setLastChar(char)
      setRipples((r) => [...r.slice(-5), { id: Date.now() + Math.random(), char }])
      setPresses((p) => p + 1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (presses >= PRESS_TARGET && !completingRef.current) {
      completingRef.current = true
      setDone(true)
    }
  }, [presses])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onComplete, 1100)
    return () => clearTimeout(t)
  }, [done, onComplete])

  // Ring geometry
  const R = 118
  const CIRC = 2 * Math.PI * R
  const progress = Math.min(1, presses / PRESS_TARGET)

  return (
    <motion.div
      data-testid="initiation-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(14px)", scale: 1.05 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center select-none cursor-default"
      style={{ background: "var(--background)" }}
    >
      {/* Ambient accent glow */}
      <div className="absolute top-[20%] left-[30%] right-[30%] h-[35%] bg-gradient-to-b from-[var(--accent)]/8 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Keycap + progress ring */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        <svg width="280" height="280" viewBox="0 0 280 280" className="absolute inset-0 -rotate-90">
          <circle cx="140" cy="140" r={R} fill="none" stroke="var(--chrome-border)" strokeWidth="3" />
          <circle
            cx="140" cy="140" r={R} fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            style={{ transition: "stroke-dashoffset 350ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-[150px] h-[150px] rounded-2xl border-2 border-[var(--accent)]/40 pointer-events-none"
            />
          ))}
        </AnimatePresence>

        {/* The keycap */}
        <motion.div
          key={presses}
          initial={{ scale: 0.955 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 700, damping: 26 }}
          className={cnKeycap()}
        >
          <span
            className={`text-4xl font-bold transition-colors duration-300 ${
              done ? "text-[var(--accent)]" : "text-[var(--foreground)]"
            }`}
          >
            {done ? "✓" : lastChar}
          </span>
        </motion.div>
      </div>

      {/* Copy */}
      <div className="mt-10 text-center h-12">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.p
              key="welcome"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-semibold text-[var(--foreground)] tracking-tight"
            >
              welcome<span className="text-[var(--accent)]">.</span>
            </motion.p>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-[var(--muted)] font-medium">press any key</p>
              <p className="mt-1 text-[11px] tabular-nums text-[var(--muted)] opacity-70">
                {presses} / {PRESS_TARGET}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function cnKeycap(): string {
  return [
    "relative z-10 w-[150px] h-[150px] rounded-[28px]",
    "flex items-center justify-center",
    "bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)]",
    "shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-6px_10px_rgba(0,0,0,0.14),0_20px_50px_rgba(0,0,0,0.25)]",
  ].join(" ")
}
