"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  fontClass: string
}

type FeedbackType = "bug" | "feature" | "appreciation" | "other"

export function FeedbackModal({ isOpen, onClose, isDarkMode, fontClass }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("bug")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isMocked, setIsMocked] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus("loading")
    setErrorMessage("")

    try {
      // Collect metadata
      const metadata = {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        language: typeof navigator !== "undefined" ? navigator.language : "Unknown",
        screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "Unknown",
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, email, message, metadata }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.")
      }

      setIsMocked(!!data.mocked)
      setStatus("success")
      
      // Reset form fields
      setName("")
      setEmail("")
      setMessage("")
      setType("bug")
    } catch (err) {
      const error = err as Error
      console.error("[feedback-submit] error:", error)
      setErrorMessage(error.message || "Failed to submit feedback.")
      setStatus("error")
    }
  }

  const handleClose = () => {
    if (status !== "loading") {
      onClose()
      // Reset status when modal closes
      setTimeout(() => {
        setStatus("idle")
        setErrorMessage("")
        setIsMocked(false)
      }, 300)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 backdrop-blur-xl",
              isDarkMode ? "bg-zinc-950/60" : "bg-zinc-950/20"
            )}
            onClick={handleClose}
          />

          {/* Centered Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={cn(
              "glass-panel w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[28px] p-6 sm:p-8 z-50 relative flex flex-col scrollbar-thin select-none",
              fontClass
            )}
            style={{
              background: "var(--chrome-surface-strong)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/8">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">Support</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">Share your feedback</h2>
                <p className="text-[11px] text-[var(--muted)] max-w-[34ch]">We&apos;d love to hear how to make thock. even better.</p>
              </div>
              <button
                disabled={status === "loading"}
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-white/10 dark:border-white/10 bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            {/* Content States */}
            <div className="py-6 flex-1">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] flex items-center justify-center text-2xl shadow-sm mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent" />
                    <span className="relative z-10 text-[var(--accent)]">🎉</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Feedback Sent!</h3>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-[28ch] leading-relaxed">
                    Thank you for your response. It has been successfully routed to our inbox.
                  </p>
                  {isMocked && (
                    <div className="mt-4 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-medium">
                      SMTP settings missing. Connected to terminal instead
                    </div>
                  )}
                  <button
                    onClick={handleClose}
                    className="mt-6 px-5 py-2 text-xs font-semibold rounded-full bg-[var(--accent)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">
                      Feedback Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FeedbackType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                    >
                      <option value="bug" className="bg-zinc-950 text-zinc-50">🐛 Report a Bug</option>
                      <option value="feature" className="bg-zinc-950 text-zinc-50">✨ Feature Recommendation</option>
                      <option value="appreciation" className="bg-zinc-950 text-zinc-50">💖 Appreciation</option>
                      <option value="other" className="bg-zinc-950 text-zinc-50">💬 Other</option>
                    </select>
                  </div>

                  {/* Name and Email side-by-side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">
                        Name <span className="text-[10px] text-[var(--muted)]/50 tracking-normal capitalize">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={status === "loading"}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:outline-none focus:border-[var(--accent)] hover:bg-[var(--chrome-surface)] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">
                        Email <span className="text-[10px] text-[var(--muted)]/50 tracking-normal capitalize">(optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === "loading"}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:outline-none focus:border-[var(--accent)] hover:bg-[var(--chrome-surface)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">
                        Message <span className="text-[var(--accent)]">*</span>
                      </label>
                      <span className="text-[9px] font-mono text-[var(--muted)]">
                        {message.length}/1000
                      </span>
                    </div>
                    <textarea
                      required
                      maxLength={1000}
                      rows={4}
                      placeholder={
                        type === "bug"
                          ? "What went wrong? Tell us how to reproduce the bug..."
                          : type === "feature"
                          ? "What feature would you like to see? Describe its behavior..."
                          : type === "appreciation"
                          ? "Let us know what you love about thock.!"
                          : "Any thoughts, questions, or general feedback..."
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={status === "loading"}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:outline-none focus:border-[var(--accent)] hover:bg-[var(--chrome-surface)] transition-all resize-none min-h-[100px]"
                    />
                  </div>

                  {/* Error display */}
                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-semibold leading-relaxed"
                    >
                      ⚠️ {errorMessage}
                    </motion.div>
                  )}

                  {/* Footer / Action buttons */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={status === "loading"}
                      className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all cursor-pointer disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={status === "loading" || !message.trim()}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[var(--accent)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {status === "loading" ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
