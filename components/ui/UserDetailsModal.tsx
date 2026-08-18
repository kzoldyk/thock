"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Trophy,
  Zap,
  Target,
  Activity,
  Flame,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Shield,
  RotateCcw,
  BarChart3,
  Calendar,
} from "lucide-react"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { cn } from "@/lib/utils"

interface UserDevice {
  deviceId: string
  visitCount: number
  lastVisitedAt: number
  createdAt: number
  ipAddress: string
  userAgent: string
  os: string
  browser: string
  deviceType: string
  country: string
}

interface UserScore {
  id: string
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  mistakes: number
  totalTyped: number
  elapsedMs: number
  timeLimit: number
  mode: string
  createdAt: number
}

interface LetterGripDetail {
  char: string
  totalTyped: number
  correctCount: number
  errorCount: number
  totalLatencyMs: number
  avgLatencyMs: number
  accuracy: number
  gripScore: number
  updatedAt: number
}

interface UserDetailData {
  user: {
    id: string
    username: string
    isGuest: boolean
    createdAt: number
  }
  activity: {
    totalVisits: number
    lastVisitedAt: number
    isOnline: boolean
    primaryIp: string
    country: string
    os: string
    browser: string
    deviceType: string
    userAgent: string
    devices: UserDevice[]
  }
  statsSummary: {
    totalTests: number
    maxWpm: number
    avgWpm: number
    avgAccuracy: number
    avgConsistency: number
    totalPracticeTimeMs: number
    totalMistakes: number
    totalTypedChars: number
  }
  scores: UserScore[]
  gripProfile: {
    letters: Record<string, LetterGripDetail>
    strengths: string[]
    weaknesses: string[]
    neutral: string[]
    totalCharactersTyped: number
    overallAccuracy: number
  }
}

interface Props {
  userId: string
  onClose: () => void
  analyticsPassword: string
}

// Helper to format country flag
const getFlagEmoji = (countryCode: string) => {
  const codePoints = (countryCode || "US")
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  try {
    return String.fromCodePoint(...codePoints)
  } catch {
    return "🌐"
  }
}

// Format duration
const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return `${hours}h ${remainingMins}m`
}

