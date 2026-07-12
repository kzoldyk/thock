"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { KeyboardScene, type KeyboardHandle } from "@/components/keyboard/KeyboardScene"
import { Keyboard2D } from "@/components/keyboard/Keyboard2D"
import { StatsBar } from "@/components/type/StatsBar"
import { WordsDisplay } from "@/components/type/Words"
import { ResultCard } from "@/components/type/ResultCard"
import { useTypingSession } from "@/hooks/useTypingSession"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useAppStore } from "@/stores/useAppStore"
import { audioEngine } from "@/engines/audioEngine"
import { appThemes } from "@/lib/themes"
import { keyboardThemes } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { BackgroundParticles } from "@/components/ui/BackgroundParticles"

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
    <div className="flex p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
            value === opt.id
              ? "bg-[var(--accent)] text-[var(--background)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SettingsPanel() {
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
    showKeyboard, setShowKeyboard,
    soundEnabled, setSoundEnabled,
    keyboardType, setKeyboardType,
  } = useAppStore()

  return (
    <AnimatePresence>
      {settingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 dark:bg-black/50 backdrop-blur-md"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Centered Floating Glass Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="glass-panel w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl p-6 sm:p-8 z-10 shadow-2xl relative flex flex-col scrollbar-thin"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--muted)]/10">
              <div className="flex flex-col">
                <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Preferences</h2>
                <p className="text-[10px] text-[var(--muted)]">Adjust the workspace, visuals, and mechanical sound nodes.</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    {appThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="dark:bg-zinc-950 dark:text-zinc-50">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Keyboard Finish">
                  <select
                    value={keyboardThemeId}
                    onChange={(e) => setKeyboardThemeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    {keyboardThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="dark:bg-zinc-950 dark:text-zinc-50">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Typography Family">
                  <SegmentedControl
                    options={[
                      { id: "inter", label: "Inter" },
                      { id: "geist", label: "Geist" },
                      { id: "sf-pro", label: "SF Pro" },
                    ]}
                    value={fontFamily}
                    onChange={setFontFamily}
                  />
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
                    ]}
                    value={typingMode}
                    onChange={setTypingMode}
                  />
                </Section>

                <Section title="Switch Sounds Pack">
                  <select
                    value={switchPackId}
                    onChange={(e) => setSwitchPackId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <option value="default" className="dark:bg-zinc-950 dark:text-zinc-50">Cherry Blue Switches</option>
                  </select>
                </Section>

                <Section title="Keyboard Visualizer">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-semibold cursor-pointer select-none">
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
                  <label className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-semibold cursor-pointer select-none">
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
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] opacity-80">Acoustic nodes tuning</h4>
                
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
                    <label className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-semibold cursor-pointer select-none">
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
      <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] opacity-80">
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
    <div className="flex items-center gap-3 w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2">
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

export default function Home() {
  const keyboardRef = useRef<KeyboardHandle>(null)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const [appReady, setAppReady] = useState(false)
  const [activeTab, setActiveTab] = useState("Practice")

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

  const theme = appThemes.find((t) => t.id === appThemeId) || appThemes[0]

  const {
    words,
    stats,
    sessionState,
    currentWordIndex,
    currentCharIndex,
    restart,
    activeKeys,
  } = useTypingSession(keyboardRef, layoutId)

  const volume = useAppStore((s) => s.volume)

  useEffect(() => {
    let disposed = false
    audioEngine.init().then(() => {
      if (disposed) return
      audioEngine.setVolume(useAppStore.getState().volume)
      audioEngine.loadPack("default").then(() => {
        if (!disposed) setAppReady(true)
      })
    })
    return () => {
      disposed = true
      audioEngine.dispose()
    }
  }, [])

  useEffect(() => {
    audioEngine.setVolume(volume)
  }, [volume])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setSettingsOpen(!useAppStore.getState().settingsOpen)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setSettingsOpen])

  const toggleDarkMode = () => {
    if (appThemeId === "pure-white") {
      setAppThemeId("dark")
    } else {
      setAppThemeId("pure-white")
    }
  }

  const isDark = ["dark", "oled", "coffee", "rain", "night-studio"].includes(appThemeId)

  return (
    <main
      className="flex flex-col flex-1 min-h-screen overflow-hidden relative transition-colors duration-500 bg-[var(--background)] text-[var(--foreground)]"
      style={
        {
          "--background": theme.background,
          "--foreground": theme.foreground,
          "--muted": theme.muted,
          "--accent": theme.accent,
        } as React.CSSProperties
      }
    >
      {/* Drift particles behind content */}
      <BackgroundParticles />

      {/* VisionOS ambient highlights */}
      <div className="absolute top-[-15%] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-[var(--accent)]/3 to-transparent rounded-full blur-[130px] pointer-events-none z-[0] opacity-80" />
      <div className="absolute bottom-[-15%] left-[25%] right-[25%] h-[35%] bg-gradient-to-t from-[var(--accent)]/3 to-transparent rounded-full blur-[110px] pointer-events-none z-[0] opacity-70" />

      {/* Header Navigation */}
      <header className="flex items-center justify-between px-8 py-5 relative z-10 select-none">
        {/* Left: Minimal Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img src="/logo.jpg" alt="thock logo" className="w-5 h-5 rounded-md shadow-sm border border-black/5 dark:border-white/10" />
          <span className="font-bold tracking-tight text-lg text-[var(--foreground)] font-inter">thock<span className="text-[var(--accent)]">.</span></span>
        </div>

        {/* Center: Premium Nav Items */}
        <nav className="hidden sm:flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-sm">
          {["Practice", "Challenges", "Leaderboard", "Statistics", "Themes"].map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-300"
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
              </button>
            )
          })}
        </nav>

        {/* Right: profile + settings + toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer button-lift"
            title={soundEnabled ? "Mute Key Sounds" : "Unmute Key Sounds"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer button-lift"
            title={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
          >
            ⌨️
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer button-lift"
            title="Toggle Theme"
          >
            {isDark ? "🔆" : "🌙"}
          </button>
          
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold rounded-full bg-black/5 dark:bg-white/5 text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 border border-black/5 dark:border-white/5 cursor-pointer button-lift ml-1"
          >
            Settings
          </button>

          {/* HP profile avatar mockup */}
          <div className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-[10px] font-bold bg-gradient-to-tr from-zinc-200 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 text-[var(--foreground)] shadow-sm font-sans select-none cursor-default">
            HP
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
        {/* Stats bar */}
        {sessionState !== "finished" && (
          <div className="flex justify-center">
            <StatsBar stats={stats} />
          </div>
        )}

        {/* Typing Paragraph Focus Box */}
        <div className="flex-1 flex flex-col justify-center min-h-[220px]">
          {sessionState === "finished" ? (
            <div className="flex justify-center px-8">
              <ResultCard stats={stats} onRestart={restart} />
            </div>
          ) : (
            <WordsDisplay
              words={words}
              currentWordIndex={currentWordIndex}
              currentCharIndex={currentCharIndex}
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
      </div>

      {/* Footer hint details */}
      <footer className="text-center pb-4 text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase select-none relative z-10 opacity-70">
        Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--muted)]/20 bg-black/5 dark:bg-white/5 font-mono text-[9px]">Tab</kbd> to restart · Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--muted)]/20 bg-black/5 dark:bg-white/5 font-mono text-[9px]">Esc</kbd> for settings
      </footer>

      <SettingsPanel />
    </main>
  )
}
