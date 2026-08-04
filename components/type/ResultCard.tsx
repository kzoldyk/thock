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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-[740px] mx-auto px-2 sm:px-4 my-2"
    >
      {/* Main Compact Result Card Container */}
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Top Bar: Mode & Badges */}
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-[var(--chrome-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-[var(--foreground)] inline-flex items-center gap-1.5">
              {getRankTitle(stats.wpm)}
            </span>
            {isPb && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> New PB
              </span>
            )}
            {isPerfect && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                100% Accuracy
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-[var(--muted)] px-2 py-0.5 rounded bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
            {typingMode === "time" ? `${timeLimit || 30}s` : typingMode}
          </span>
        </div>

        {/* Hero WPM + Compact Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-center">
          {/* Main Score Box */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[var(--foreground)]" /> WPM
            </div>
            <div className="text-[3.6rem] leading-none font-bold tracking-tight text-[var(--foreground)] my-1">
              <AnimatedNumber value={stats.wpm} />
            </div>
            <div className="text-[11px] font-medium text-[var(--muted)]">Net Typing Speed</div>
          </div>

          {/* Compact 6-item Grid */}
          <div className="md:col-span-7 grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <BarChart2 className="w-3 h-3" /> Raw
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.raw} />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Target className="w-3 h-3" /> Acc
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.accuracy} />%
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Activity className="w-3 h-3" /> Con
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.consistency} />%
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <AlertCircle className="w-3 h-3 text-rose-400" /> Errors
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.mistakes} />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Flame className="w-3 h-3 text-amber-400" /> Streak
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                <AnimatedNumber value={stats.streak} />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3" /> Time
              </div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                {(stats.elapsedMs / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        </div>

        {/* Compact Interactive Performance Pace Graph */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] relative">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <span>Performance Chart</span>
              <span className="text-[10px] font-normal text-[var(--muted)]">(hover points)</span>
            </div>

            {/* Flat Series Toggles */}
            <div className="flex items-center gap-1 bg-[var(--chrome-surface-strong)] p-0.5 rounded-md border border-[var(--chrome-border)]">
              <button
                onClick={() => setActiveSeries("both")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                  activeSeries === "both"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Both
              </button>
              <button
                onClick={() => setActiveSeries("net")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                  activeSeries === "net"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Net
              </button>
              <button
                onClick={() => setActiveSeries("raw")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                  activeSeries === "raw"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                Raw
              </button>
            </div>
          </div>

          {/* Graph Render Area */}
          <div className="relative w-full h-[130px] sm:h-[150px]">
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{maxVal}</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{Math.round(maxVal / 2)}</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>0</span>
              </div>
            </div>

            {/* SVG Lines */}
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
              {/* Raw WPM Line */}
              {(activeSeries === "both" || activeSeries === "raw") && chartPoints.rawPath && (
                <path
                  d={chartPoints.rawPath}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.6"
                />
              )}

              {/* Net WPM Solid Line */}
              {(activeSeries === "both" || activeSeries === "net") && chartPoints.netPath && (
                <path
                  d={chartPoints.netPath}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Active Hover Crosshair */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1="0"
                    x2={activePoint.x}
                    y2="100"
                    stroke="var(--foreground)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.4"
                    vectorEffect="non-scaling-stroke"
                  />
                  {(activeSeries === "both" || activeSeries === "net") && (
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.netY}
                      r="3.5"
                      className="fill-[var(--foreground)] stroke-[var(--background)]"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {(activeSeries === "both" || activeSeries === "raw") && (
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.rawY}
                      r="2.5"
                      className="fill-[var(--muted)] stroke-[var(--background)]"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* Hover Tooltip */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-2"
                style={{
                  left: `${activePoint.x}%`,
                  top: `${Math.min(activePoint.netY, activePoint.rawY)}%`,
                }}
              >
                <div className="bg-[var(--chrome-surface-strong)] text-[var(--foreground)] text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-lg border border-[var(--chrome-border)] whitespace-nowrap flex flex-col gap-0.5">
                  <div className="text-[9px] text-[var(--muted)] uppercase font-mono">
                    Time: {activePoint.time}s
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">WPM: {activePoint.liveWpm}</span>
                    <span className="text-[var(--muted)]">Raw: {activePoint.rawWpm}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clean Flat Leaderboard Banner Callout */}
        <div
          onClick={currentUser ? onViewLeaderboard : onOpenAuth}
          className="cursor-pointer w-full p-3 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] hover:border-[var(--foreground)]/30 transition-colors flex items-center justify-between gap-3 mb-5"
        >
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-[var(--foreground)] shrink-0" />
            <div className="text-xs font-medium text-[var(--foreground)]">
              {currentUser
                ? "Score submitted to Leaderboard. Click to inspect rankings."
                : "Sign in to save scores and compete on the global leaderboard."}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
        </div>

        {/* Solid Action Buttons (No AI Slop Gradients) */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--chrome-border)] pt-4">
          <button
            onClick={onViewLeaderboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[var(--foreground)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] transition-colors cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Next Session</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
