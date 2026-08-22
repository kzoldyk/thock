"use client"

import { memo } from "react"
import type { SessionState } from "@/types"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"

interface TimerBarProps {
  elapsedMs: number
  sessionState: SessionState
}

/**
 * Spacebar-shaped countdown bar — the thock signature timer.
 * A wide keycap that depletes with the session, styled with the app's
 * theme tokens. Glows and pulses through the final seconds.
 */
export const TimerBar = memo(function TimerBar({ elapsedMs, sessionState }: TimerBarProps) {
  const timeLimit = useAppStore((s) => s.timeLimit)
  const total = timeLimit * 1000
  const remaining = Math.max(0, total - elapsedMs)
  const progress = sessionState === "idle" ? 1 : remaining / total
  const secondsLeft = sessionState === "idle" ? timeLimit : Math.ceil(remaining / 1000)
  const urgent = sessionState === "typing" && secondsLeft <= 5

  return (
    <div className="w-full max-w-[620px] mx-auto px-3 sm:px-6 select-none">
      <div
        role="timer"
        aria-label={`${secondsLeft} seconds remaining`}
        className={cn(
          "relative h-[34px] sm:h-[40px] rounded-xl border overflow-hidden transition-colors duration-300",
          "bg-[var(--chrome-surface)]",
          urgent
            ? "border-[var(--danger)]/60 shadow-[0_0_18px_rgba(244,63,94,0.35)]"
            : "border-[var(--chrome-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-2px_3px_rgba(0,0,0,0.10)]"
        )}
      >
        {/* Depleting fill, anchored right so it drains toward the thumbs */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 transition-[width] duration-150 ease-linear",
            urgent ? "bg-[var(--danger)]/25" : "bg-[var(--accent)]/12"
          )}
          style={{ width: `${progress * 100}%` }}
        />

        {/* Leading drain edge */}
        {progress > 0 && progress < 1 && (
          <div
            className={cn(
              "absolute inset-y-0 w-[2px] transition-[left] duration-150 ease-linear transition-colors",
              urgent
                ? "bg-[var(--danger)] shadow-[0_0_10px_var(--danger)]"
                : "bg-[var(--accent)]/50"
            )}
            style={{ left: `${(1 - progress) * 100}%` }}
          />
        )}

        {/* Stabilizer notches — spacebar hardware detail */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[3px] h-2.5 rounded-full bg-[var(--foreground)]/8" />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[3px] h-2.5 rounded-full bg-[var(--foreground)]/8" />

        {/* Keycap legend: seconds remaining */}
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          <span
            className={cn(
              "text-sm sm:text-base font-bold tabular-nums tracking-tight transition-colors duration-300",
              urgent
                ? "text-[var(--danger)] animate-heartbeat"
                : "text-[var(--foreground)] opacity-80"
            )}
          >
            {secondsLeft}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300",
              urgent ? "text-[var(--danger)]" : "text-[var(--muted)]"
            )}
          >
            sec
          </span>
        </div>

        {/* Heartbeat glow — pulses once per remaining second */}
        {urgent && (
          <div className="absolute inset-0 pointer-events-none bg-[var(--danger)] animate-heartbeat-glow" />
        )}
      </div>
    </div>
  )
})
