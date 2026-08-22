"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Volume2, Waves } from "lucide-react"
import { switchProfiles } from "@/lib/switches"
import type { SwitchProfile } from "@/types"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"

/**
 * F3 — Switch Lab: immersive sound picker. Pick a switch (instant preview
 * on any keypress), tune the dampener, or apply a room preset.
 */

const DAMPENERS = [
  { id: "none", label: "None", desc: "Pure clack" },
  { id: "tape", label: "Tape Mod", desc: "Creamy mids" },
  { id: "foam", label: "Foam Mod", desc: "Deep thock" },
  { id: "gasket", label: "Gasket", desc: "Soft cushion" },
]

const ROOM_PRESETS = [
  { id: "desk", label: "Bare Desk", reverb: 0.12 },
  { id: "wooden", label: "Wooden Desk", reverb: 0.32 },
  { id: "studio", label: "Studio", reverb: 0.6 },
]

// Stem color heuristic per switch family
function stemColor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes("blue")) return "#3b82f6"
  if (n.includes("red")) return "#ef4444"
  if (n.includes("brown")) return "#a16207"
  if (n.includes("black")) return "#27272a"
  if (n.includes("panda")) return "#f5f5f4"
  if (n.includes("cream")) return "#fef3c7"
  if (n.includes("purple")) return "#8b5cf6"
  if (n.includes("oreo")) return "#18181b"
  if (n.includes("teal") || n.includes("turquoise")) return "#14b8a6"
  return "#71717a"
}

export function SwitchLab({ open, onClose }: { open: boolean; onClose: () => void }) {
  const switchPackId = useAppStore((s) => s.switchPackId)
  const setSwitchPackId = useAppStore((s) => s.setSwitchPackId)
  const dampenerId = useAppStore((s) => s.dampenerId)
  const setDampenerId = useAppStore((s) => s.setDampenerId)
  const reverb = useAppStore((s) => s.reverb)
  const setReverb = useAppStore((s) => s.setReverb)

  const handlePack = (pack: SwitchProfile) => {
    setSwitchPackId(pack.packId)
  }

  const activeRoom = ROOM_PRESETS.find((r) => Math.abs(r.reverb - reverb) < 0.02)?.id

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-xl bg-black/30"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[28px] border border-[var(--chrome-border)] p-6 sm:p-8"
            style={{ background: "var(--chrome-surface-strong)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--chrome-border)]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Switch Lab</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">
                  Build your sound
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Pick a switch, then press any keys to hear it instantly.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Switch Lab"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch grid */}
            <div className="py-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {switchProfiles.map((sw) => {
                const active = sw.packId === switchPackId
                return (
                  <button
                    key={sw.id}
                    onClick={() => handlePack(sw)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200",
                      active
                        ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 shadow-sm"
                        : "border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)] hover:border-[var(--foreground)]/20"
                    )}
                  >
                    {/* Mini switch illustration */}
                    <span
                      className="relative w-9 h-9 rounded-lg border border-[var(--chrome-border)] shrink-0 flex items-center justify-center"
                      style={{ background: "var(--chrome-surface-strong)" }}
                    >
                      <span
                        className="w-2 h-5 rounded-sm"
                        style={{
                          background: stemColor(sw.name),
                          boxShadow: active ? `0 0 8px ${stemColor(sw.name)}` : undefined,
                        }}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-xs font-semibold truncate", active ? "text-[var(--accent)]" : "text-[var(--foreground)]")}>
                        {sw.name}
                      </span>
                      <span className="block text-[10px] text-[var(--muted)] font-medium">
                        {active ? "active — press keys to test" : "tap to load"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Dampener */}
            <div className="border-t border-[var(--chrome-border)] pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-2">
                Acoustic dampener
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAMPENERS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDampenerId(d.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left cursor-pointer transition-colors",
                      dampenerId === d.id
                        ? "border-[var(--accent)]/60 bg-[var(--accent)]/10"
                        : "border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)]"
                    )}
                  >
                    <span className={cn("block text-[11px] font-bold", dampenerId === d.id ? "text-[var(--accent)]" : "text-[var(--foreground)]")}>
                      {d.label}
                    </span>
                    <span className="block text-[10px] text-[var(--muted)]">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Room presets */}
            <div className="border-t border-[var(--chrome-border)] mt-4 pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-2 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" /> Room
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_PRESETS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReverb(r.reverb)}
                    className={cn(
                      "py-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5",
                      activeRoom === r.id
                        ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
                    )}
                  >
                    <Volume2 className="w-3 h-3 opacity-70" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
