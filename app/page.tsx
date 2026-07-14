"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { KeyboardScene, type KeyboardHandle } from "@/components/keyboard/KeyboardScene"
import { Keyboard2D } from "@/components/keyboard/Keyboard2D"
import { StatsBar } from "@/components/type/StatsBar"
import { WordsDisplay } from "@/components/type/Words"
import { ResultCard } from "@/components/type/ResultCard"
import { useTypingSession } from "@/hooks/useTypingSession"
import { useAppStore } from "@/stores/useAppStore"
import { audioEngine } from "@/engines/audioEngine"
import { appThemes } from "@/lib/themes"
import { keyboardThemes } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { BackgroundParticles } from "@/components/ui/BackgroundParticles"
import { getFontClass } from "@/lib/fonts"
import type { FontFamily } from "@/types"

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

function SettingsPanel({ isDarkMode, fontClass }: { isDarkMode: boolean; fontClass: string }) {
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
    dampenerId, setDampenerId,
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
            className={cn(
              "fixed inset-0 backdrop-blur-xl",
              isDarkMode ? "bg-zinc-950/60" : "bg-zinc-950/20",
            )}
            onClick={() => setSettingsOpen(false)}
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
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/8">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">Preferences</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">Workspace styling</h2>
                <p className="text-[11px] text-[var(--muted)] max-w-[34ch]">Tune the keyboard, typography, and ambient chrome so the whole interface feels aligned.</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-white/10 dark:border-white/10 bg-[var(--chrome-surface-soft)] hover:bg-[var(--chrome-surface)] cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors"
                  >
                    {appThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="bg-zinc-950 text-zinc-50">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Keyboard Finish">
                  <select
                    value={keyboardThemeId}
                    onChange={(e) => setKeyboardThemeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors"
                  >
                    {keyboardThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} className="bg-zinc-950 text-zinc-50">{theme.name}</option>
                    ))}
                  </select>
                </Section>

                <Section title="Typography Family">
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors"
                  >
                    <option value="inter">Inter</option>
                    <option value="geist">Geist</option>
                    <option value="sf-pro">SF Pro</option>
                    <option value="jetbrains-mono">JetBrains Mono</option>
                    <option value="ibm-plex-mono">IBM Plex Mono</option>
                    <option value="source-code-pro">Source Code Pro</option>
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
                    ]}
                    value={typingMode}
                    onChange={setTypingMode}
                  />
                </Section>

                <Section title="Switch Sounds Pack">
                  <select
                    value={switchPackId}
                    onChange={(e) => setSwitchPackId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors"
                  >
                    <option value="default" className="bg-zinc-950 text-zinc-50">Cherry Blue Switches</option>
                  </select>
                </Section>

                <Section title="Acoustic Dampener">
                  <select
                    value={dampenerId}
                    onChange={(e) => setDampenerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] text-xs text-[var(--foreground)] font-semibold focus:outline-none hover:bg-[var(--chrome-surface)] transition-colors"
                  >
                    <option value="none" className="bg-zinc-950 text-zinc-50">None (Pure Clack)</option>
                    <option value="tape" className="bg-zinc-950 text-zinc-50">Tape Mod (Creamy Mids)</option>
                    <option value="foam" className="bg-zinc-950 text-zinc-50">Foam Mod (Deep Thock)</option>
                    <option value="gasket" className="bg-zinc-950 text-zinc-50">Gasket Mount (Soft Cushioned)</option>
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
      <h3 className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] opacity-80">
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
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
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
      />

      {/* Drift particles behind content */}
      <BackgroundParticles />
      
      {/* ASCII Explosion Overlay */}
      <AsciiExplosionsOverlay />

      {/* VisionOS ambient highlights */}
      <div className="absolute top-[-15%] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-[var(--accent)]/3 to-transparent rounded-full blur-[130px] pointer-events-none z-[0] opacity-80" />
      <div className="absolute bottom-[-15%] left-[25%] right-[25%] h-[35%] bg-gradient-to-t from-[var(--accent)]/3 to-transparent rounded-full blur-[110px] pointer-events-none z-[0] opacity-70" />

      {/* Header Navigation */}
      <header className={cn(
        "flex items-center justify-between px-8 py-5 relative z-10 select-none flow-transition",
        (flowMode || sessionState === "typing") && "flow-fade-out"
      )}>
        {/* Left: Minimal Logo */}
        <div className="flex items-center gap-1.5 cursor-pointer">
          <span className="font-bold tracking-tight text-lg text-[var(--foreground)]">thock<span className="text-[var(--accent)]">.</span></span>
        </div>

        {/* Center: Premium Nav Items */}
        <nav className="hidden sm:flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-sm">
          {["Practice", "Challenges", "Leaderboard", "Statistics"].map((tab) => {
            const isPractice = tab === "Practice"
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                disabled={!isPractice}
                onClick={() => isPractice && setActiveTab(tab)}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5",
                  !isPractice ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
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
                {!isPractice && (
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
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
            title={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
          >
            ⌨️
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-full border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] flex items-center justify-center text-sm text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 cursor-pointer button-lift"
            title="Toggle Theme"
          >
            {isDark ? "🔆" : "🌙"}
          </button>
          
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[var(--chrome-surface-soft)] text-[var(--foreground)] hover:bg-[var(--chrome-surface)] transition-all duration-300 border border-[var(--chrome-border)] cursor-pointer button-lift ml-1"
          >
            Settings
          </button>

          {/* HP profile avatar mockup */}
          <div className="w-8 h-8 rounded-full border border-[var(--chrome-border)] flex items-center justify-center text-[10px] font-bold bg-gradient-to-tr from-zinc-200 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 text-[var(--foreground)] shadow-sm select-none cursor-default">
            HP
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
        {activeTab === "Practice" ? (
          <>
            {/* Stats bar */}
            {sessionState !== "finished" && (
              <div className={cn("flex justify-center flow-transition", (flowMode || sessionState === "typing") && "flow-fade-out")}>
                <StatsBar stats={stats} sessionState={sessionState} />
              </div>
            )}

            {/* Typing Paragraph Focus Box */}
            <div className="flex-1 flex flex-col justify-center min-h-[220px]">
              {sessionState === "finished" ? (
                <div className="flex justify-center px-8">
                  <ResultCard stats={stats} onRestart={restart} history={getHistory()} />
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
                  {activeTab === "Challenges" ? "🏆" : activeTab === "Leaderboard" ? "👑" : activeTab === "Statistics" ? "📈" : "✨"}
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
          "text-center pb-4 text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase select-none relative z-10 opacity-70 flow-transition",
          (flowMode || sessionState === "typing") && "flow-fade-out"
        )}>
          Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] font-mono text-[9px]">Tab</kbd> to restart · Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] font-mono text-[9px]">Esc</kbd> for settings
        </footer>
      )}

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

      <SettingsPanel isDarkMode={isDark} fontClass={fontClass} />

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
