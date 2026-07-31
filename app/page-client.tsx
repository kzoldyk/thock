"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { KeyboardScene, type KeyboardHandle } from "@/components/keyboard/KeyboardScene"
import { Keyboard2D } from "@/components/keyboard/Keyboard2D"
import { StatsBar } from "@/components/type/StatsBar"
import { QuickBar } from "@/components/type/QuickBar"
import { WordsDisplay } from "@/components/type/Words"
import { ResultCard } from "@/components/type/ResultCard"
import { useTypingSession, DEV_QUOTES } from "@/hooks/useTypingSession"
import { useAppStore } from "@/stores/useAppStore"
import { audioEngine } from "@/engines/audioEngine"
import { appThemes } from "@/lib/themes"
import { keyboardThemes } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { BackgroundParticles } from "@/components/ui/BackgroundParticles"
import { getFontClass } from "@/lib/fonts"
import type { FontFamily } from "@/types"
import { FeedbackModal } from "@/components/ui/FeedbackModal"
import { AuthModal } from "@/components/ui/AuthModal"
import { LeaderboardView } from "@/components/ui/LeaderboardView"

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex p-0.5 bg-[var(--chrome-surface-soft)] rounded-xl border border-[var(--chrome-border)]">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer select-none",
            value === opt.id
              ? "bg-[var(--accent)] text-[var(--background)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SettingsPanel({ fontClass, currentUser }: { isDarkMode: boolean; fontClass: string; currentUser: { id: string; username: string } | null }) {
  const {
    settingsOpen, setSettingsOpen,
    layoutId, setLayoutId,
    keyboardThemeId, setKeyboardThemeId,
    appThemeId, setAppThemeId,
    volume, setVolume,
    keyVolume, setKeyVolume,
    switchPackId, setSwitchPackId,
    stereoWidth, setStereoWidth,
    reverb, setReverb,
    pitch, setPitch,
    reducedMotion, setReducedMotion,
    fontFamily, setFontFamily,
    typingMode, setTypingMode,
    timeLimit, setTimeLimit,
    complexWords, setComplexWords,
    showKeyboard, setShowKeyboard,
    soundEnabled, setSoundEnabled,
    keyboardType, setKeyboardType,
    flowMode,
    dampenerId, setDampenerId,
  } = useAppStore()

  const store = useAppStore()

  const [initialSnapshot, setInitialSnapshot] = useState<any>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Capture snapshot when modal opens
  useEffect(() => {
    if (settingsOpen) {
      setInitialSnapshot({
        layoutId, keyboardThemeId, appThemeId, switchPackId, volume, keyVolume,
        reducedMotion, stereoWidth, reverb, pitch, fontFamily, typingMode,
        timeLimit, complexWords, showKeyboard, soundEnabled, keyboardType,
        flowMode, dampenerId
      })
      setShowSavePrompt(false)
    }
  }, [settingsOpen])

  const handleCloseRequest = () => {
    if (!initialSnapshot) {
      setSettingsOpen(false)
      return
    }

    const currentSnapshot = {
      layoutId, keyboardThemeId, appThemeId, switchPackId, volume, keyVolume,
      reducedMotion, stereoWidth, reverb, pitch, fontFamily, typingMode,
      timeLimit, complexWords, showKeyboard, soundEnabled, keyboardType,
      flowMode, dampenerId
    }

    const hasChanges = JSON.stringify(initialSnapshot) !== JSON.stringify(currentSnapshot)
    
    // Only prompt if there are changes AND the user is logged in
    if (hasChanges && currentUser) {
      setShowSavePrompt(true)
    } else {
      setSettingsOpen(false)
    }
  }

  const handleSaveAndClose = async () => {
    if (!currentUser) return
    setIsSaving(true)
    try {
      const currentPrefs = {
        layoutId, keyboardThemeId, appThemeId, switchPackId, volume, keyVolume,
        reducedMotion, stereoWidth, reverb, pitch, fontFamily, typingMode,
        timeLimit, complexWords, showKeyboard, soundEnabled, keyboardType,
        flowMode, dampenerId
      }
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: currentPrefs }),
      })
    } catch (err) {
      console.error("Failed to save preferences", err)
    } finally {
      setIsSaving(false)
      setSettingsOpen(false)
    }
  }

  const handleDiscardAndClose = () => {
    if (initialSnapshot) {
      store.loadPreferences(initialSnapshot)
    }
    setSettingsOpen(false)
  }

  const theme = appThemes.find((t) => t.id === appThemeId) || appThemes[0]

  return (
    <AnimatePresence>
      {settingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-xl"
            style={{
              backgroundColor: theme.background + "a0",
            }}
            onClick={handleCloseRequest}
          />

          {/* Centered Floating Glass Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={cn(
              "glass-panel w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-[28px] p-6 sm:p-8 z-10 relative flex flex-col scrollbar-thin",
              fontClass,
            )}
            style={{
              background: "var(--chrome-surface-strong)",
            }}
          >
            {showSavePrompt ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--chrome-surface-strong)] rounded-[28px] p-6 backdrop-blur-md">
                <div className="text-center max-w-sm">
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Unsaved Changes</h3>
                  <p className="text-sm text-[var(--muted)] mb-6">
                    You have unsaved changes to your workspace settings. Would you like to save them to your account?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleSaveAndClose}
                      disabled={isSaving}
                      className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                    <button 
                      onClick={handleDiscardAndClose}
                      disabled={isSaving}
                      className="w-full py-2.5 rounded-xl bg-[var(--chrome-surface-soft)] text-[var(--foreground)] border border-[var(--chrome-border)] font-medium text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Don't Save
                    </button>
                    <button 
                      onClick={() => setShowSavePrompt(false)}
                      disabled={isSaving}
                      className="w-full py-2 text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pb-4 border-b border-[var(--chrome-border)]">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">Preferences</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">Workspace styling</h2>
                <p className="text-[11px] text-[var(--muted)] max-w-[34ch]">Tune the keyboard, typography, and ambient chrome so the whole interface feels aligned.</p>
              </div>
              <button
                onClick={handleCloseRequest}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Section title="Interface Theme">
                  <select
                    value={appThemeId}
                    onChange={(e) => setAppThemeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                  >
                    {appThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="bg-[var(--background)] text-[var(--foreground)]">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Keyboard Finish">
                  <select
                    value={keyboardThemeId}
                    onChange={(e) => setKeyboardThemeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                  >
                    {keyboardThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="bg-[var(--background)] text-[var(--foreground)]">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Typography Family">
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                  >
                    <option value="inter" className="bg-[var(--background)] text-[var(--foreground)]">Inter</option>
                    <option value="geist" className="bg-[var(--background)] text-[var(--foreground)]">Geist</option>
                    <option value="sf-pro" className="bg-[var(--background)] text-[var(--foreground)]">SF Pro</option>
                    <option value="jetbrains-mono" className="bg-[var(--background)] text-[var(--foreground)]">JetBrains Mono</option>
                    <option value="ibm-plex-mono" className="bg-[var(--background)] text-[var(--foreground)]">IBM Plex Mono</option>
                    <option value="source-code-pro" className="bg-[var(--background)] text-[var(--foreground)]">Source Code Pro</option>
                  </select>
                </Section>

                <Section title="Keyboard Layout">
                  <SegmentedControl
                    options={[
                      { id: "60", label: "60%" },
                      { id: "75", label: "75%" },
                    ]}
                    value={layoutId}
                    onChange={setLayoutId}
                  />
                </Section>

                <Section title="Typing Focus Mode">
                  <SegmentedControl
                    options={[
                      { id: "time", label: "Time" },
                      { id: "words", label: "Words" },
                      { id: "quotes", label: "Quotes" },
                      { id: "code", label: "Code" },
                    ]}
                    value={typingMode}
                    onChange={setTypingMode}
                  />
                </Section>

                {typingMode === "time" && (
                  <Section title="Time Limit">
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                    >
                      {[15, 30, 60, 120].map((t) => (
                        <option key={t} value={t} className="bg-[var(--background)] text-[var(--foreground)]">
                          {t} seconds
                        </option>
                      ))}
                    </select>
                  </Section>
                )}

                {(typingMode === "time" || typingMode === "words") && (
                  <Section title="Text Difficulty">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs font-semibold cursor-pointer select-none">
                      <span className="text-[var(--muted)]">Complex (Caps & Symbols)</span>
                      <input
                        type="checkbox"
                        checked={complexWords}
                        onChange={(e) => setComplexWords(e.target.checked)}
                        className="rounded accent-[var(--accent)] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </Section>
                )}

                <Section title="Switch Sounds Pack">
                  <select
                    value={switchPackId}
                    onChange={(e) => setSwitchPackId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                  >
                    <option value="default" className="bg-[var(--background)] text-[var(--foreground)]">Cherry Blue Switches</option>
                  </select>
                </Section>

                <Section title="Acoustic Dampener">
                  <select
                    value={dampenerId}
                    onChange={(e) => setDampenerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors cursor-pointer"
                  >
                    <option value="none" className="bg-[var(--background)] text-[var(--foreground)]">None (Pure Clack)</option>
                    <option value="tape" className="bg-[var(--background)] text-[var(--foreground)]">Tape Mod (Creamy Mids)</option>
                    <option value="foam" className="bg-[var(--background)] text-[var(--foreground)]">Foam Mod (Deep Thock)</option>
                    <option value="gasket" className="bg-[var(--background)] text-[var(--foreground)]">Gasket Mount (Soft Cushioned)</option>
                  </select>
                </Section>

                <Section title="Keyboard Visualizer">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs font-semibold cursor-pointer select-none">
                    <span className="text-[var(--muted)]">Show Layout</span>
                    <input
                      type="checkbox"
                      checked={showKeyboard}
                      onChange={(e) => setShowKeyboard(e.target.checked)}
                      className="rounded accent-[var(--accent)] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </Section>

                <Section title="Visualizer Mode">
                  <SegmentedControl
                    options={[
                      { id: "2d", label: "2D Flat" },
                      { id: "3d", label: "3D Model" },
                    ]}
                    value={keyboardType}
                    onChange={setKeyboardType}
                  />
                </Section>

                <Section title="Keypress Sound">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs font-semibold cursor-pointer select-none">
                    <span className="text-[var(--muted)]">Sound Output</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="rounded accent-[var(--accent)] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </Section>
              </div>

              <div className="border-t border-[var(--muted)]/10 pt-5 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">Acoustic nodes tuning</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <Section title="Master Volume">
                    <Slider value={volume} onChange={setVolume} />
                  </Section>

                  <Section title="Key Stroke Gain">
                    <Slider value={keyVolume} onChange={setKeyVolume} />
                  </Section>

                  <Section title="Stereo Pan Width">
                    <Slider value={stereoWidth} onChange={setStereoWidth} min={0} max={1} />
                  </Section>

                  <Section title="Environment Reverb">
                    <Slider value={reverb} onChange={setReverb} min={0} max={1} />
                  </Section>

                  <Section title="Switch Core Pitch">
                    <Slider value={pitch} onChange={setPitch} min={0.5} max={1.5} step={0.05} />
                  </Section>

                  <Section title="Ambient Particles">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs font-semibold cursor-pointer select-none">
                      <span className="text-[var(--muted)]">Animate Background</span>
                      <input
                        type="checkbox"
                        checked={!reducedMotion}
                        onChange={(e) => setReducedMotion(!e.target.checked)}
                        className="rounded accent-[var(--accent)] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </Section>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] opacity-90">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-3 w-full bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] rounded-xl px-3 py-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[var(--accent)] h-1 cursor-pointer bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none"
      />
      <span className="text-[10px] font-bold tabular-nums text-[var(--muted)] w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

function AsciiExplosion({ id, x, y, onComplete }: { id: string, x: number, y: number, onComplete: (id: string) => void }) {
  const [particles, setParticles] = useState<{ dx: number; dy: number; char: string; scale: number; rotate: number; duration: number }[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const chars = ["*", "#", "@", "+", "%", "!", "&", "$", "?", "~", "█", "▄", "▀"];
      const list = Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 80 + Math.random() * 120;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const char = chars[Math.floor(Math.random() * chars.length)];
        const scale = 1 + Math.random() * 1.5;
        const rotate = (Math.random() - 0.5) * 180;
        const duration = 0.7 + Math.random() * 0.5;
        return { dx, dy, char, scale, rotate, duration };
      });
      setParticles(list);
    }, 0);

    const completeTimer = setTimeout(() => onComplete(id), 1200);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [id, onComplete]);

  return (
    <div 
      className="fixed pointer-events-none z-[5]"
      style={{ left: `${x}vw`, top: `${y}vh` }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ 
            x: p.dx, 
            y: p.dy, 
            opacity: 0, 
            scale: p.scale,
            rotate: p.rotate 
          }}
          transition={{ duration: p.duration, ease: "easeOut" }}
          className="absolute left-0 top-0 text-[var(--accent)] font-mono text-xl font-bold opacity-60"
          style={{ textShadow: "0 0 15px var(--accent)" }}
        >
          {p.char}
        </motion.div>
      ))}
    </div>
  );
}

function AsciiExplosionsOverlay() {
  const explosions = useAppStore(s => s.explosions);
  const removeExplosion = useAppStore(s => s.removeExplosion);

  return (
    <>
      {explosions.map(e => (
        <AsciiExplosion key={e.id} id={e.id} x={e.x} y={e.y} onComplete={removeExplosion} />
      ))}
    </>
  );
}

export default function Home() {
  const keyboardRef = useRef<KeyboardHandle>(null)
  const [activeTab, setActiveTab] = useState("Practice")
  const [windowFocused, setWindowFocused] = useState(true)
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const [uniqueVisitorCount, setUniqueVisitorCount] = useState<number | null>(null)
  const [mobileQuoteIdx, setMobileQuoteIdx] = useState(0)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [forceMobileTyping, setForceMobileTyping] = useState(false)

  useEffect(() => {
    const handleHardwareKey = (e: KeyboardEvent) => {
      if (e.key && e.key.length === 1 && !forceMobileTyping) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
        setForceMobileTyping(true)
      }
    }
    window.addEventListener("keydown", handleHardwareKey)
    return () => window.removeEventListener("keydown", handleHardwareKey)
  }, [forceMobileTyping])

  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Try existing session first
        const meRes = await fetch("/api/auth/me")
        const meData = await meRes.json()
        if (meData && meData.user) {
          setCurrentUser(meData.user)
          return
        }

        // 2. No active session — silently create/restore guest user from device fingerprint
        let deviceId = localStorage.getItem("thock_device_id")
        if (!deviceId) {
          deviceId = crypto.randomUUID()
          localStorage.setItem("thock_device_id", deviceId)
        }

        const guestRes = await fetch("/api/auth/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        })
        if (guestRes.ok) {
          const guestData = await guestRes.json()
          if (guestData && guestData.user) {
            setCurrentUser(guestData.user)
          }
        }
      } catch (err) {
        console.error("Error initializing user session:", err)
      }
    }

    initSession()
  }, [])

  // Sync preferences from/to cloud on login/registration
  useEffect(() => {
    if (!currentUser) return

    let active = true
    const syncPreferences = async () => {
      try {
        const res = await fetch("/api/preferences")
        if (!res.ok) return
        const data = await res.json()

        if (active && data.preferences) {
          // Hydrate local store with cloud settings
          useAppStore.getState().loadPreferences(data.preferences)
        } else if (active) {
          // Upload current local preferences to cloud
          const state = useAppStore.getState()
          const currentPrefs = {
            layoutId: state.layoutId,
            keyboardThemeId: state.keyboardThemeId,
            appThemeId: state.appThemeId,
            switchPackId: state.switchPackId,
            volume: state.volume,
            keyVolume: state.keyVolume,
            reducedMotion: state.reducedMotion,
            stereoWidth: state.stereoWidth,
            reverb: state.reverb,
            pitch: state.pitch,
            fontFamily: state.fontFamily,
            typingMode: state.typingMode,
            timeLimit: state.timeLimit,
            complexWords: state.complexWords,
            showKeyboard: state.showKeyboard,
            soundEnabled: state.soundEnabled,
            keyboardType: state.keyboardType,
            flowMode: state.flowMode,
            dampenerId: state.dampenerId,
          }

          await fetch("/api/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preferences: currentPrefs }),
          })
        }
      } catch (err) {
        console.error("Preferences sync failed:", err)
      }
    }

    syncPreferences()
    return () => {
      active = false
    }
  }, [currentUser])

  const mobileQuote = DEV_QUOTES[mobileQuoteIdx] || DEV_QUOTES[0]
  const cycleMobileQuote = () => {
    setMobileQuoteIdx((prev) => (prev + 1) % DEV_QUOTES.length)
  }

  const appThemeId = useAppStore((s) => s.appThemeId)
  const layoutId = useAppStore((s) => s.layoutId)
  const keyboardThemeId = useAppStore((s) => s.keyboardThemeId)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const setAppThemeId = useAppStore((s) => s.setAppThemeId)
  const showKeyboard = useAppStore((s) => s.showKeyboard)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const setShowKeyboard = useAppStore((s) => s.setShowKeyboard)
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled)
  const keyboardType = useAppStore((s) => s.keyboardType)
  const flowMode = useAppStore((s) => s.flowMode)
  const activeEffect = useAppStore((s) => s.activeEffect)
  const delightMessage = useAppStore((s) => s.delightMessage)

  const theme = appThemes.find((t) => t.id === appThemeId) || appThemes[0]
  const fontFamily = useAppStore((s) => s.fontFamily)
  const fontClass = getFontClass(fontFamily)

  useEffect(() => {
    const handleFocus = () => setWindowFocused(true)
    const handleBlur = () => setWindowFocused(false)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)
    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  const {
    words,
    stats,
    sessionState,
    currentWordIndex,
    currentCharIndex,
    restart,
    activeKeys,
    getHistory,
  } = useTypingSession(keyboardRef, layoutId, !windowFocused || activeTab !== "Practice")

  const volume = useAppStore((s) => s.volume)
  const reverb = useAppStore((s) => s.reverb)

  useEffect(() => {
    let disposed = false
    audioEngine.init().then(() => {
      if (disposed) return
      audioEngine.setVolume(useAppStore.getState().volume)
      audioEngine.setReverb(useAppStore.getState().reverb)
      audioEngine.loadPack("default")
    })
    return () => {
      disposed = true
      audioEngine.dispose()
    }
  }, [])

  useEffect(() => {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    
    let deviceId = localStorage.getItem("thock_device_id")
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem("thock_device_id", deviceId)
    }

    fetch(`/api/visits?local=${isLocal}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId })
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.count === "number") {
          setVisitorCount(data.count)
        }
        if (data && typeof data.uniqueCount === "number") {
          setUniqueVisitorCount(data.uniqueCount)
        }
      })
      .catch(err => console.warn("[counter] failed to fetch visitor count:", err))
  }, [])

  useEffect(() => {
    audioEngine.setVolume(volume)
  }, [volume])

  useEffect(() => {
    audioEngine.setReverb(reverb)
  }, [reverb])

  useEffect(() => {
    const root = document.documentElement
    const isDarkTheme = theme.mode === "dark"
    root.classList.toggle("dark", isDarkTheme)
    root.dataset.theme = theme.id
    root.style.colorScheme = isDarkTheme ? "dark" : "light"
  }, [theme.id, theme.mode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setSettingsOpen(!useAppStore.getState().settingsOpen)
      }
    }
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (
        !target.closest("button") &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        !target.closest("select") &&
        !target.closest("a") &&
        !target.isContentEditable
      ) {
        if (typeof document !== "undefined" && document.activeElement) {
          (document.activeElement as HTMLElement).blur()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("click", handleDocumentClick)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("click", handleDocumentClick)
    }
  }, [setSettingsOpen])

  const toggleDarkMode = () => {
    if (theme.mode === "dark") {
      setAppThemeId("keeby-light")
    } else {
      setAppThemeId("dark")
    }
  }

  const isDark = theme.mode === "dark"

  const getWpmTint = (wpm: number, isDark: boolean) => {
    if (wpm < 20) return "rgba(0,0,0,0)";
    if (wpm < 30) return isDark ? "rgba(56, 189, 248, 0.05)" : "rgba(56, 189, 248, 0.1)"; // Focus Blue
    if (wpm < 40) return isDark ? "rgba(74, 222, 128, 0.05)" : "rgba(74, 222, 128, 0.1)"; // Flow Green
    if (wpm < 50) return isDark ? "rgba(250, 204, 21, 0.06)" : "rgba(250, 204, 21, 0.15)"; // Energy Yellow
    if (wpm < 60) return isDark ? "rgba(249, 115, 22, 0.07)" : "rgba(249, 115, 22, 0.15)"; // Intense Orange
    return isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.15)"; // Adrenaline Red
  };

  const wpmTint = getWpmTint(stats.liveWpm, isDark);

  return (
    <main
      className={cn(
        "flex flex-col flex-1 min-h-[100dvh] overflow-hidden relative transition-colors duration-500 bg-[var(--background)] text-[var(--foreground)] flow-transition",
        fontClass,
        activeEffect,
        activeEffect === "golden-shimmer" && "animate-golden-shimmer"
      )}
      style={
        {
          "--background": theme.background,
          "--foreground": theme.foreground,
          "--muted": theme.muted,
          "--accent": theme.accent,
          "--accent-rgb": theme.accentRgb,
          "--chrome-surface": theme.mode === "dark"
            ? "rgba(14, 14, 18, 0.76)"
            : "rgba(255, 255, 255, 0.78)",
          "--chrome-surface-strong": theme.mode === "dark"
            ? "rgba(20, 20, 24, 0.92)"
            : "rgba(255, 255, 255, 0.9)",
          "--chrome-surface-soft": theme.mode === "dark"
            ? "rgba(24, 24, 28, 0.58)"
            : "rgba(255, 255, 255, 0.56)",
          "--chrome-border": theme.mode === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(17, 17, 17, 0.08)",
          "--chrome-shadow": theme.mode === "dark"
            ? "0 28px 80px rgba(0, 0, 0, 0.4)"
            : "0 24px 60px rgba(17, 17, 17, 0.08)",
          "--chrome-shadow-hover": theme.mode === "dark"
            ? "0 32px 100px rgba(0, 0, 0, 0.5)"
            : "0 28px 80px rgba(17, 17, 17, 0.12)",
        } as React.CSSProperties
      }
    >
      {/* Dynamic Psychological WPM Tint */}
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 z-[0]"
        style={{ backgroundColor: wpmTint }}
        suppressHydrationWarning
      />

      {/* Drift particles behind content */}
      <BackgroundParticles />
      
      {/* ASCII Explosion Overlay */}
      <AsciiExplosionsOverlay />

      {/* VisionOS ambient highlights */}
      <div className="absolute top-[-15%] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-[var(--accent)]/3 to-transparent rounded-full blur-[130px] pointer-events-none z-[0] opacity-80" />
      <div className="absolute bottom-[-15%] left-[25%] right-[25%] h-[35%] bg-gradient-to-t from-[var(--accent)]/3 to-transparent rounded-full blur-[110px] pointer-events-none z-[0] opacity-70" />

      {/* Main Layout Container */}
      <div className={cn(forceMobileTyping ? "flex" : "hidden md:flex", "flex-col flex-1 justify-between relative z-10")}>
        {/* Header Navigation */}
        <header className={cn(
          "flex items-center justify-between px-8 py-4 relative z-10 select-none flow-transition",
          (flowMode || sessionState === "typing") && "flow-fade-out"
        )}>
          {/* Left: Minimal Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <Image
              src="/logo-v2.png"
              alt="thock logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="font-bold tracking-tight text-lg text-[var(--foreground)]">thock<span className="text-[var(--accent)]">.</span></span>
          </div>

          {/* Center: Premium Nav Items */}
          <nav className="hidden sm:flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-sm">
            {["Practice", "Challenges", "Leaderboard", "Statistics"].map((tab) => {
              const isPractice = tab === "Practice"
              const isLeaderboard = tab === "Leaderboard"
              const isEnabled = isPractice || isLeaderboard
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  disabled={!isEnabled}
                  onClick={() => isEnabled && setActiveTab(tab)}
                  className={cn(
                    "relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5",
                    !isEnabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-[var(--foreground)] text-[var(--background)] rounded-full -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={cn(
                    isActive ? "text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}>
                    {tab}
                  </span>
                  {!isEnabled && (
                    <span className="text-[7.5px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[var(--muted)] uppercase tracking-widest scale-[0.85] font-bold">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right: profile + settings + toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
              title={soundEnabled ? "Mute Key Sounds" : "Unmute Key Sounds"}
              aria-label={soundEnabled ? "Mute Key Sounds" : "Unmute Key Sounds"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>

            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
              title={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
              aria-label={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
            >
              ⌨️
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? "🔆" : "🌙"}
            </button>
            
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 border border-[var(--chrome-border)] cursor-pointer button-lift"
            >
              Feedback
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 border border-[var(--chrome-border)] cursor-pointer button-lift ml-1"
            >
              Settings
            </button>

            {/* Profile Avatar / Authentication Trigger */}
            {currentUser ? (
              <div className="flex items-center gap-2 group relative">
                <div className="w-8 h-8 rounded-full border border-[var(--chrome-border)] flex items-center justify-center text-[10px] font-bold bg-gradient-to-tr from-zinc-200 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 text-[var(--foreground)] shadow-sm select-none cursor-default">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/auth/logout", { method: "POST" })
                    if (res.ok) {
                      setCurrentUser(null)
                    }
                  }}
                  className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1 button-lift"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 border border-[var(--chrome-border)] cursor-pointer button-lift ml-1"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main content grid */}
        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          {activeTab === "Practice" ? (
            <>
              {/* Quick Mode & Timer Toolbar */}
              {sessionState !== "finished" && (
                <div className={cn("flex justify-center pt-2 pb-1 flow-transition z-20", (flowMode || sessionState === "typing") && "flow-fade-out")}>
                  <QuickBar />
                </div>
              )}

              {/* Stats bar */}
              {sessionState !== "finished" && (
                <div className={cn("flex justify-center flow-transition", (flowMode || sessionState === "typing") && "flow-fade-out")}>
                  <StatsBar stats={stats} sessionState={sessionState} />
                </div>
              )}

              {/* Typing Paragraph Focus Box */}
              <div className="flex-1 flex flex-col justify-center min-h-[160px]">
                {sessionState === "finished" ? (
                  <div className="flex justify-center px-8">
                    <ResultCard stats={stats} onRestart={restart} history={getHistory()} currentUser={currentUser} onOpenAuth={() => setAuthOpen(true)} />
                  </div>
                ) : (
                  <WordsDisplay
                    words={words}
                    currentWordIndex={currentWordIndex}
                    currentCharIndex={currentCharIndex}
                    sessionState={sessionState}
                  />
                )}
              </div>

              {/* Keyboard Display Section */}
              {showKeyboard && sessionState !== "finished" && (
                <div className="relative px-8 pb-3 max-w-[1000px] w-full mx-auto flex flex-col items-center">
                  {keyboardType === "2d" ? (
                    <Keyboard2D
                      layoutId={layoutId}
                      themeId={keyboardThemeId}
                      activeKeys={activeKeys}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="w-full flex justify-center"
                    >
                      <KeyboardScene
                        ref={keyboardRef}
                        layoutId={layoutId}
                        themeId={keyboardThemeId}
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </>
          ) : activeTab === "Leaderboard" ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <LeaderboardView
                currentUser={currentUser}
                onOpenAuth={() => setAuthOpen(true)}
                fontClass={fontClass}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] flex items-center justify-center text-2xl shadow-sm mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent" />
                  <span className="relative z-10 opacity-80">
                    {activeTab === "Challenges" ? "🏆" : activeTab === "Statistics" ? "📈" : "✨"}
                  </span>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{activeTab}</h2>
                <p className="text-[13px] text-[var(--muted)] max-w-[28ch] mx-auto mt-2 leading-relaxed">
                  This experience is still being crafted. Check back in a future update.
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer hint details */}
        {activeTab === "Practice" && (
          <footer className={cn(
            "text-center pb-4 text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase select-none relative z-10 opacity-75 flow-transition",
            (flowMode || sessionState === "typing") && "flow-fade-out"
          )}>
            <div>
              Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] font-mono text-[9px]">Tab</kbd> to restart · Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] font-mono text-[9px]">Esc</kbd> for settings
            </div>
            {visitorCount !== null && (
              <div className="mt-4 flex items-center justify-center gap-2 select-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-normal normal-case border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] text-[var(--foreground)] opacity-90 transition-all duration-300 hover:scale-[1.03] hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] group cursor-default">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                  </span>
                  <span>
                    Visited by <span className="font-bold text-[var(--accent)]">{visitorCount.toLocaleString()}</span> times {uniqueVisitorCount !== null && <span className="text-[var(--muted)] opacity-80">({uniqueVisitorCount.toLocaleString()} unique devices)</span>}
                  </span>
                </span>
              </div>
            )}
          </footer>
        )}
      </div>

      {/* Mobile Layout (Visible only on mobile when not forcing typing mode) */}
      <div className={cn(forceMobileTyping ? "hidden" : "hidden max-md:flex", "flex-col flex-1 justify-between p-6 sm:p-8 relative z-10 text-center min-h-[calc(100dvh-20px)]")}>
        {/* Top: Logo & Theme Toggle */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-default select-none">
            <Image
              src="/logo-v2.png"
              alt="thock logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <span className="font-bold tracking-tight text-base text-[var(--foreground)]">
              thock<span className="text-[var(--accent)]">.</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-full bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
            >
              Feedback
            </button>
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? "🔆" : "🌙"}
            </button>
          </div>
        </div>

        {/* Middle content: Card for Laptop Nerds */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full my-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-14 h-14 rounded-2xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] flex items-center justify-center text-2xl shadow-sm mb-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent animate-pulse" />
            <span className="relative z-10">💻</span>
          </motion.div>
          
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-xl font-bold tracking-tight text-[var(--foreground)]"
          >
            Designed for Laptop Nerds
          </motion.h2>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[12px] text-[var(--muted)] mt-2 mb-4 max-w-[28ch] leading-relaxed"
          >
            thock. is a physical keyboard playground with real-time audio synthesis. Open on a laptop or connect a Bluetooth keyboard to type.
          </motion.p>

          <button
            onClick={() => setForceMobileTyping(true)}
            className="mb-8 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer button-lift"
          >
            ⌨️ Start Hardware Typing
          </button>

          {/* Interactive Quote Card */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={cycleMobileQuote}
            className="glass-panel w-full p-6 rounded-[24px] border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] relative overflow-hidden cursor-pointer select-none group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:border-[var(--accent)]/20 shadow-md"
          >
            <div className="absolute top-3 right-4 text-[9px] text-[var(--muted)] opacity-60 flex items-center gap-1 font-bold uppercase tracking-wider">
              <span>nerd quote</span>
              <span className="animate-pulse">✨</span>
            </div>
            
            <p className="text-sm font-semibold italic text-[var(--foreground)] leading-relaxed mt-4 text-left pr-4">
              &ldquo;{mobileQuote}&rdquo;
            </p>
            
            <div className="mt-6 flex justify-between items-center text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">
              <span className="group-hover:text-[var(--foreground)] transition-colors duration-200">Tap to refresh</span>
              <span className="text-[var(--accent)] group-hover:translate-x-0.5 transition-transform duration-200">Next →</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom footer hint */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-[9px] font-bold text-[var(--muted)] tracking-wider uppercase opacity-75 pb-2"
        >
          designed for physical keyboards
        </motion.footer>
      </div>

      {/* Floating Delight Banner */}
      <AnimatePresence>
        {delightMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl glass-panel text-xs font-bold text-[var(--accent)] tracking-wide shadow-lg z-30 flex items-center gap-1.5"
            style={{
              borderColor: "rgba(var(--accent-rgb), 0.15)",
              background: "var(--chrome-surface-strong)"
            }}
          >
            <span className="animate-bounce">✨</span> {delightMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsPanel isDarkMode={isDark} fontClass={fontClass} currentUser={currentUser} />
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} isDarkMode={isDark} fontClass={fontClass} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} fontClass={fontClass} onSuccess={(user) => setCurrentUser(user)} />

      {/* Click to Focus Overlay */}
      {sessionState === "typing" && !windowFocused && (
        <div 
          onClick={() => window.focus()}
          className="fixed inset-0 backdrop-blur-md bg-zinc-950/20 z-40 flex items-center justify-center cursor-pointer select-none"
        >
          <div className="glass-panel p-6 rounded-2xl text-center shadow-2xl max-w-xs animate-pulse">
            <span className="text-xl">⚠️</span>
            <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">Session Paused</h3>
            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
              Window focus lost. Click anywhere on this screen to resume typing.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
