import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { appThemes } from "@/lib/themes"
import { useAppStore } from "@/stores/useAppStore"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  fontClass: string
  onSuccess: (user: { id: string; username: string }) => void
}

export function AuthModal({ isOpen, onClose, fontClass, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const appThemeId = useAppStore((s) => s.appThemeId)
  const theme = appThemes.find((t) => t.id === appThemeId) || appThemes[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setLoading(true)
    setError("")

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check your details.")
      }

      onSuccess(data.user)
      handleClose()
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      // Reset state after close animation completes
      setTimeout(() => {
        setUsername("")
        setPassword("")
        setError("")
        setTab("login")
      }, 300)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-xl"
            style={{
              backgroundColor: theme.background + "a0",
            }}
            onClick={handleClose}
          />

          {/* Centered Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={cn(
              "glass-panel w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[28px] p-6 sm:p-8 z-[101] relative flex flex-col scrollbar-none",
              fontClass
            )}
            style={{
              background: "var(--chrome-surface-strong)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--chrome-border)]">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">Leaderboard</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">
                  {tab === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-[11px] text-[var(--muted)] max-w-[34ch]">
                  {tab === "login"
                    ? "Sign in to record your high scores and view your global rank."
                    : "Register to claim your username and secure your spot on the boards."}
                </p>
              </div>
              <button
                disabled={loading}
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[10px]"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="py-6 flex flex-col gap-5">
              {/* Tab Selector */}
              <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm self-start">
                <button
                  type="button"
                  onClick={() => !loading && setTab("login")}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer",
                    tab === "login"
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                  disabled={loading}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => !loading && setTab("register")}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer",
                    tab === "register"
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                  disabled={loading}
                >
                  Register
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Username Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase pl-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="keyboard_ninja"
                  disabled={loading}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--foreground)] transition-all duration-200"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase pl-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--foreground)] transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className={cn(
                  "w-full py-4 mt-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-[0.98] shadow-md border cursor-pointer",
                  loading
                    ? "bg-[var(--chrome-surface-soft)] text-[var(--muted)] border-[var(--chrome-border)] cursor-not-allowed"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:shadow-lg border-transparent"
                )}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-[var(--muted)]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : tab === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
