"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Trophy, 
  RotateCcw, 
  Zap, 
  Target, 
  Activity, 
  Clock, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  BarChart2
} from "lucide-react"
import type { TypingStats } from "@/types"
import type { StatsSample } from "@/engines/metrics/history"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"

interface Props {
  stats: TypingStats
  onRestart: () => void
  history: StatsSample[]
  currentUser: { id: string; username: string } | null
  onOpenAuth: () => void
  onViewLeaderboard?: () => void
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

export function ResultCard({
  stats,
  onRestart,
  history,
  currentUser,
  onOpenAuth,
  onViewLeaderboard,
}: Props) {
  const isPerfect = stats.accuracy === 100 && stats.totalTyped > 0
  const isPb = stats.wpm > 100

  const typingMode = useAppStore((s) => s.typingMode)
  const timeLimit = useAppStore((s) => s.timeLimit)

  const hasSubmitted = useRef(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Interactive Chart state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeSeries, setActiveSeries] = useState<"both" | "net" | "raw">("both")

  // Silent score submission in background
  useEffect(() => {
    if (!currentUser || hasSubmitted.current) return
    hasSubmitted.current = true

    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wpm: Math.round(Number.isNaN(stats.wpm) ? 0 : stats.wpm),
        accuracy: Math.round(Number.isNaN(stats.accuracy) ? 100 : stats.accuracy),
        consistency: Math.round(Number.isNaN(stats.consistency) ? 100 : stats.consistency),
        timeLimit: timeLimit || 30,
        mode: typingMode || "time",
      }),
    }).catch((err) => {
      console.error("[leaderboard] Silent score submission error:", err?.message || err)
    })
  }, [currentUser, stats.wpm, stats.accuracy, stats.consistency, timeLimit, typingMode])

  // Chart computation & point mapping
  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      // Fallback single or dummy points if history is empty
      return [
        { time: 0, liveWpm: stats.wpm, rawWpm: stats.raw, accuracy: stats.accuracy, incorrectChars: stats.mistakes },
        { time: Math.round(stats.elapsedMs / 1000) || 1, liveWpm: stats.wpm, rawWpm: stats.raw, accuracy: stats.accuracy, incorrectChars: stats.mistakes },
      ]
    }

    const firstTime = history[0].timestamp
    return history.map((sample) => ({
      time: Math.round((sample.timestamp - firstTime) / 1000),
      liveWpm: Math.round(sample.liveWpm),
      rawWpm: Math.round(sample.rawWpm),
      accuracy: Math.round(sample.accuracy),
      incorrectChars: sample.incorrectChars,
    }))
  }, [history, stats])

  const maxVal = useMemo(() => {
    const allWpms = chartData.flatMap((d) => [d.liveWpm, d.rawWpm])
    return Math.max(...allWpms, stats.wpm, stats.raw, 40) + 10
  }, [chartData, stats])

  const chartPoints = useMemo(() => {
    if (chartData.length === 0) return { netPath: "", rawPath: "", areaPath: "", points: [] }

    const width = 100
    const height = 100

    const pts = chartData.map((d, i) => {
      const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2
      const netY = height - (d.liveWpm / maxVal) * height
      const rawY = height - (d.rawWpm / maxVal) * height
      return { x, netY, rawY, ...d }
    })

    const netPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.netY.toFixed(2)}`).join(" ")
    const rawPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.rawY.toFixed(2)}`).join(" ")
    const areaPath = pts.length > 0
      ? `${netPath} L ${pts[pts.length - 1].x.toFixed(2)},100 L ${pts[0].x.toFixed(2)},100 Z`
      : ""

    return { netPath, rawPath, areaPath, points: pts }
  }, [chartData, maxVal])

  // Mouse move handler for interactive crosshair & tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || chartPoints.points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const relativeX = (mouseX / rect.width) * 100

    let closestIdx = 0
    let minDiff = Infinity
    chartPoints.points.forEach((pt, i) => {
      const diff = Math.abs(pt.x - relativeX)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    })

    setHoveredIndex(closestIdx)
  }

  const activePoint = hoveredIndex !== null ? chartPoints.points[hoveredIndex] : null

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 28, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 18,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 180, damping: 20 },
    },
  } as const

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[860px] mx-auto px-4 sm:px-6 my-4"
    >
      <div
        className={cn(
          "rounded-[32px] border bg-[var(--chrome-surface-strong)] backdrop-blur-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-700",
          isPerfect
            ? "border-amber-400/50 shadow-[0_0_90px_-20px_rgba(251,191,36,0.35)]"
            : "border-[var(--chrome-border)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Perfect Test Glow */}
        {isPerfect && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-600/5 pointer-events-none" />
        )}

        {isPb && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-lg z-20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            New Personal Best
          </motion.div>
        )}

        {/* Top Header: Rank Title & Config Badge */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-[var(--foreground)] inline-flex items-center gap-1.5 shadow-sm">
              {getRankTitle(stats.wpm)}
            </span>
            {isPerfect && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 100% Accuracy
              </span>
            )}
          </div>

          <div className="text-xs font-semibold text-[var(--muted)] flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] uppercase tracking-wider text-[10px]">
              {typingMode === "time" ? `${timeLimit || 30}s Time Mode` : `${typingMode || "Practice"} Mode`}
            </span>
          </div>
        </motion.div>

        {/* Hero Section: Big WPM & Detailed Grid */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-10">
          {/* Main Big WPM Card */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 text-center relative z-10 w-full lg:w-auto p-6 sm:p-8 rounded-3xl bg-[var(--chrome-surface-soft)]/50 border border-[var(--chrome-border)] shadow-inner"
          >
            <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.25em] text-[var(--muted)] mb-1 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Typing Speed
            </div>
            <h2
              className={cn(
                "text-[4.5rem] sm:text-[5.5rem] leading-none font-black tracking-tighter transition-colors drop-shadow-md my-1",
                isPerfect
                  ? "text-amber-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                  : "text-[var(--foreground)]"
              )}
            >
              <AnimatedNumber value={stats.wpm} />
            </h2>
            <div className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase mt-1">Net WPM</div>
          </motion.div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                Raw Speed
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.raw} />
                <span className="text-xs font-medium text-[var(--muted)] ml-1">wpm</span>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Accuracy
              </div>
              <div
                className={cn(
                  "text-2xl sm:text-3xl font-extrabold tabular-nums",
                  isPerfect ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-[var(--foreground)]"
                )}
              >
                <AnimatedNumber value={stats.accuracy} />%
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Consistency
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.consistency} />%
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Mistakes
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.mistakes} />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Best Streak
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.streak} />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)]/40 border border-[var(--chrome-border)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Elapsed
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                {(stats.elapsedMs / 1000).toFixed(1)}s
              </div>
            </motion.div>
          </div>
        </div>

        {/* Interactive Performance Graph Section */}
        <motion.div
          variants={itemVariants}
          className="mb-8 p-5 sm:p-6 rounded-3xl bg-[var(--chrome-surface-soft)]/50 border border-[var(--chrome-border)] relative"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
                Performance Pace
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium">
                (Hover chart to inspect details)
              </span>
            </div>

            {/* Interactive Series Controls */}
            <div className="flex items-center gap-1 bg-[var(--chrome-surface-strong)] p-1 rounded-xl border border-[var(--chrome-border)]">
              <button
                onClick={() => setActiveSeries("both")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                  activeSeries === "both"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Both
              </button>
              <button
                onClick={() => setActiveSeries("net")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                  activeSeries === "net"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Net WPM
              </button>
              <button
                onClick={() => setActiveSeries("raw")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                  activeSeries === "raw"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Raw WPM
              </button>
            </div>
          </div>

          {/* SVG Graph Container */}
          <div className="relative w-full h-[180px] sm:h-[220px]">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{maxVal} wpm</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{Math.round(maxVal / 2)} wpm</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>0 wpm</span>
              </div>
            </div>

            {/* SVG Chart */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="overflow-visible cursor-crosshair relative z-10"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="netWpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              {(activeSeries === "both" || activeSeries === "net") && chartPoints.areaPath && (
                <motion.path
                  d={chartPoints.areaPath}
                  fill="url(#netWpmGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}

              {/* Raw WPM Path (Dashed) */}
              {(activeSeries === "both" || activeSeries === "raw") && chartPoints.rawPath && (
                <motion.path
                  d={chartPoints.rawPath}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              )}

              {/* Net WPM Path (Solid) */}
              {(activeSeries === "both" || activeSeries === "net") && chartPoints.netPath && (
                <motion.path
                  d={chartPoints.netPath}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              )}

              {/* Crosshair & Active Hover Dots */}
              {activePoint && (
                <g>
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={activePoint.x}
                    y1="0"
                    x2={activePoint.x}
                    y2="100"
                    stroke="var(--foreground)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.5"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Net WPM Point Circle */}
                  {(activeSeries === "both" || activeSeries === "net") && (
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.netY}
                      r="4"
                      className="fill-[var(--foreground)] stroke-[var(--background)]"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Raw WPM Point Circle */}
                  {(activeSeries === "both" || activeSeries === "raw") && (
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.rawY}
                      r="3"
                      className="fill-blue-400 stroke-[var(--background)]"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* Interactive Floating Tooltip */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-3"
                style={{
                  left: `${activePoint.x}%`,
                  top: `${Math.min(activePoint.netY, activePoint.rawY)}%`,
                }}
              >
                <div className="bg-[var(--chrome-surface-strong)] text-[var(--foreground)] text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl border border-[var(--chrome-border)] whitespace-nowrap flex flex-col gap-1">
                  <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider border-b border-[var(--chrome-border)] pb-1">
                    Time: {activePoint.time}s
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-[var(--foreground)] inline-block" />
                      WPM: <span className="text-amber-400">{activePoint.liveWpm}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[var(--muted)]">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      Raw: <span>{activePoint.rawWpm}</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)] flex items-center justify-between gap-2 pt-0.5">
                    <span>Accuracy: {activePoint.accuracy}%</span>
                    {activePoint.incorrectChars > 0 && (
                      <span className="text-rose-400 font-bold">
                        {activePoint.incorrectChars} err
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cool Leaderboard Banner (Replaces the raw status text) */}
        <motion.div variants={itemVariants} className="mb-8">
          <div
            onClick={currentUser ? onViewLeaderboard : onOpenAuth}
            className="group cursor-pointer w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 flex items-center justify-between gap-4 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  {currentUser ? (
                    <>
                      <span>Session recorded to Leaderboard!</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 uppercase font-extrabold tracking-wider">
                        Live
                      </span>
                    </>
                  ) : (
                    <span>Compete on the Global Leaderboard</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  {currentUser
                    ? "Click to see where your WPM ranks against top typists worldwide."
                    : "Sign in to secure your spot and climb the global rankings!"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
              <span>{currentUser ? "View Leaderboard" : "Sign In"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons Footer */}
        <motion.div
          variants={itemVariants}
          className="pt-4 border-t border-[var(--chrome-border)] flex flex-wrap items-center justify-between gap-4 relative z-10"
        >
          {/* View Leaderboard Action */}
          <button
            onClick={onViewLeaderboard}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-[var(--foreground)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] hover:border-[var(--foreground)]/30 transition-all duration-200 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          {/* Start Next Session CTA */}
          <button
            onClick={onRestart}
            className={cn(
              "group flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-extrabold tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer",
              isPerfect
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 hover:shadow-amber-500/30"
                : "bg-[var(--foreground)] text-[var(--background)] hover:shadow-xl"
            )}
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90" />
            <span>Start Next Session</span>
            <span className="opacity-60 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
