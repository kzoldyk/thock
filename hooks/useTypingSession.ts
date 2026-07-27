"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { TypingStats, WordData, SessionState, Keystroke, LayoutId } from "@/types"
import { generateWords } from "@/lib/words"
import {
  createWords,
  processKey,
  computeStats,
  updateCharState,
  unsetCharState,
} from "@/engines/typingEngine"
import { createStatsHistory, type StatsHistoryBuffer, type StatsSample } from "@/engines/metrics/history"
import { audioEngine } from "@/engines/audioEngine"
import { hapticEngine } from "@/engines/hapticEngine"
import { getLayout } from "@/lib/keyboard-layouts"
import { useAppStore } from "@/stores/useAppStore"

interface TypingSessionState {
  targetText: string[]
  words: WordData[]
  wordIndex: number
  charIndex: number
  state: SessionState
  startTime: number | null
  endTime: number | null
  keystrokes: Keystroke[]
  wordMistakes: number
  consecutiveCorrectChars: number
  lastTypoTime: number | null
  perfectWordCount: number
}

export interface TypingSessionAPI {
  words: WordData[]
  stats: TypingStats
  sessionState: SessionState
  currentWordIndex: number
  currentCharIndex: number
  restart: () => void
  activeKeys: Set<string>
  emitKeyEvent: (code: string, type: "down" | "up") => void
  getHistory: () => StatsSample[]
}

export const DEV_QUOTES = [
  "Talk is cheap. Show me the code.",
  "Programs must be written for people to read, and only incidentally for machines to execute.",
  "Simplicity is the soul of efficiency.",
  "Before software can be reusable it first has to be usable.",
  "There are only two hard things in Computer Science: cache invalidation and naming things.",
  "Make it work, make it right, make it fast.",
  "First, solve the problem. Then, write the code.",
  "Computers are good at following instructions, but not at reading your mind.",
  "Code is like humor. When you have to explain it, it is bad.",
  "Fix the cause, not the symptom."
]

function getQuoteForSeed(seed: number): string[] {
  const idx = Math.floor(Math.abs(Math.sin(seed)) * DEV_QUOTES.length)
  const quote = DEV_QUOTES[idx] || DEV_QUOTES[0]
  return quote.split(" ")
}

export const CODE_SNIPPETS = [
  "const [data, setData] = useState(null);",
  "useEffect(() => { fetchData(); }, []);",
  "function bubbleSort(arr) { for (let i = 0; i < arr.length; i++) { } }",
  "import { create } from 'zustand';",
  "export default function Page({ params }) { return <div>Hello</div>; }",
  "const response = await fetch('/api/user'); const data = await response.json();",
  "class Node { constructor(value) { this.value = value; this.next = null; } }",
  "const unique = [...new Set(array)];",
  "const active = items.filter(item => item.isActive);",
  "const sum = numbers.reduce((acc, curr) => acc + curr, 0);",
  "app.get('/api/v1/health', (req, res) => res.status(200).send('OK'));",
  "git commit -m 'feat: add settings options'",
  "npm install lucide-react framer-motion zustand",
  "docker-compose up -d --build",
  "SELECT users.id, posts.title FROM users JOIN posts ON users.id = posts.user_id;"
]

function getCodeSnippetForSeed(seed: number): string[] {
  const idx = Math.floor(Math.abs(Math.sin(seed)) * CODE_SNIPPETS.length)
  const snippet = CODE_SNIPPETS[idx] || CODE_SNIPPETS[0]
  return snippet.split(" ")
}

function getTargetTextForMode(
  mode: "time" | "words" | "quotes" | "code",
  seed: number,
  complexWords?: boolean,
): string[] {
  if (mode === "time") {
    return generateWords(150, seed, complexWords)
  } else if (mode === "words") {
    return generateWords(25, seed, complexWords)
  } else if (mode === "code") {
    return getCodeSnippetForSeed(seed)
  } else {
    return getQuoteForSeed(seed)
  }
}

function freshSession(
  mode: "time" | "words" | "quotes" | "code",
  seed?: number,
  complexWords?: boolean,
): TypingSessionState {
  const targetText = getTargetTextForMode(mode, seed ?? Date.now(), complexWords)
  const words = createWords(targetText)
  words[0].isCurrent = true
  return {
    targetText,
    words,
    wordIndex: 0,
    charIndex: 0,
    state: "idle",
    startTime: null,
    endTime: null,
    keystrokes: [],
    wordMistakes: 0,
    consecutiveCorrectChars: 0,
    lastTypoTime: null,
    perfectWordCount: 0,
  }
}

