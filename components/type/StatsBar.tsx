"use client"

import type { TypingStats } from "@/types"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { useAppStore } from "@/stores/useAppStore"
import { cn } from "@/lib/utils"
import { getFontClass } from "@/lib/fonts"

interface StatItemProps {
  label: string
  value: number
  suffix?: string
  format?: (v: number) => string
}

function StatItem({ label, value, suffix, format }: StatItemProps) {
  const fontFamily = useAppStore((s) => s.fontFamily)
  const fontClass = getFontClass(fontFamily)

  return (
    <div className={cn(
      "glass-panel glass-glow flex flex-col items-center justify-center py-3 px-4 rounded-xl min-w-[100px] flex-1 select-none",
      "transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-default"
    )}>
      <span className={cn(
        "text-[10px] font-bold tracking-widest text-[var(--muted)] uppercase mb-1.5 opacity-80",
        fontClass
      )}>
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <AnimatedNumber
          value={value}
          className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)]"
          format={format}
        />
        {suffix && (
          <span className="text-xs font-semibold text-[var(--muted)]">{suffix}</span>
        )}
      </div>
    </div>
  )
}

interface Props {
  stats: TypingStats
  wordIndex?: number
  totalWords?: number
}

export function StatsBar({ stats }: Props) {
  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000)
    const timeLeft = Math.max(30 - sec, 0)
    return `${timeLeft}s`
  }

  return (
    <div className="w-full max-w-[900px] mx-auto px-8 my-6">
      <div className="flex flex-wrap justify-between gap-3">
        <StatItem label="WPM" value={stats.wpm} />
        <StatItem label="Acc" value={stats.accuracy} suffix="%" />
        <StatItem label="Raw" value={stats.raw} />
        <StatItem label="Cons" value={stats.consistency} suffix="%" />
        <StatItem label="Time" value={stats.elapsedMs} format={formatTime} />
        <StatItem label="Mistakes" value={stats.mistakes} />
        <StatItem label="Streak" value={stats.streak} />
      </div>
    </div>
  )
}
