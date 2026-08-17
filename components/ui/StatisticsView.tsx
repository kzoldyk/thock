"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap,
  Target,
  Activity,
  Clock,
  Flame,
  Trophy,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  BarChart3,
  Calendar,
} from "lucide-react"
import type { TestRecord } from "@/types"
import {
  getLocalHistory,
  clearLocalHistory,
  mergeTestRecords,
  computeUserStatsSummary,
  formatPracticeTime,
  exportHistoryAsCsv,
  exportHistoryAsJson,
} from "@/lib/user-stats"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { cn } from "@/lib/utils"

interface StatisticsViewProps {
  currentUser: { id: string; username: string } | null
  onOpenAuth: () => void
  fontClass: string
}

export function StatisticsView({ currentUser, onOpenAuth, fontClass }: StatisticsViewProps) {
  const [timeframe, setTimeframe] = useState<"all" | "30d" | "7d" | "today">("all")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const [records, setRecords] = useState<TestRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeSeries, setActiveSeries] = useState<"all" | "net" | "raw" | "accuracy">("all")
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Load records from local storage and backend
  const loadStats = useCallback(async () => {
    setLoading(true)
    const local = getLocalHistory()

    try {
      if (currentUser) {
        const res = await fetch("/api/stats?limit=150")
        if (res.ok) {
          const data = await res.json()
          const remote: TestRecord[] = data.scores || []
          const merged = mergeTestRecords(local, remote)
          setRecords(merged)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.error("[statistics] Failed to fetch remote stats:", err)
    }

    setRecords(local)
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Computed summary based on filters
  const summary = useMemo(() => {
    return computeUserStatsSummary(records, timeframe, modeFilter)
  }, [records, timeframe, modeFilter])

  // Chart data: sort chronological for graphing (earliest to latest)
  const chartData = useMemo(() => {
    const sorted = [...summary.recentTests].reverse()
    if (sorted.length === 0) return []

    // Calculate 5-point moving average for trend line
    return sorted.map((r, i) => {
      const windowStart = Math.max(0, i - 2)
      const windowEnd = Math.min(sorted.length, i + 3)
      const slice = sorted.slice(windowStart, windowEnd)
      const movingAvg = Math.round(slice.reduce((a, b) => a + b.wpm, 0) / slice.length)

      return {
        id: r.id,
        index: i + 1,
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        wpm: r.wpm,
        rawWpm: r.rawWpm || r.wpm,
        accuracy: r.accuracy,
        consistency: r.consistency,
        mode: r.mode,
        timeLimit: r.timeLimit,
        movingAvg,
      }
    })
  }, [summary.recentTests])

  // Max WPM scale for SVG
  const maxChartVal = useMemo(() => {
    if (chartData.length === 0) return 100
    const allVals = chartData.flatMap((d) => [d.wpm, d.rawWpm, d.movingAvg])
    return Math.max(...allVals, 60) + 15
  }, [chartData])

  // SVG Paths
  const chartSvg = useMemo(() => {
    if (chartData.length === 0) {
      return { netPath: "", rawPath: "", movingAvgPath: "", accPath: "", points: [] }
    }

    const width = 100
    const height = 100

    const pts = chartData.map((d, i) => {
      const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2
      const netY = height - (d.wpm / maxChartVal) * height
      const rawY = height - (d.rawWpm / maxChartVal) * height
      const movingAvgY = height - (d.movingAvg / maxChartVal) * height
      const accY = height - (d.accuracy / 100) * height
      return { x, netY, rawY, movingAvgY, accY, ...d }
    })

    const netPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.netY.toFixed(2)}`).join(" ")
    const rawPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.rawY.toFixed(2)}`).join(" ")
    const movingAvgPath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.movingAvgY.toFixed(2)}`)
      .join(" ")
    const accPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.accY.toFixed(2)}`).join(" ")

    return { netPath, rawPath, movingAvgPath, accPath, points: pts }
  }, [chartData, maxChartVal])

  // Crosshair move handler
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || chartSvg.points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const relativeX = (mouseX / rect.width) * 100

    let closestIdx = 0
    let minDiff = Infinity
    chartSvg.points.forEach((pt, i) => {
      const diff = Math.abs(pt.x - relativeX)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    })

    setHoveredPointIdx(closestIdx)
  }

  const activePoint = hoveredPointIdx !== null ? chartSvg.points[hoveredPointIdx] : null

  // Export handlers
  const handleExportCsv = () => {
    const csv = exportHistoryAsCsv(records)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `thock-statistics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportNotice("Exported CSV successfully")
    setTimeout(() => setExportNotice(null), 3000)
  }

  const handleExportJson = () => {
    const json = exportHistoryAsJson(records)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `thock-statistics-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportNotice("Exported JSON successfully")
    setTimeout(() => setExportNotice(null), 3000)
  }

  const handleClearHistory = () => {
    clearLocalHistory()
    setRecords([])
    setShowClearConfirm(false)
  }

  return (
    <div className={cn("w-full max-w-[960px] mx-auto px-3 sm:px-6 py-4 flex flex-col gap-6 select-none", fontClass)}>
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--chrome-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Typing Analytics</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-[var(--muted)]">
              {summary.totalTests} Runs Logged
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Actionable speed progression, precision baseline, and rhythm stability metrics.
          </p>
        </div>

        {/* Toolbar: Timeframe + Mode filter + Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Filter */}
          <div className="flex p-0.5 bg-[var(--chrome-surface-soft)] rounded-xl border border-[var(--chrome-border)]">
            {(
              [
                { id: "all", label: "All Time" },
                { id: "30d", label: "30 Days" },
                { id: "7d", label: "7 Days" },
                { id: "today", label: "Today" },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer",
                  timeframe === tf.id
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Mode Filter */}
          <div className="flex p-0.5 bg-[var(--chrome-surface-soft)] rounded-xl border border-[var(--chrome-border)]">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-[10.5px] font-semibold text-[var(--foreground)] px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[var(--background)]">All Modes</option>
              <option value="time-15" className="bg-[var(--background)]">15s Time</option>
              <option value="time-30" className="bg-[var(--background)]">30s Time</option>
              <option value="time-60" className="bg-[var(--background)]">60s Time</option>
              <option value="words" className="bg-[var(--background)]">Words</option>
              <option value="quotes" className="bg-[var(--background)]">Quotes</option>
              <option value="code" className="bg-[var(--background)]">Code</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              title="Export as CSV"
              className="p-1.5 rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface-strong)] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={loadStats}
              title="Refresh Stats"
              className="p-1.5 rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface-strong)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {records.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear Local History"
                className="p-1.5 rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Notice Banner */}
      <AnimatePresence>
        {exportNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {exportNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Clear Local Statistics?</h3>
            <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
              This will remove all locally stored test history. Scores already synced to your online profile remain preserved.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Cloud-Sync Banner (if guest/unauthenticated) */}
      {!currentUser && (
        <div
          onClick={onOpenAuth}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-base shrink-0">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Sync Stats to Cloud Account
              </div>
              <div className="text-xs text-[var(--foreground)] opacity-85">
                Sign in to back up all your test runs permanently across devices and compete on leaderboards.
              </div>
            </div>
          </div>
          <button className="px-4 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500 text-amber-950 uppercase tracking-wider hover:bg-amber-400 cursor-pointer shrink-0">
            Sign In / Register
          </button>
        </div>
      )}

      {/* KPI 6-Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Avg WPM */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Avg Speed
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              <AnimatedNumber value={summary.avgWpm} /> <span className="text-xs font-normal text-[var(--muted)]">wpm</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            Raw: {summary.avgRawWpm} wpm
          </div>
        </div>

        {/* Best WPM */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Peak Speed
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              <AnimatedNumber value={summary.bestWpm} /> <span className="text-xs font-normal text-[var(--muted)]">wpm</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            Peak Raw: {summary.bestRawWpm} wpm
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> Accuracy
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              <AnimatedNumber value={summary.avgAccuracy} />%
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            {summary.highAccuracyRatio}% tests ≥98%
          </div>
        </div>

        {/* Consistency */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-sky-400" /> Consistency
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              <AnimatedNumber value={summary.avgConsistency} />%
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            Rhythm stability index
          </div>
        </div>

        {/* Practice Time */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Time Typed
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold tracking-tight text-[var(--foreground)] truncate">
              {formatPracticeTime(summary.totalTimeSeconds)}
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            {summary.totalWords.toLocaleString()} words
          </div>
        </div>

        {/* Daily Streak */}
        <div className="p-3.5 rounded-xl bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Daily Streak
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              <AnimatedNumber value={summary.currentDailyStreak} /> <span className="text-xs font-normal text-[var(--muted)]">days</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium">
            {summary.testsToday} tests today
          </div>
        </div>
      </div>

      {/* Interactive Progression & Velocity Timeline Chart */}
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Speed & Accuracy Progression</h3>
              <span className="text-[10px] text-[var(--muted)] font-mono">(Last {chartData.length} Tests)</span>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Hover over data points to inspect individual run dynamics.
            </p>
          </div>

          {/* Series Toggles */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] self-start sm:self-auto">
            <button
              onClick={() => setActiveSeries("all")}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer",
                activeSeries === "all"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveSeries("net")}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer",
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
                "px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer",
                activeSeries === "raw"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              Raw WPM
            </button>
            <button
              onClick={() => setActiveSeries("accuracy")}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer",
                activeSeries === "accuracy"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              Accuracy
            </button>
          </div>
        </div>

        {/* Graph Canvas */}
        {chartData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--chrome-border)] rounded-xl">
            <Activity className="w-6 h-6 text-[var(--muted)] mb-2 opacity-50" />
            <div className="text-xs font-semibold text-[var(--foreground)]">No tests recorded yet</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">Complete a typing session to plot your progression timeline.</div>
          </div>
        ) : (
          <div className="relative w-full h-[180px] sm:h-[220px]">
            {/* Background dashed grids */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{maxChartVal} wpm</span>
                <span>100%</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>{Math.round(maxChartVal / 2)} wpm</span>
                <span>50%</span>
              </div>
              <div className="border-b border-dashed border-[var(--foreground)] w-full flex justify-between text-[9px] text-[var(--muted)]">
                <span>0 wpm</span>
                <span>0%</span>
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
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredPointIdx(null)}
            >
              {/* Raw WPM Dashed Line */}
              {(activeSeries === "all" || activeSeries === "raw") && chartSvg.rawPath && (
                <path
                  d={chartSvg.rawPath}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.5"
                />
              )}

              {/* Accuracy Cyan Line */}
              {(activeSeries === "all" || activeSeries === "accuracy") && chartSvg.accPath && (
                <path
                  d={chartSvg.accPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.75"
                />
              )}

              {/* Moving Average Amber Trend Line */}
              {(activeSeries === "all" || activeSeries === "net") && chartSvg.movingAvgPath && chartData.length >= 4 && (
                <path
                  d={chartSvg.movingAvgPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.85"
                />
              )}

              {/* Net WPM Solid Line */}
              {(activeSeries === "all" || activeSeries === "net") && chartSvg.netPath && (
                <path
                  d={chartSvg.netPath}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Crosshair indicator */}
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
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.netY}
                    r="4"
                    className="fill-[var(--foreground)] stroke-[var(--background)]"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-3"
                style={{
                  left: `${activePoint.x}%`,
                  top: `${Math.min(activePoint.netY, 80)}%`,
                }}
              >
                <div className="bg-[var(--chrome-surface-strong)] text-[var(--foreground)] text-[11px] font-medium px-3 py-2 rounded-lg shadow-xl border border-[var(--chrome-border)] whitespace-nowrap flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-[9.5px] text-[var(--muted)] font-mono border-b border-[var(--chrome-border)] pb-1">
                    <span>{activePoint.date}</span>
                    <span className="capitalize">
                      {activePoint.mode === "time" ? `${activePoint.timeLimit}s` : activePoint.mode}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] pt-0.5">
                    <div>
                      Net: <span className="font-bold text-[var(--foreground)]">{activePoint.wpm} wpm</span>
                    </div>
                    <div>
                      Raw: <span className="text-[var(--muted)]">{activePoint.rawWpm} wpm</span>
                    </div>
                    <div>
                      Acc: <span className="text-emerald-400 font-bold">{activePoint.accuracy}%</span>
                    </div>
                    <div>
                      Con: <span className="text-sky-400 font-bold">{activePoint.consistency}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10.5px] text-[var(--muted)] border-t border-[var(--chrome-border)] pt-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[var(--foreground)] rounded-full" />
              <span>Net Speed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 border-b border-dashed border-[var(--muted)]" />
              <span>Raw Speed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#f59e0b] rounded-full" />
              <span>Moving Trend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#38bdf8] rounded-full" />
              <span>Accuracy %</span>
            </div>
          </div>
        )}
      </div>

      {/* Speed Distribution Histogram + Diagnostic Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Speed Distribution Histogram (7 cols) */}
        <div className="md:col-span-6 rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[var(--foreground)]" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">Speed Distribution</h3>
              </div>
              <span className="text-[10px] text-[var(--muted)]">Bell curve by tier</span>
            </div>

            {/* Histogram Bars */}
            <div className="space-y-2 my-2">
              {summary.speedBuckets.map((bucket) => {
                const isUserPeak =
                  summary.bestWpm >= bucket.min &&
                  (bucket.max === 999 ? summary.bestWpm >= bucket.min : summary.bestWpm <= bucket.max)

                return (
                  <div key={bucket.label} className="flex items-center gap-3 text-xs">
                    <div className="w-14 font-mono text-[10.5px] text-[var(--muted)] shrink-0 flex items-center gap-1">
                      {bucket.label}
                      {isUserPeak && <span className="text-[9px] text-amber-400">★</span>}
                    </div>

                    <div className="flex-1 h-5 rounded-md bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bucket.percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-md transition-colors",
                          bucket.count > 0 ? "bg-[var(--foreground)] opacity-85" : "bg-transparent"
                        )}
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono font-semibold text-[var(--foreground)]/80">
                        {bucket.count > 0 ? `${bucket.count} (${bucket.percentage}%)` : "0"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-[10.5px] text-[var(--muted)] mt-3 pt-2.5 border-t border-[var(--chrome-border)] flex items-center justify-between">
            <span>Median Speed Tier: <strong className="text-[var(--foreground)]">{summary.avgWpm} WPM</strong></span>
            {summary.speedImprovementRate !== 0 && (
              <span className={cn("font-semibold", summary.speedImprovementRate > 0 ? "text-emerald-400" : "text-amber-400")}>
                {summary.speedImprovementRate > 0 ? `+${summary.speedImprovementRate}%` : `${summary.speedImprovementRate}%`} baseline growth
              </span>
            )}
          </div>
        </div>

        {/* Diagnostic Insights Coach (6 cols) */}
        <div className="md:col-span-6 rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">Diagnostic Insights</h3>
              </div>
              <span className="text-[10px] text-[var(--muted)]">Calculated from your runs</span>
            </div>

            <div className="space-y-2.5 my-2">
              {summary.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-xs",
                    insight.type === "positive"
                      ? "bg-emerald-500/5 border-emerald-500/20 text-[var(--foreground)]"
                      : insight.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/20 text-[var(--foreground)]"
                      : "bg-[var(--chrome-surface-soft)] border-[var(--chrome-border)] text-[var(--foreground)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      {insight.type === "positive" && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                      {insight.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {insight.type === "tip" && <Target className="w-3.5 h-3.5 text-sky-400" />}
                      {insight.title}
                    </span>
                    {insight.metric && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)]">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[var(--muted)] leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10.5px] text-[var(--muted)] mt-3 pt-2.5 border-t border-[var(--chrome-border)] flex items-center justify-between">
            <span>Accuracy Ratio: <strong className="text-[var(--foreground)]">{summary.highAccuracyRatio}% @ ≥98%</strong></span>
            <span>Total Errors: <strong className="text-rose-400">{summary.totalMistakes}</strong></span>
          </div>
        </div>
      </div>

      {/* Mode Comparison Benchmark Grid */}
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Mode-by-Mode Benchmarks</h3>
            <p className="text-[11px] text-[var(--muted)]">Side-by-side performance across durations and content modes.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summary.modeBreakdowns.map((m) => (
            <div
              key={m.mode}
              className="p-3 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--foreground)]">{m.label}</span>
                <span className="text-[9px] font-mono text-[var(--muted)] px-1.5 py-0.5 rounded bg-[var(--chrome-surface-strong)]">
                  {m.testsCount}x
                </span>
              </div>

              <div className="space-y-1 my-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[10px] text-[var(--muted)]">Best:</span>
                  <span className="font-bold text-[var(--foreground)] font-mono">{m.bestWpm > 0 ? `${m.bestWpm} wpm` : "-"}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[10px] text-[var(--muted)]">Avg:</span>
                  <span className="font-semibold text-[var(--foreground)] font-mono">{m.avgWpm > 0 ? `${m.avgWpm} wpm` : "-"}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[10px] text-[var(--muted)]">Acc:</span>
                  <span className="font-medium text-emerald-400 font-mono">{m.avgAccuracy > 0 ? `${m.avgAccuracy}%` : "-"}</span>
                </div>
              </div>

              <div className="text-[9.5px] text-[var(--muted)] pt-2 border-t border-[var(--chrome-border)] truncate">
                {m.totalTimeSeconds > 0 ? formatPracticeTime(m.totalTimeSeconds) : "0s"} typed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Historical Test Run Log Table */}
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Test Runs</h3>
            <p className="text-[11px] text-[var(--muted)]">Individual chronological test records.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1 rounded-lg text-[10.5px] font-semibold bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] hover:bg-[var(--chrome-surface)] text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1 rounded-lg text-[10.5px] font-semibold bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] hover:bg-[var(--chrome-surface)] text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> JSON
            </button>
          </div>
        </div>

        {summary.recentTests.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--muted)]">
            No test records match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--chrome-border)] text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right">Net WPM</th>
                  <th className="py-3 px-3 text-right">Raw WPM</th>
                  <th className="py-3 px-3 text-right">Accuracy</th>
                  <th className="py-3 px-3 text-right">Consistency</th>
                  <th className="py-3 px-3 text-right">Mistakes</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTests.map((test) => {
                  const isTop = test.wpm === summary.bestWpm && test.wpm > 0

                  return (
                    <tr
                      key={test.id}
                      className="border-b border-[var(--chrome-border)]/40 last:border-0 text-xs hover:bg-[var(--chrome-surface-soft)]/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-[11px] text-[var(--muted)] font-mono whitespace-nowrap">
                        {new Date(test.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] uppercase tracking-wider">
                          {test.mode === "time" ? `${test.timeLimit}s` : test.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[var(--foreground)]">
                        <span className="inline-flex items-center gap-1">
                          {test.wpm}
                          {isTop && <span className="text-[10px] text-amber-400">★</span>}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[var(--muted)]">
                        {test.rawWpm || test.wpm}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                        {test.accuracy}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sky-400 font-medium">
                        {test.consistency}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">
                        {test.mistakes}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
