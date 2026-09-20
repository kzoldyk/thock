"use client"

import { memo } from "react"
import { Timer, Type, Quote, Code2, Zap, GraduationCap } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { LANGUAGE_OPTIONS, type LanguageId } from "@/lib/data/frequency"
import { cn } from "@/lib/utils"

export const QuickBar = memo(function QuickBar() {
  const typingMode = useAppStore((s) => s.typingMode)
  const setTypingMode = useAppStore((s) => s.setTypingMode)
  const timeLimit = useAppStore((s) => s.timeLimit)
  const setTimeLimit = useAppStore((s) => s.setTimeLimit)
  const complexWords = useAppStore((s) => s.complexWords)
  const setComplexWords = useAppStore((s) => s.setComplexWords)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const adaptiveEngine = useAppStore((s) => s.adaptiveEngine)
  const setAdaptiveEngine = useAppStore((s) => s.setAdaptiveEngine)
  const paragraphMode = useAppStore((s) => s.paragraphMode)
  const setParagraphMode = useAppStore((s) => s.setParagraphMode)
  const zenMode = useAppStore((s) => s.zenMode)
  const setZenMode = useAppStore((s) => s.setZenMode)
  const setDelightMessage = useAppStore((s) => s.setDelightMessage)

  const handleToggleZen = () => {
    const next = !zenMode
    setZenMode(next)
    if (next) {
      setDelightMessage("Zen Mode Active 🧘 — Muted sounds & hidden keyboard for pure focus & peak WPM!")
    } else {
      setDelightMessage("Zen Mode Off ⚡ — Restored keyboard & audio")
    }
    setTimeout(() => {
      if (useAppStore.getState().delightMessage?.startsWith("Zen Mode")) {
        setDelightMessage(null)
      }
    }, 3500)
  }

  const modes: { id: "time" | "words" | "quotes" | "code" | "learn"; label: string; icon: typeof Timer }[] = [
    { id: "time", label: "time", icon: Timer },
    { id: "words", label: "words", icon: Type },
    { id: "quotes", label: "quotes", icon: Quote },
    { id: "code", label: "code", icon: Code2 },
    { id: "learn", label: "learn", icon: GraduationCap },
  ]

  const times = [15, 30, 60, 120]

  return (
    <div className="max-w-full overflow-x-auto no-scrollbar px-2 py-0.5">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl glass-panel bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] shadow-sm text-[11px] sm:text-xs font-semibold select-none backdrop-blur-md whitespace-nowrap min-w-max mx-auto">
        {/* Mode Selectors */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {modes.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setTypingMode(m.id)}
                className={cn(
                  "px-2 xs:px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-1.5",
                  typingMode === m.id
                    ? "bg-[var(--accent)] text-white shadow-sm font-bold scale-[1.02]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="capitalize">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        {(typingMode === "time" || typingMode === "code") && <div className="w-[1px] h-3.5 sm:h-4 bg-[var(--chrome-border)] mx-0.5 sm:mx-1" />}

        {/* Time Limit Quick Options */}
        {(typingMode === "time" || typingMode === "code") && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            {times.map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={cn(
                  "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-bold tabular-nums",
                  timeLimit === t
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
                )}
              >
                {t}s
              </button>
            ))}
          </div>
        )}

        {/* Difficulty Divider */}
        {(typingMode === "time" || typingMode === "words") && (
          <div className="w-[1px] h-3.5 sm:h-4 bg-[var(--chrome-border)] mx-0.5 sm:mx-1" />
        )}

        {/* Complex Words Toggle */}
        {(typingMode === "time" || typingMode === "words") && (
          <button
            onClick={() => setComplexWords(!complexWords)}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-semibold flex items-center gap-1",
              complexWords
                ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
            )}
            title="Toggle Caps & Punctuation"
          >
            <span>@!</span>
            <span className="hidden xs:inline">Punctuation</span>
          </button>
        )}

        {/* Language + Adaptive — only relevant for word modes */}
        {(typingMode === "time" || typingMode === "words") && (
          <>
            <div className="w-[1px] h-3.5 sm:h-4 bg-[var(--chrome-border)] mx-0.5 sm:mx-1" />

            <div className="flex items-center gap-0.5 sm:gap-1">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLanguage(opt.id as LanguageId)}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-semibold",
                    language === opt.id
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
                  )}
                  title={`${opt.label} — top ${opt.ceiling} most common words`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-3.5 sm:h-4 bg-[var(--chrome-border)] mx-0.5 sm:mx-1" />

            <button
              onClick={() => setAdaptiveEngine(!adaptiveEngine)}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-semibold flex items-center gap-1",
                adaptiveEngine
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
              )}
              title="Adaptive engine — personalizes words using your typing telemetry"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden xs:inline">Adaptive</span>
            </button>
          </>
        )}

        {/* Layout Divider */}
        <div className="w-[1px] h-3.5 sm:h-4 bg-[var(--chrome-border)] mx-0.5 sm:mx-1" />

        {/* Paragraph Mode Toggle */}
        <button
          onClick={() => setParagraphMode(!paragraphMode)}
          className={cn(
            "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5",
            paragraphMode
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
          )}
          title="Toggle Paragraph Mode"
        >
          <span>📖</span>
          <span className="hidden xs:inline">Paragraph</span>
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={handleToggleZen}
          className={cn(
            "px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5",
            zenMode
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
          )}
          title="Toggle Zen Mode (Distraction-Free, Muted & Hidden Keyboard for Peak WPM)"
        >
          <span>🧘</span>
          <span className="hidden xs:inline">Zen</span>
        </button>
      </div>
    </div>
  )
})

