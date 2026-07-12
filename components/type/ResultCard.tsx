"use client"

import { motion } from "framer-motion"
import type { TypingStats } from "@/types"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"

interface Props {
  stats: TypingStats
  onRestart: () => void
}

export function ResultCard({ stats, onRestart }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-[600px] mx-auto px-6"
    >
      <div className="rounded-2xl border border-[var(--muted)]/20 bg-[var(--background)]/80 backdrop-blur-sm p-8 shadow-xl">
        <h2 className="text-4xl font-bold text-center tracking-tight mb-8">
          <AnimatedNumber value={stats.wpm} /> <span className="text-lg font-normal text-[var(--muted)]">wpm</span>
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">{stats.raw}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Raw</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{stats.accuracy}%</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{stats.consistency}%</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Consistency</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{stats.mistakes}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Mistakes</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{stats.streak}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Best Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{(stats.elapsedMs / 1000).toFixed(1)}s</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Time</div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            Restart
          </button>
        </div>
      </div>
    </motion.div>
  )
}
