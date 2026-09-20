"use client"

import { memo, useEffect, useState, useCallback } from "react"
import { Check, Lock, RotateCcw, Sparkles, Target } from "lucide-react"
import {
  KEYBR_PROGRESSION,
  TARGET_CLEAN_STREAK,
  getLearnProgression,
  saveLearnProgression,
  resetLearnProgression,
  type LearnState,
} from "@/lib/learn-progression"
import { cn } from "@/lib/utils"

interface LearnProgressBarProps {
  onRestartSession?: () => void
}

export const LearnProgressBar = memo(function LearnProgressBar({
  onRestartSession,
}: LearnProgressBarProps) {
  const [state, setState] = useState<LearnState>(() => getLearnProgression())
  const [confirmReset, setConfirmReset] = useState(false)

  // Sync state on progression updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LearnState>
      if (customEvent.detail) {
        setState(customEvent.detail)
      } else {
        setState(getLearnProgression())
      }
    }
    window.addEventListener("thock_learn_updated", handleUpdate)
    return () => window.removeEventListener("thock_learn_updated", handleUpdate)
  }, [])

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    const fresh = resetLearnProgression()
    setState(fresh)
    setConfirmReset(false)
    onRestartSession?.()
  }, [confirmReset, onRestartSession])

  const handleSelectUnlockedTarget = useCallback((char: string) => {
    const next: LearnState = {
      ...state,
      targetLetter: char,
      cleanStreak: 0,
      lastUpdated: Date.now(),
    }
    saveLearnProgression(next)
    setState(next)
    onRestartSession?.()
  }, [state, onRestartSession])

  const unlockedLetters = KEYBR_PROGRESSION.slice(0, state.unlockedCount)
  const isTargetMastered = state.unlockedCount === KEYBR_PROGRESSION.length

  return (
    <div className="w-full max-w-[900px] mx-auto px-2 sm:px-4 mb-2 select-none">
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] backdrop-blur-md p-2.5 sm:p-3 shadow-sm">
        {/* Header row: Status & Streak info */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--chrome-border)]/60 text-xs">
          {/* Left: Level counter */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold text-[10px]">
              {state.unlockedCount}
            </span>
            <span className="font-semibold text-[var(--foreground)] tracking-tight">
              {isTargetMastered ? "All 26 Keys Unlocked!" : `Keybr Curriculum — Stage ${state.unlockedCount}/26`}
            </span>
          </div>

          {/* Center: Target key & clean streak meter */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-[var(--accent)]" />
              <span className="text-[11px] text-[var(--muted)] font-medium">Focus:</span>
              <span className="text-[12px] font-black text-[var(--foreground)] uppercase">
                {state.targetLetter}
              </span>
            </div>

            {/* Streak dots toward unlock */}
            <div className="flex items-center gap-1">
              {Array.from({ length: TARGET_CLEAN_STREAK }).map((_, idx) => {
                const filled = idx < state.cleanStreak
                return (
                  <span
                    key={idx}
                    title={`Clean rep ${idx + 1}/${TARGET_CLEAN_STREAK} (≥94% acc, ≥22 WPM)`}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      filled
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-110"
                        : "bg-black/20 dark:bg-white/20"
                    )}
                  />
                )
              })}
            </div>

            <span className="hidden xs:inline text-[10px] text-[var(--muted)]">
              {state.cleanStreak}/{TARGET_CLEAN_STREAK} reps
            </span>
          </div>

          {/* Right: Reset progression */}
          <button
            onClick={handleReset}
            title={confirmReset ? "Click again to confirm reset" : "Reset progression back to 6 keys"}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer",
              confirmReset
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">{confirmReset ? "Confirm?" : "Reset"}</span>
          </button>
        </div>

        {/* 26-Key Progression Ribbon */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
          {KEYBR_PROGRESSION.map((char, index) => {
            const isUnlocked = index < state.unlockedCount
            const isTarget = char === state.targetLetter
            const isMastered = isUnlocked && !isTarget

            return (
              <button
                key={char}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && handleSelectUnlockedTarget(char)}
                title={
                  isTarget
                    ? `Current target letter: ${char.toUpperCase()}`
                    : isUnlocked
                    ? `Click to focus letter: ${char.toUpperCase()}`
                    : `Locked (unlocks at stage ${index + 1})`
                }
                className={cn(
                  "relative flex-1 min-w-[22px] sm:min-w-[28px] h-7 sm:h-8 rounded-lg flex flex-col items-center justify-center transition-all duration-200 text-[11px] sm:text-xs uppercase font-bold",
                  isTarget &&
                    "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30 scale-105 sm:scale-110 ring-2 ring-[var(--accent)]/50 z-10",
                  isMastered &&
                    "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer",
                  !isUnlocked &&
                    "bg-black/5 dark:bg-white/5 border border-transparent text-[var(--muted)] opacity-35 cursor-not-allowed"
                )}
              >
                <span>{char}</span>
                {isMastered && (
                  <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400 -mt-0.5" />
                )}
                {!isUnlocked && (
                  <Lock className="w-1.5 h-1.5 sm:w-2 sm:h-2 opacity-50 -mt-0.5" />
                )}
                {isTarget && (
                  <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white/90 -mt-0.5 animate-spin" style={{ animationDuration: "4s" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
