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
}

function freshSession(seed?: number): TypingSessionState {
  const targetText = generateWords(200, seed)
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
  }
}

export function useTypingSession(
  keyboardRef: React.RefObject<{ pressKey: (code: string) => void; releaseKey: (code: string) => void } | null>,
  layoutId: LayoutId,
): TypingSessionAPI {
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const sessionRef = useRef<TypingSessionState>(emptySession())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeKeysRef = useRef<Set<string>>(new Set())
  const [activeKeysView, setActiveKeysView] = useState<Set<string>>(() => new Set())
  const statsRef = useRef<TypingStats>({
    wpm: 0, raw: 0, accuracy: 100, consistency: 100,
    mistakes: 0, wordMistakes: 0, streak: 0, elapsedMs: 0,
    totalTyped: 0, correctChars: 0,
  })
  const [viewState, setViewState] = useState<TypingSessionState>(() => emptySession())
  const [viewStats, setViewStats] = useState<TypingStats>(() => ({
    wpm: 0,
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
  const hydrated = useRef(false)

  const layout = useMemo(() => getLayout(layoutId), [layoutId])

  const rerender = useCallback(() => {
    setViewState({ ...sessionRef.current })
    setViewStats({ ...statsRef.current })
    setActiveKeysView(new Set(activeKeysRef.current))
  }, [])

  // Re-seed words after hydration so they differ per session
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const seed = Date.now()
    const targetText = generateWords(30, seed)
    sessionRef.current = {
      ...freshSession(seed),
      words: createWords(targetText),
      targetText,
    }
    activeKeysRef.current.clear()
    rerender()
  }, [rerender])

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
    
    let elapsed = s.endTime ? s.endTime - s.startTime : Date.now() - s.startTime

    // 30 seconds deadline threshold check
    if (s.state === "typing" && elapsed >= 30000) {
      s.state = "finished"
      s.endTime = s.startTime + 30000
      elapsed = 30000
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    statsRef.current = computeStats(
      s.words,
      s.targetText,
      elapsed,
      s.keystrokes,
      s.wordMistakes,
      s.wordIndex,
      s.charIndex,
    )
    rerender()
  }, [rerender])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return
      const { key, code } = e
      const s = sessionRef.current

      if (code === "Tab") {
        e.preventDefault()
        const seed = Date.now()
        sessionRef.current = freshSession(seed)
        timerRef.current = null
        activeKeysRef.current.clear()
        setActiveKeysView(new Set())
        rerender()
        return
      }

      if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
        keyboardRef.current?.pressKey(e.code)
        return
      }

      e.preventDefault()

      if (key.length === 1 || key === "Backspace" || code === "Space") {
        if (s.state === "idle") {
          s.startTime = Date.now()
          timerRef.current = setInterval(computeLatestStats, 100)
        }

        keyboardRef.current?.pressKey(code)

        activeKeysRef.current.add(code)
        setActiveKeysView(new Set(activeKeysRef.current))
        setTimeout(() => {
          activeKeysRef.current.delete(code)
          setActiveKeysView(new Set(activeKeysRef.current))
          rerender()
        }, 100)

        if (useAppStore.getState().soundEnabled) {
          const pan = getPanValue(code)
          console.warn("[typing-session] handleKeyDown: key =", key, "code =", code, "pan =", pan)
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
            updateCharState(s.words, s.wordIndex, s.charIndex, result.result.isCorrect)
          }

          s.wordIndex = result.newWordIndex
          s.charIndex = result.newCharIndex
          s.state = result.newState

          if (result.newState === "finished") {
            s.endTime = Date.now()
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
          }

          computeLatestStats()
        }
      }
    },
    [keyboardRef, getPanValue, computeLatestStats, rerender],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardRef.current?.releaseKey(e.code)
    }
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
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
    sessionRef.current = freshSession(seed)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    activeKeysRef.current.clear()
    setActiveKeysView(new Set())
    statsRef.current = {
      wpm: 0, raw: 0, accuracy: 100, consistency: 100,
      mistakes: 0, wordMistakes: 0, streak: 0, elapsedMs: 0,
      totalTyped: 0, correctChars: 0,
    }
    rerender()
  }, [rerender])

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
  }
}
