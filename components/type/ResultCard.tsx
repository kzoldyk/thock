"use client"

import { motion } from "framer-motion"
import type { TypingStats } from "@/types"
import type { StatsSample } from "@/engines/metrics/history"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { cn } from "@/lib/utils"

interface Props {
  stats: TypingStats
  onRestart: () => void
  history: StatsSample[]
}

function getRankTitle(wpm: number) {
  if (wpm < 20) return "Keyboard Search Party 🐢"
  if (wpm < 40) return "Caffeinated Sloth 🦥"
  if (wpm < 60) return "Average Joe ☕"
  if (wpm < 80) return "Office Hero 🚀"
  if (wpm < 100) return "Keyboard Ninja 🥷"
  if (wpm < 130) return "Cyberpunk Hacker 💻"
  if (wpm < 160) return "Speed of Light ⚡"
  return "Sentient AI 🤖"
}

export function ResultCard({ stats, onRestart, history }: Props) {
  const isPerfect = stats.accuracy === 100 && stats.totalTyped > 0;
  const isPb = stats.wpm > 100; // Simulated PB threshold for now

  // Chart computation
  const wpmData = history.map(h => h.liveWpm);
  const maxWpm = Math.max(...wpmData, 50, stats.wpm); // Ensure some vertical space
  const minWpm = 0;
  
  // Create an SVG path for the chart
  const createPath = (data: number[]) => {
    if (data.length < 2) return "";
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - minWpm) / (maxWpm - minWpm)) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };
  
  const pathData = createPath(wpmData);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-[800px] mx-auto px-6"
    >
      <div className={cn(
        "rounded-[28px] border bg-[var(--chrome-surface-strong)] backdrop-blur-xl p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-700",
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
            className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg z-20"
          >
            New Personal Best
          </motion.div>
        )}

        {/* WPM Chart Background */}
        <div className="absolute inset-x-0 bottom-[120px] top-[140px] opacity-10 dark:opacity-[0.07] pointer-events-none overflow-hidden mask-fade-out">
           {pathData && (
             <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="drop-shadow-2xl">
               <motion.path
                 d={pathData}
                 fill="none"
                 stroke="var(--foreground)"
                 strokeWidth="4"
                 vectorEffect="non-scaling-stroke"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 initial={{ pathLength: 0, opacity: 0 }}
                 animate={{ pathLength: 1, opacity: 1 }}
                 transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
               />
               <motion.path
                 d={`${pathData} L 100 100 L 0 100 Z`}
                 fill="var(--foreground)"
                 opacity="0.2"
                 vectorEffect="non-scaling-stroke"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.2 }}
                 transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
               />
             </svg>
           )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 sm:gap-12 mt-6">
          {/* Main Score */}
          <div className="flex-shrink-0 text-center relative z-10 w-full md:w-auto">
            <h2 className={cn(
              "text-[5rem] leading-none font-bold tracking-tighter mb-1 transition-colors drop-shadow-sm",
              isPerfect ? "text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "text-[var(--foreground)]"
            )}>
              <AnimatedNumber value={stats.wpm} />
            </h2>
            <div className="text-sm font-semibold text-[var(--muted)] tracking-widest uppercase">wpm</div>
            
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-[var(--foreground)] inline-block shadow-sm"
            >
              {getRankTitle(stats.wpm)}
            </motion.div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-8 sm:gap-y-10 relative z-10 w-full">
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.raw} /></div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Raw Speed</div>
            </div>
            <div>
              <div className={cn("text-2xl sm:text-3xl font-bold tabular-nums", isPerfect && "text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]")}>
                <AnimatedNumber value={stats.accuracy} />%
              </div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.consistency} />%</div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Consistency</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.mistakes} /></div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Mistakes</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums"><AnimatedNumber value={stats.streak} /></div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Best Streak</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{(stats.elapsedMs / 1000).toFixed(1)}s</div>
              <div className="text-[9px] sm:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest mt-1">Time Elapsed</div>
            </div>
          </div>
        </div>

        {/* Action area */}
        <div className="mt-12 pt-8 border-t border-[var(--chrome-border)] flex justify-center relative z-10">
          <button
            onClick={onRestart}
            className={cn(
               "group flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
              isPerfect 
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 hover:shadow-amber-500/25" 
                : "bg-[var(--foreground)] text-[var(--background)] hover:shadow-xl"
            )}
          >
            Start Next Session
            <span className="opacity-60 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
