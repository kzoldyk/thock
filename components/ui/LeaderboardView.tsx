import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface LeaderboardScore {
  id: string
  user_id: string
  wpm: number
  accuracy: number
  consistency: number
  time_limit: number
  mode: string
  created_at: number
  username: string
}

interface UserBest {
  wpm: number
  accuracy: number
  consistency: number
  rank: number
}

interface LeaderboardViewProps {
  currentUser: { id: string; username: string } | null
  onOpenAuth: () => void
  fontClass: string
}

export function LeaderboardView({ currentUser, onOpenAuth, fontClass }: LeaderboardViewProps) {
  const [timeLimit, setTimeLimit] = useState<number>(30)
  const [mode, setMode] = useState<string>("time")
  const [scores, setScores] = useState<LeaderboardScore[]>([])
  const [userBest, setUserBest] = useState<UserBest | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?timeLimit=${timeLimit}&mode=${mode}`)
      if (res.ok) {
        const data = await res.json()
        setScores(data.scores || [])
        setUserBest(data.userBest || null)
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [timeLimit, mode, currentUser])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">👑 1st</span>
    if (rank === 2) return <span className="text-zinc-400 drop-shadow-[0_0_8px_rgba(161,161,170,0.5)]">🥈 2nd</span>
    if (rank === 3) return <span className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]">🥉 3rd</span>
    return <span className="text-[var(--muted)] font-mono">#{rank}</span>
  }

  return (
    <div className={cn("w-full max-w-[800px] mx-auto px-6 flex flex-col gap-6 select-none", fontClass)}>
      {/* Filters and CTA Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--chrome-border)] pb-5">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Global Leaderboard</h2>
          <p className="text-xs text-[var(--muted)]">Compete with the top mechanical typists across the world.</p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3">
          {/* Time Filter */}
          <div className="flex p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
            {[15, 30, 60].map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                  timeLimit === t
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {t}s
              </button>
            ))}
          </div>

          {/* Mode Filter */}
          <div className="flex p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
            {["time", "words", "quotes"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                  mode === m
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA / PB Summary banner */}
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="anonymous-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Secure Your Stats</h3>
              <p className="text-xs text-[var(--foreground)] opacity-90 leading-relaxed">
                Log in or register to record your high scores, climb the ranks, and save your progress!
              </p>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold bg-amber-500 text-amber-950 uppercase tracking-wider hover:bg-amber-400 active:scale-95 transition-all shadow-md cursor-pointer flex-shrink-0"
            >
              Sign In / Register
            </button>
          </motion.div>
        ) : userBest ? (
          <motion.div
            key="user-pb-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] backdrop-blur-md p-5 grid grid-cols-2 sm:grid-cols-4 items-center gap-4 text-center sm:text-left"
          >
            <div className="flex flex-col gap-1 border-r border-[var(--chrome-border)] last:border-0 sm:border-r pr-2">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Your Rank</span>
              <span className="text-lg font-bold text-[var(--foreground)]">{getRankBadge(userBest.rank)}</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-[var(--chrome-border)] last:border-0 sm:border-r pr-2">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Personal Best</span>
              <span className="text-lg font-bold text-[var(--foreground)]">{userBest.wpm.toFixed(1)} <span className="text-xs font-semibold text-[var(--muted)]">wpm</span></span>
            </div>
            <div className="flex flex-col gap-1 border-r border-[var(--chrome-border)] last:border-0 sm:border-r pr-2">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Accuracy</span>
              <span className="text-lg font-bold text-[var(--foreground)]">{userBest.accuracy.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Consistency</span>
              <span className="text-lg font-bold text-[var(--foreground)]">{userBest.consistency.toFixed(0)}%</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-runs-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] backdrop-blur-md p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest">No runs recorded</h3>
              <p className="text-xs text-[var(--muted)]">
                You haven&apos;t completed any tests in this configuration yet. Finish a typing run to record your score!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Leaderboard Table Container */}
      <div className="rounded-[28px] border border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] backdrop-blur-xl p-4 shadow-2xl relative overflow-hidden flex flex-col min-h-[300px]">
        {loading ? (
          /* Loading State Skeletons */
          <div className="flex-1 flex flex-col justify-between py-6 px-4 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-4 bg-[var(--chrome-border)] rounded" />
                  <div className="w-24 h-4 bg-[var(--chrome-border)] rounded" />
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-12 h-4 bg-[var(--chrome-border)] rounded" />
                  <div className="w-10 h-4 bg-[var(--chrome-border)] rounded" />
                  <div className="w-16 h-4 bg-[var(--chrome-border)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : scores.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] flex items-center justify-center text-2xl shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent" />
              <span className="relative z-10 opacity-80">⌨️</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">No runs recorded yet</h3>
            <p className="text-xs text-[var(--muted)] max-w-[28ch] mx-auto mt-2 leading-relaxed">
              Be the first to claim the top spot! Complete a test with this configuration.
            </p>
          </div>
        ) : (
          /* Table Layout */
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--chrome-border)] text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold">
                  <th className="py-4 px-4 w-16">Rank</th>
                  <th className="py-4 px-4">Typist</th>
                  <th className="py-4 px-4 text-right">WPM</th>
                  <th className="py-4 px-4 text-right">Accuracy</th>
                  <th className="py-4 px-4 text-right">Consistency</th>
                  <th className="py-4 px-4 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => {
                  const isSelf = currentUser && score.user_id === currentUser.id
                  const rank = index + 1

                  return (
                    <tr
                      key={score.id}
                      className={cn(
                        "border-b border-[var(--chrome-border)]/50 last:border-0 text-xs transition-colors hover:bg-black/2 dark:hover:bg-white/2",
                        isSelf && "bg-[var(--foreground)]/3 font-semibold"
                      )}
                    >
                      <td className="py-4 px-4 font-medium">{getRankBadge(rank)}</td>
                      <td className="py-4 px-4 flex items-center gap-2">
                        <span className="text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[200px]">
                          {score.username}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--foreground)] text-[var(--background)] font-bold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[var(--foreground)] font-mono">
                        {score.wpm.toFixed(1)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[var(--foreground)] opacity-90 font-mono">
                        {score.accuracy.toFixed(0)}%
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[var(--foreground)] opacity-90 font-mono">
                        {score.consistency.toFixed(0)}%
                      </td>
                      <td className="py-4 px-4 text-right text-[10px] text-[var(--muted)] hidden sm:table-cell">
                        {formatDate(score.created_at)}
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