function emptySession(): TypingSessionState {
  return {
    targetText: [],
    words: [],
    wordIndex: 0,
    charIndex: 0,
    state: "idle",
    startTime: null,
    endTime: null,
    keystrokes: [],
    wordMistakes: 0,
    consecutiveCorrectChars: 0,
    lastTypoTime: null,
    perfectWordCount: 0,
  }
}

export function useTypingSession(
  keyboardRef: React.RefObject<{ pressKey: (code: string) => void; releaseKey: (code: string) => void } | null>,
  layoutId: LayoutId,
  disabled?: boolean,
): TypingSessionAPI {
  const sessionRef = useRef<TypingSessionState>(emptySession())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyRef = useRef<StatsHistoryBuffer>(createStatsHistory(120))
  const lastSampleAtRef = useRef(0)
  const activeKeysRef = useRef<Set<string>>(new Set())
  const [activeKeysView, setActiveKeysView] = useState<Set<string>>(() => new Set())
  const statsRef = useRef<TypingStats>({
    wpm: 0, averageWpm: 0, liveWpm: 0, raw: 0, accuracy: 100, consistency: 100,
    mistakes: 0, wordMistakes: 0, streak: 0, elapsedMs: 0,
    totalTyped: 0, correctChars: 0,
  })
  const [viewState, setViewState] = useState<TypingSessionState>(() => emptySession())
  const [viewStats, setViewStats] = useState<TypingStats>(() => ({
    wpm: 0,
    averageWpm: 0,
    liveWpm: 0,
    raw: 0,
    accuracy: 100,
    consistency: 100,
    mistakes: 0,
    wordMistakes: 0,
    streak: 0,
    elapsedMs: 0,
    totalTyped: 0,
    correctChars: 0,
  }))

  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const typingMode = useAppStore((s) => s.typingMode)
  const complexWords = useAppStore((s) => s.complexWords)
  const timeLimit = useAppStore((s) => s.timeLimit)

  const rerender = useCallback(() => {
    setViewState({ ...sessionRef.current })
    setViewStats({ ...statsRef.current })
    setActiveKeysView(new Set(activeKeysRef.current))
  }, [])

  const resetStatsBuffers = useCallback(() => {
    historyRef.current.clear()
    lastSampleAtRef.current = 0
  }, [])

  // Re-seed words after hydration or mode change so they differ per session
  useEffect(() => {
    const seed = Date.now()
    sessionRef.current = freshSession(typingMode, seed, complexWords)
    activeKeysRef.current.clear()
    resetStatsBuffers()
    rerender()
  }, [typingMode, complexWords, timeLimit, rerender, resetStatsBuffers])

  const getPanValue = useCallback(
    (code: string): number => {
      const keyDef = layout.keys.find((k) => k.code === code)
      if (!keyDef) return 0
      const center = keyDef.x + keyDef.width / 2
      return (center / layout.totalColumns - 0.5) * 1.6
    },
    [layout],
  )

  const computeLatestStats = useCallback(() => {
    const s = sessionRef.current
    if (!s.startTime) return
    const now = performance.now()
    let elapsed = s.endTime ? s.endTime - s.startTime : now - s.startTime

    const currentMode = useAppStore.getState().typingMode
    const currentTimeLimit = useAppStore.getState().timeLimit

    // dynamic seconds deadline threshold check (only in time mode)
    const thresholdMs = currentTimeLimit * 1000
    if (currentMode === "time" && s.state === "typing" && elapsed >= thresholdMs) {
      s.state = "finished"
      s.endTime = s.startTime + thresholdMs
      elapsed = thresholdMs
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    // Flow mode logic
    const flowThreshold = Math.min(20000, thresholdMs * 0.67)
    if (s.state === "typing" && elapsed >= flowThreshold && !useAppStore.getState().flowMode) {
      // Check if they are still typing actively (last keystroke within 3s)
      const lastStroke = s.keystrokes[s.keystrokes.length - 1];
      if (lastStroke && (now - lastStroke.timestamp < 3000)) {
         useAppStore.getState().setFlowMode(true);
      }
    }

    const history = historyRef.current.toArray()
    const nextStats = computeStats(
      s.words,
      s.targetText,
      elapsed,
      s.keystrokes,
      history,
      s.wordIndex,
      s.charIndex,
    )
    statsRef.current = nextStats

    if (history.length === 0 || elapsed - lastSampleAtRef.current >= 200 || s.state === "finished") {
      historyRef.current.push({
        timestamp: now,
        liveWpm: nextStats.liveWpm,
        rawWpm: nextStats.raw,
        accuracy: nextStats.accuracy,
        correctChars: nextStats.correctChars,
        incorrectChars: Math.max(0, nextStats.totalTyped - nextStats.correctChars),
      })
      lastSampleAtRef.current = elapsed
    }
    rerender()
  }, [rerender])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isSettingsOpen = useAppStore.getState().settingsOpen
      if (disabled || isSettingsOpen) {
        return
      }

      // Ignore key events when typing inside inputs or textareas
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.repeat) return
      const { key, code } = e
      if (!key) return
      const s = sessionRef.current

      if (code === "Tab") {
        e.preventDefault()
        const seed = Date.now()
        sessionRef.current = freshSession(typingMode, seed, complexWords)
        timerRef.current = null
        activeKeysRef.current.clear()
        setActiveKeysView(new Set())
        resetStatsBuffers()
        useAppStore.getState().setFlowMode(false)
        useAppStore.getState().setActiveEffect(null)
        rerender()
        return
      }

      if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
        keyboardRef.current?.pressKey(e.code)
        return
      }

      e.preventDefault()

      if (key.length === 1 || key === "Backspace" || code === "Space") {
        // Automatically blur any active button/link/select to return focus to the page for typing
        if (
          typeof document !== "undefined" &&
          document.activeElement &&
          document.activeElement !== document.body &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA"
        ) {
          (document.activeElement as HTMLElement).blur()
        }

        if (s.state === "idle") {
          s.startTime = performance.now()
          timerRef.current = setInterval(computeLatestStats, 100)
        }

        keyboardRef.current?.pressKey(code)

        activeKeysRef.current.add(code)
        setActiveKeysView(new Set(activeKeysRef.current))

        if (useAppStore.getState().soundEnabled) {
          const pan = getPanValue(code)
          audioEngine.playDown(code, pan)
        }

        hapticEngine.trigger(code)

        const result = processKey(
          key,
          code,
          s.wordIndex,
          s.charIndex,
          s.words,
          s.targetText,
          s.state,
          )

        if (result.shouldUpdate) {
          s.keystrokes.push({
            key,
            code,
            isCorrect: result.result.isCorrect,
            timestamp: Date.now(),
            target: s.targetText[s.wordIndex]?.[s.charIndex],
          })

          if (result.result.wordMistake) {
            s.wordMistakes++
          }

          if (result.result.action === "backspace" && result.newWordIndex === s.wordIndex) {
            unsetCharState(s.words, s.wordIndex, s.charIndex - 1)
          } else if (result.result.action === "char") {
            updateCharState(s.words, s.wordIndex, s.charIndex, result.result.isCorrect, key)
          }

          if (result.newState === "finished") {
            s.endTime = performance.now()
            useAppStore.getState().setFlowMode(false)
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
          }

          // Easter Egg Checks
          if (result.result.action === "space") {
            const completedWord = s.targetText[s.wordIndex].toUpperCase();
            if (!result.result.wordMistake) {
               s.words[s.wordIndex].isPerfect = true;
               useAppStore.getState().addExplosion();
               s.perfectWordCount++;
               if (s.perfectWordCount === 10) {
                  useAppStore.getState().setDelightMessage("10 Perfect Words! 💫")
                  setTimeout(() => useAppStore.getState().setDelightMessage(null), 2000)
               } else if (s.perfectWordCount === 25) {
                  useAppStore.getState().setDelightMessage("25 Words Streak! 🔥")
                  setTimeout(() => useAppStore.getState().setDelightMessage(null), 2000)
               }
            } else {
               s.perfectWordCount = 0;
            }
            const effectMap: Record<string, string> = {
              "THOCK": "thock-ripple",
              "FLOW": "warm-mode",
              "RHYTHM": "rhythm",
              "SPACE": "deep-space",
              "HELLO": "wave",
              "LOVE": "heart",
              "COFFEE": "steam",
              "RAIN": "rain",
              "APPLE": "clean-white",
              "NOTHING": "monochrome-mode"
            };
            if (effectMap[completedWord]) {
              const effect = effectMap[completedWord];
              useAppStore.getState().setActiveEffect(effect);
              
              if (completedWord === "THOCK") {
                audioEngine.playThockSpecial()
              } else if (completedWord === "RAIN") {
                useAppStore.getState().setAppThemeId("rain")
              } else if (completedWord === "APPLE") {
                useAppStore.getState().setAppThemeId("pure-white")
                useAppStore.getState().setFontFamily("sf-pro")
              } else if (completedWord === "NOTHING") {
                useAppStore.getState().setAppThemeId("pure-white")
                useAppStore.getState().setKeyboardThemeId("nothing")
              }
              
              setTimeout(() => useAppStore.getState().setActiveEffect(null), 3000);
            }
          }

          if (result.result.action === "char") {
             if (result.result.isCorrect) {
                // Correct character typed
                if (s.lastTypoTime !== null) {
                  const elapsedSinceTypo = performance.now() - s.lastTypoTime
                  if (elapsedSinceTypo < 350) {
                     useAppStore.getState().setDelightMessage("Fast Recovery! ⚡")
                     setTimeout(() => useAppStore.getState().setDelightMessage(null), 1500)
                  }
                  s.lastTypoTime = null
                }
                
                s.consecutiveCorrectChars++;
                if (s.consecutiveCorrectChars === 50) {
                   useAppStore.getState().setDelightMessage("50 Streak! ⚡")
                   setTimeout(() => useAppStore.getState().setDelightMessage(null), 1500)
                } else if (s.consecutiveCorrectChars === 100) {
                   useAppStore.getState().setDelightMessage("100 Combo! 🏆")
                   useAppStore.getState().setActiveEffect("golden-shimmer");
                   setTimeout(() => {
                      useAppStore.getState().setActiveEffect(null)
                      useAppStore.getState().setDelightMessage(null)
                   }, 2000);
                }
             } else {
                // Typo occurred! Record timestamp
                s.lastTypoTime = performance.now()
                s.consecutiveCorrectChars = 0;
             }
          }

          s.wordIndex = result.newWordIndex
          s.charIndex = result.newCharIndex
          s.state = result.newState

          computeLatestStats()
        }
      }
    },
    [keyboardRef, getPanValue, computeLatestStats, rerender, resetStatsBuffers, typingMode, complexWords, disabled],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore key events when typing inside inputs or textareas
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }

      keyboardRef.current?.releaseKey(e.code)
      if (activeKeysRef.current.has(e.code)) {
        activeKeysRef.current.delete(e.code)
        setActiveKeysView(new Set(activeKeysRef.current))
      }
    }
    const handleBlur = () => {
      activeKeysRef.current.clear()
      setActiveKeysView(new Set())
    }
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [handleKeyDown, keyboardRef])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const restart = useCallback(() => {
    const seed = Date.now()
    sessionRef.current = freshSession(typingMode, seed, complexWords)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    activeKeysRef.current.clear()
    setActiveKeysView(new Set())
    resetStatsBuffers()
    useAppStore.getState().setFlowMode(false)
    useAppStore.getState().setActiveEffect(null)
    statsRef.current = {
      wpm: 0, averageWpm: 0, liveWpm: 0, raw: 0, accuracy: 100, consistency: 100,
      mistakes: 0, wordMistakes: 0, streak: 0, elapsedMs: 0,
      totalTyped: 0, correctChars: 0,
    }
    rerender()
  }, [typingMode, complexWords, rerender, resetStatsBuffers])

  const emitKeyEvent = useCallback(
    (code: string, type: "down" | "up") => {
      const pan = getPanValue(code)
      const enabled = useAppStore.getState().soundEnabled
      if (type === "down") {
        keyboardRef.current?.pressKey(code)
        if (enabled) {
          audioEngine.playDown(code, pan)
        }
      } else {
        keyboardRef.current?.releaseKey(code)
        if (enabled) {
          audioEngine.playUp(code, pan)
        }
      }
    },
    [keyboardRef, getPanValue],
  )

  return {
    words: viewState.words,
    stats: viewStats,
    sessionState: viewState.state,
    currentWordIndex: viewState.wordIndex,
    currentCharIndex: viewState.charIndex,
    restart,
    activeKeys: activeKeysView,
    emitKeyEvent,
    getHistory: () => historyRef.current.toArray(),
  }
}