export function UserDetailsModal({ userId, onClose, analyticsPassword }: Props) {
  const [data, setData] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "letters" | "devices">("overview")

  useEffect(() => {
    let isMounted = true
    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/analytics/user?userId=${encodeURIComponent(userId)}`, {
          headers: {
            "x-analytics-password": analyticsPassword,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to load user details: ${res.statusText}`)
        }

        const json = await res.json()
        if (isMounted) {
          setData(json)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load user details")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserDetails()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      isMounted = false
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [userId, analyticsPassword, onClose])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-4xl max-h-[90vh] bg-[var(--chrome-surface-strong)] border border-[var(--chrome-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[var(--foreground)]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--chrome-border)]/60 flex items-center justify-between gap-4 bg-[var(--chrome-surface-soft)]">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--chrome-border)] animate-pulse" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-[var(--chrome-border)] rounded animate-pulse" />
                  <div className="w-20 h-3 bg-[var(--chrome-border)] rounded animate-pulse" />
                </div>
              </div>
            ) : data ? (
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <UserAvatar username={data.user.username} size="lg" />
                  {data.activity.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--background)] ring-1 ring-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg sm:text-xl truncate tracking-tight">
                      {data.user.username}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        data.user.isGuest
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      }`}
                    >
                      {data.user.isGuest ? "Guest" : "Member"}
                    </span>
                    {data.activity.isOnline && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online Now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-2 truncate">
                    <span>ID: {data.user.id}</span>
                    <span>•</span>
                    <span>Joined {new Date(data.user.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-rose-500">Failed to load user</div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-6 pt-3 border-b border-[var(--chrome-border)]/40 bg-[var(--chrome-surface-soft)]/50 gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                activeTab === "overview"
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--chrome-surface-strong)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              Typing & Performance
            </button>

            <button
              onClick={() => setActiveTab("letters")}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                activeTab === "letters"
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--chrome-surface-strong)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Letter Grip Mastery
              {data && data.gripProfile.weaknesses.length > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-400 font-black rounded-full border border-rose-500/30">
                  {data.gripProfile.weaknesses.length} weak
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("devices")}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                activeTab === "devices"
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--chrome-surface-strong)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Network & Devices ({data?.activity.devices.length || 0})
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {loading && (
              <div className="py-16 text-center text-[var(--muted)] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Fetching comprehensive user mastery records...</p>
              </div>
            )}

            {error && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-center">
                <p className="font-bold mb-1">Error Loading Profile</p>
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            )}

            {!loading && data && (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Performance Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" /> Max WPM
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-[var(--accent)] mt-1 font-mono">
                          {data.statsSummary.maxWpm}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Zap className="w-3 h-3 text-cyan-400" /> Avg WPM
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1 font-mono">
                          {data.statsSummary.avgWpm}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" /> Accuracy
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
                          {data.statsSummary.avgAccuracy}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-purple-400" /> Consistency
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1 font-mono">
                          {data.statsSummary.avgConsistency}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" /> Tests Logged
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1 font-mono">
                          {data.statsSummary.totalTests}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)]/60 flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" /> Practice Time
                        </span>
                        <span className="text-sm font-bold text-[var(--foreground)] mt-2 font-mono truncate">
                          {formatDuration(data.statsSummary.totalPracticeTimeMs)}
                        </span>
                      </div>
                    </div>

                    {/* Recent Scores Table */}
                    <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[var(--chrome-border)]/60 flex justify-between items-center">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Test History ({data.scores.length} Runs)
                        </h4>
                        <span className="text-[10px] text-[var(--muted)] font-mono">
                          Total Characters: {data.statsSummary.totalTypedChars.toLocaleString()}
                        </span>
                      </div>

                      {data.scores.length === 0 ? (
                        <div className="py-10 text-center text-xs text-[var(--muted)]">
                          No typing test records found for this user.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[var(--chrome-border)]/40 text-[var(--muted)] font-semibold text-[10px] uppercase">
                                <th className="py-2.5 px-4">WPM</th>
                                <th className="py-2.5 px-4">Raw</th>
                                <th className="py-2.5 px-4">Accuracy</th>
                                <th className="py-2.5 px-4">Consistency</th>
                                <th className="py-2.5 px-4">Mistakes</th>
                                <th className="py-2.5 px-4">Mode</th>
                                <th className="py-2.5 px-4 text-right">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--chrome-border)]/20 font-mono">
                              {data.scores.map((s) => (
                                <tr key={s.id} className="hover:bg-[var(--chrome-surface)] transition-colors">
                                  <td className="py-2.5 px-4 font-black text-[var(--accent)]">{s.wpm}</td>
                                  <td className="py-2.5 px-4 text-[var(--muted)]">{s.rawWpm}</td>
                                  <td className="py-2.5 px-4 text-emerald-400 font-semibold">{s.accuracy}%</td>
                                  <td className="py-2.5 px-4 text-[var(--foreground)]">{s.consistency}%</td>
                                  <td className="py-2.5 px-4 text-rose-400">{s.mistakes}</td>
                                  <td className="py-2.5 px-4 uppercase text-[10px] font-sans font-semibold">
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--chrome-surface)] border border-[var(--chrome-border)]">
                                      {s.mode} {s.timeLimit}s
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-[10px] text-[var(--muted)] font-sans">
                                    {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. LETTER GRIP MASTERY TAB */}
                {activeTab === "letters" && (
                  <div className="space-y-6">
                    {/* Strengths & Weaknesses Banners */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-sm text-emerald-400">User Strengths (High Accuracy & Speed)</h4>
                        </div>
                        <p className="text-xs text-emerald-300/80 mb-3">
                          Characters with $\ge 90\%$ accuracy and clean rhythm. 90% of practice words use these letters.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.gripProfile.strengths.length === 0 ? (
                            <span className="text-xs text-[var(--muted)] italic">No established strengths yet</span>
                          ) : (
                            data.gripProfile.strengths.map((ch) => {
                              const stat = data.gripProfile.letters[ch]
                              return (
                                <div
                                  key={ch}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 font-mono text-xs font-black text-emerald-300 shadow-sm"
                                >
                                  <span className="uppercase text-sm">{ch}</span>
                                  <span className="text-[10px] text-emerald-400/90 font-normal">
                                    {stat ? `${stat.accuracy}%` : ""}
                                  </span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <h4 className="font-bold text-sm text-rose-400">Training Targets (Weaknesses & Error Spots)</h4>
                        </div>
                        <p className="text-xs text-rose-300/80 mb-3">
                          Characters with frequent typos or high hesitation latency. The 10% adaptive drill words target these.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.gripProfile.weaknesses.length === 0 ? (
                            <span className="text-xs text-[var(--muted)] italic">No critical weaknesses detected</span>
                          ) : (
                            data.gripProfile.weaknesses.map((ch) => {
                              const stat = data.gripProfile.letters[ch]
                              return (
                                <div
                                  key={ch}
                                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 font-mono text-xs font-black text-rose-300 shadow-sm"
                                >
                                  <span className="uppercase text-sm">{ch}</span>
                                  <span className="text-[10px] text-rose-400/90 font-normal">
                                    {stat ? `${stat.errorCount} err` : ""}
                                  </span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Complete Letter Breakdown Table */}
                    <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[var(--chrome-border)]/60 flex justify-between items-center">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                          <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Alphabet Grip Breakdown (26 Letters)
                        </h4>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          Overall Letter Accuracy: {data.gripProfile.overallAccuracy}%
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--chrome-border)]/40 text-[var(--muted)] font-semibold text-[10px] uppercase">
                              <th className="py-2.5 px-4">Letter</th>
                              <th className="py-2.5 px-4">Grip Score</th>
                              <th className="py-2.5 px-4">Accuracy</th>
                              <th className="py-2.5 px-4">Avg Latency</th>
                              <th className="py-2.5 px-4">Typed</th>
                              <th className="py-2.5 px-4 text-right">Errors</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--chrome-border)]/20 font-mono">
                            {Object.values(data.gripProfile.letters)
                              .sort((a, b) => a.gripScore - b.gripScore)
                              .map((item) => {
                                const isWeak = data.gripProfile.weaknesses.includes(item.char)
                                const isStrong = data.gripProfile.strengths.includes(item.char)
                                return (
                                  <tr
                                    key={item.char}
                                    className={cn(
                                      "hover:bg-[var(--chrome-surface)] transition-colors",
                                      isWeak && "bg-rose-500/5",
                                      isStrong && "bg-emerald-500/5"
                                    )}
                                  >
                                    <td className="py-2.5 px-4 font-black uppercase text-sm flex items-center gap-2">
                                      <span>{item.char}</span>
                                      {isWeak && (
                                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">
                                          Weak
                                        </span>
                                      )}
                                      {isStrong && (
                                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                          Strong
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-[var(--chrome-surface)] h-2 rounded-full overflow-hidden border border-[var(--chrome-border)]">
                                          <div
                                            className={cn(
                                              "h-full rounded-full",
                                              item.gripScore >= 85
                                                ? "bg-emerald-500"
                                                : item.gripScore >= 70
                                                ? "bg-amber-500"
                                                : "bg-rose-500"
                                            )}
                                            style={{ width: `${item.gripScore}%` }}
                                          />
                                        </div>
                                        <span className="font-bold">{item.gripScore}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span
                                        className={cn(
                                          "font-semibold",
                                          item.accuracy >= 95
                                            ? "text-emerald-400"
                                            : item.accuracy >= 80
                                            ? "text-amber-400"
                                            : "text-rose-400"
                                        )}
                                      >
                                        {item.accuracy}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-[var(--muted)]">{item.avgLatencyMs} ms</td>
                                    <td className="py-2.5 px-4 text-[var(--foreground)]">{item.totalTyped}</td>
                                    <td className="py-2.5 px-4 text-right">
                                      <span className={item.errorCount > 0 ? "text-rose-400 font-bold" : "text-[var(--muted)]"}>
                                        {item.errorCount}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HARDWARE & DEVICES TAB */}
                {activeTab === "devices" && (
                  <div className="space-y-6">
                    {/* Primary Network Info */}
                    <div className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                          Primary IP Address
                        </span>
                        <span className="font-mono font-bold text-[var(--accent)] text-sm">
                          {data.activity.primaryIp}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                          Country / Region
                        </span>
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <span className="text-base leading-none">{getFlagEmoji(data.activity.country)}</span>
                          {data.activity.country}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                          Total Visits Logged
                        </span>
                        <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                          {data.activity.totalVisits} visits
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                          Operating System & Browser
                        </span>
                        <span className="font-semibold text-xs text-[var(--foreground)]">
                          {data.activity.browser} on {data.activity.os}
                        </span>
                      </div>
                    </div>

                    {/* Devices List Table */}
                    <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[var(--chrome-border)]/60">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Known Connected Hardware & Devices ({data.activity.devices.length})
                        </h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--chrome-border)]/40 text-[var(--muted)] font-semibold text-[10px] uppercase">
                              <th className="py-2.5 px-4">Device ID</th>
                              <th className="py-2.5 px-4">Type</th>
                              <th className="py-2.5 px-4">IP Address</th>
                              <th className="py-2.5 px-4">OS / Browser</th>
                              <th className="py-2.5 px-4">Visits</th>
                              <th className="py-2.5 px-4 text-right">Last Active</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--chrome-border)]/20 font-mono">
                            {data.activity.devices.map((d) => (
                              <tr key={d.deviceId} className="hover:bg-[var(--chrome-surface)] transition-colors">
                                <td className="py-2.5 px-4 text-[var(--muted)] truncate max-w-[140px]" title={d.deviceId}>
                                  {d.deviceId}
                                </td>
                                <td className="py-2.5 px-4 capitalize font-sans">
                                  <span className="inline-flex items-center gap-1 bg-[var(--chrome-surface)] border border-[var(--chrome-border)] px-1.5 py-0.5 rounded text-[10px]">
                                    {d.deviceType === "mobile" ? (
                                      <Smartphone className="w-3 h-3 text-[var(--muted)]" />
                                    ) : d.deviceType === "tablet" ? (
                                      <Tablet className="w-3 h-3 text-[var(--muted)]" />
                                    ) : (
                                      <Monitor className="w-3 h-3 text-[var(--muted)]" />
                                    )}
                                    {d.deviceType}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-[var(--accent)]">{d.ipAddress}</td>
                                <td className="py-2.5 px-4 font-sans text-[11px]">
                                  {d.browser} / {d.os}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-[var(--foreground)]">{d.visitCount}</td>
                                <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--muted)]">
                                  {new Date(d.lastVisitedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* User Agent */}
                    <div className="p-4 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs">
                      <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                        Latest Client User-Agent Header
                      </span>
                      <p className="font-mono text-[11px] text-[var(--foreground)] bg-[var(--chrome-surface)] p-2.5 rounded-xl border border-[var(--chrome-border)] break-all">
                        {data.activity.userAgent}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
