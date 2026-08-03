"use client"

import { memo } from "react"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"

export const QuickBar = memo(function QuickBar() {
  const typingMode = useAppStore((s) => s.typingMode)
  const setTypingMode = useAppStore((s) => s.setTypingMode)
  const timeLimit = useAppStore((s) => s.timeLimit)
  const setTimeLimit = useAppStore((s) => s.setTimeLimit)
  const complexWords = useAppStore((s) => s.complexWords)
  const setComplexWords = useAppStore((s) => s.setComplexWords)
  const paragraphMode = useAppStore((s) => s.paragraphMode)
  const setParagraphMode = useAppStore((s) => s.setParagraphMode)

  const modes: { id: "time" | "words" | "quotes" | "code"; label: string; icon: string }[] = [
    { id: "time", label: "time", icon: "⏱️" },
    { id: "words", label: "words", icon: "📝" },
    { id: "quotes", label: "quotes", icon: "💬" },
    { id: "code", label: "code", icon: "💻" },
  ]

  const times = [15, 30, 60, 120]

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl glass-panel bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] shadow-sm text-xs font-semibold select-none backdrop-blur-md">
      {/* Mode Selectors */}
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setTypingMode(m.id)}
            className={cn(
              "px-3 py-1 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              typingMode === m.id
                ? "bg-[var(--accent)] text-white shadow-sm font-bold scale-[1.02]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
            )}
          >
            <span>{m.icon}</span>
            <span className="capitalize">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      {typingMode === "time" && <div className="w-[1px] h-4 bg-[var(--chrome-border)] mx-1 hidden sm:block" />}

      {/* Time Limit Quick Options */}
      {typingMode === "time" && (
        <div className="flex items-center gap-1">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => setTimeLimit(t)}
              className={cn(
                "px-2.5 py-1 rounded-xl transition-all duration-200 cursor-pointer text-[11px] font-bold tabular-nums",
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
        <div className="w-[1px] h-4 bg-[var(--chrome-border)] mx-1 hidden sm:block" />
      )}

      {/* Complex Words Toggle */}
      {(typingMode === "time" || typingMode === "words") && (
        <button
          onClick={() => setComplexWords(!complexWords)}
          className={cn(
            "px-2.5 py-1 rounded-xl transition-all duration-200 cursor-pointer text-[11px] font-semibold flex items-center gap-1",
            complexWords
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
          )}
          title="Toggle Caps & Punctuation"
        >
          <span>@!</span>
          <span className="hidden sm:inline">Punctuation</span>
        </button>
      )}

      {/* Layout Divider */}
      <div className="w-[1px] h-4 bg-[var(--chrome-border)] mx-1 hidden sm:block" />

      {/* Paragraph Mode Toggle */}
      <button
        onClick={() => setParagraphMode(!paragraphMode)}
        className={cn(
          "px-2.5 py-1 rounded-xl transition-all duration-200 cursor-pointer text-[11px] font-semibold flex items-center gap-1.5",
          paragraphMode
            ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
        )}
        title="Toggle Paragraph Mode"
      >
        <span>📖</span>
        <span className="hidden sm:inline">Paragraph</span>
      </button>
    </div>
  )
})
