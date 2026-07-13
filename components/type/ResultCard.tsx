"use client"

import { motion } from "framer-motion"
import type { TypingStats } from "@/types"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { cn } from "@/lib/utils"

interface Props {
  stats: TypingStats
  onRestart: () => void
}

export function ResultCard({ stats, onRestart }: Props) {
  const isPerfect = stats.accuracy === 100 && stats.totalTyped > 0;
  const isPb = stats.wpm > 100; // Simulated PB threshold for now

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-[800px] mx-auto px-6"
    >
      <div className={cn(
        "rounded-[28px] border bg-[var(--chrome-surface-strong)] backdrop-blur-xl p-10 shadow-2xl relative overflow-hidden transition-all duration-700",
        isPerfect ? "border-amber-400/50 shadow-[0_0_80px_-20px_rgba(251,191,36,0.3)]" : "border-[var(--chrome-border)]"
      )}>
        {/* Perfect Test Ambient Glow */}
        {isPerfect && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-amber-600/5 pointer-events-none" />
        )}

        {isPb && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg"
          >
            New Personal Best
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-12 mt-6">
          {/* Main Score */}
          <div className="flex-shrink-0 text-center relative z-10">
            <h2 className={cn(
              "text-[5rem] leading-none font-bold tracking-tighter mb-2 transition-colors",
              isPerfect ? "text-amber-500" : "text-[var(--foreground)]"
            )}>
              <AnimatedNumber value={stats.wpm} />
            </h2>
            <div className="text-sm font-semibold text-[var(--muted)] tracking-widest uppercase">wpm</div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 relative z-10">
            <div>
              <div className="text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.raw} /></div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Raw Speed</div>
            </div>
            <div>
              <div className={cn("text-3xl font-bold tabular-nums", isPerfect && "text-amber-500")}>
                <AnimatedNumber value={stats.accuracy} />%
              </div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.consistency} />%</div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Consistency</div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.mistakes} /></div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Mistakes</div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.streak} /></div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Best Streak</div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">{(stats.elapsedMs / 1000).toFixed(1)}s</div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Time Elapsed</div>
            </div>
          </div>
        </div>

        {/* Action area */}
        <div className="mt-12 pt-8 border-t border-[var(--chrome-border)] flex justify-center relative z-10">
          <button
            onClick={onRestart}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
              isPerfect 
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 hover:shadow-amber-500/25" 
                : "bg-[var(--foreground)] text-[var(--background)] hover:shadow-xl"
            )}
          >
            Start Next Session
          </button>
        </div>
      </div>
    </motion.div>
  )
}
