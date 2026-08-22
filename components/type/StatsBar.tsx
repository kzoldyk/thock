"use client"

import { memo } from "react"
import type { SessionState, TypingStats } from "@/types"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"
import { getFontClass } from "@/lib/fonts"

interface Props {
  stats: TypingStats
  sessionState: SessionState
  wordIndex?: number
  totalWords?: number
}

/**
 * F4 — One hero number. Live WPM is the single loud element; everything
 * else is quiet sidecar text. Flat surface (no glass), glanceable.
 */
export const StatsBar = memo(function StatsBar({ stats, sessionState }: Props) {
  const mode = useAppStore((s) => s.typingMode)
  const timeLimit = useAppStore((s) => s.timeLimit)
  const fontFamily = useAppStore((s) => s.fontFamily)
  const fontClass = getFontClass(fontFamily)

  const formatTime = (ms: number) => {
    const sec = ms / 1000
    if (mode === "time") {
      const timeLeft = Math.max(timeLimit - Math.floor(sec), 0)
      return `${timeLeft}s`
    }
    return `${sec.toFixed(1)}s`
  }

  const displayWpm = sessionState === "finished" ? stats.wpm : stats.liveWpm

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-8 my-2 sm:my-3 select-none">
      <div
        className={cn(
          "flex items-center justify-between gap-6 rounded-2xl border px-5 py-3",
          "border-[var(--chrome-border)] bg-transparent"
        )}
      >
        {/* Hero: live WPM */}
        <div className="flex items-baseline gap-2.5 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
            wpm
          </span>
          <AnimatedNumber
            value={displayWpm}
            className="text-5xl sm:text-6xl leading-none font-bold tabular-nums tracking-tight text-[var(--foreground)]"
          />
        </div>

        {/* Quiet sidecars */}
        <div className={cn("flex items-center gap-5 sm:gap-7", fontClass)}>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Acc
            </span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-[var(--foreground)]">
              <AnimatedNumber value={stats.accuracy} />%
            </span>
          </div>

          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Time
            </span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-[var(--foreground)]">
              {formatTime(stats.elapsedMs)}
            </span>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Raw
            </span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-[var(--foreground)] opacity-80">
              <AnimatedNumber value={stats.raw} />
            </span>
          </div>

          {/* Micro indicators: mistakes + streak */}
          <div className="hidden lg:flex flex-col items-end gap-0.5">
            <span
              className={cn(
                "text-[11px] font-semibold tabular-nums",
                stats.mistakes > 0 ? "text-[var(--danger)]" : "text-[var(--muted)]"
              )}
            >
              {stats.mistakes} mistake{stats.mistakes === 1 ? "" : "s"}
            </span>
            {stats.streak > 0 && (
              <span className="text-[11px] font-semibold tabular-nums text-[var(--success)]">
                streak {stats.streak}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
