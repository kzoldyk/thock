import { FREQUENCY_WORDS } from "./data/frequency"
import type { Keystroke, TypingStats } from "@/types"

/**
 * Keybr's canonical progressive letter order based on letter frequency & touch typing mechanics.
 * Starting set is the first 6 keys: E, N, I, T, R, L.
 */
export const KEYBR_PROGRESSION = [
  "e", "n", "i", "t", "r", "l",
  "s", "a", "u", "o", "d", "c",
  "h", "m", "p", "g", "b", "f",
  "y", "w", "k", "v", "x", "z",
  "j", "q"
] as const

export const INITIAL_UNLOCKED_COUNT = 6
export const TARGET_CLEAN_STREAK = 3
export const LEARN_STORAGE_KEY = "thock_learn_progression_v1"

export interface LearnState {
  unlockedCount: number
  targetLetter: string
  cleanStreak: number
  totalCompletedLessons: number
  lastUpdated: number
}

const DEFAULT_STATE: LearnState = {
  unlockedCount: INITIAL_UNLOCKED_COUNT,
  targetLetter: KEYBR_PROGRESSION[INITIAL_UNLOCKED_COUNT - 1], // "l"
  cleanStreak: 0,
  totalCompletedLessons: 0,
  lastUpdated: 0,
}

let memoryStorage: Record<string, string> = {}

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      return localStorage.getItem(key)
    }
  } catch {}
  return memoryStorage[key] || null
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      localStorage.setItem(key, value)
    }
  } catch {}
  memoryStorage[key] = value
}

export function getLearnProgression(): LearnState {
  try {
    const raw = getStorageItem(LEARN_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as Partial<LearnState>
    const count = Math.min(
      KEYBR_PROGRESSION.length,
      Math.max(INITIAL_UNLOCKED_COUNT, parsed.unlockedCount ?? INITIAL_UNLOCKED_COUNT)
    )
    return {
      unlockedCount: count,
      targetLetter: KEYBR_PROGRESSION[count - 1],
      cleanStreak: Math.max(0, parsed.cleanStreak ?? 0),
      totalCompletedLessons: Math.max(0, parsed.totalCompletedLessons ?? 0),
      lastUpdated: parsed.lastUpdated ?? Date.now(),
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveLearnProgression(state: LearnState): void {
  try {
    setStorageItem(LEARN_STORAGE_KEY, JSON.stringify(state))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("thock_learn_updated", { detail: state }))
    }
  } catch {}
}

export function resetLearnProgression(): LearnState {
  const fresh: LearnState = {
    ...DEFAULT_STATE,
    lastUpdated: Date.now(),
  }
  saveLearnProgression(fresh)
  return fresh
}

export interface LearnEvaluationResult {
  unlocked: boolean
  newlyUnlockedLetter?: string
  nextTargetLetter?: string
  cleanStreak: number
  targetMet: boolean
  state: LearnState
}

/**
 * Evaluates a completed session in Learn mode to see if the target letter qualifies for unlock.
 */
export function evaluateLearnSession(
  stats: TypingStats,
  targetText: string[],
  keystrokes: Keystroke[],
  currentState?: LearnState
): LearnEvaluationResult {
  const state = currentState ?? getLearnProgression()
  const target = state.targetLetter.toLowerCase()

  // Target letter keystroke analysis
  const targetStrokes = keystrokes.filter(
    (k) => k.target && k.target.toLowerCase() === target
  )
  const targetCorrect = targetStrokes.filter((k) => k.isCorrect).length
  const targetTotal = targetStrokes.length
  const targetAccuracy = targetTotal > 0 ? (targetCorrect / targetTotal) * 100 : 100

  // Rep qualification criteria:
  // 1. Overall accuracy >= 94% and target accuracy >= 90%
  // 2. Minimum typing speed of 22 WPM
  // 3. At least 5 appearances of the target letter typed
  const isCleanRep =
    stats.accuracy >= 94 &&
    targetAccuracy >= 90 &&
    stats.wpm >= 22 &&
    targetTotal >= 3

  let nextStreak = isCleanRep ? state.cleanStreak + 1 : Math.max(0, state.cleanStreak - 1)
  let unlocked = false
  let newlyUnlockedLetter: string | undefined
  let nextTargetLetter: string | undefined

  // Instant unlock if extraordinary performance (>= 98% accuracy & >= 32 WPM) OR reached target streak
  const instantMastery = stats.accuracy >= 98 && targetAccuracy === 100 && stats.wpm >= 32 && targetTotal >= 4
  const canUnlock = state.unlockedCount < KEYBR_PROGRESSION.length

  if (canUnlock && (nextStreak >= TARGET_CLEAN_STREAK || instantMastery)) {
    unlocked = true
    const nextCount = state.unlockedCount + 1
    newlyUnlockedLetter = KEYBR_PROGRESSION[nextCount - 1]
    nextTargetLetter = newlyUnlockedLetter
    nextStreak = 0

    const nextState: LearnState = {
      unlockedCount: nextCount,
      targetLetter: nextTargetLetter,
      cleanStreak: 0,
      totalCompletedLessons: state.totalCompletedLessons + 1,
      lastUpdated: Date.now(),
    }
    saveLearnProgression(nextState)

    return {
      unlocked: true,
      newlyUnlockedLetter,
      nextTargetLetter,
      cleanStreak: 0,
      targetMet: true,
      state: nextState,
    }
  }

  const nextState: LearnState = {
    ...state,
    cleanStreak: nextStreak,
    totalCompletedLessons: state.totalCompletedLessons + (isCleanRep ? 1 : 0),
    lastUpdated: Date.now(),
  }
  saveLearnProgression(nextState)

  return {
    unlocked: false,
    cleanStreak: nextStreak,
    targetMet: isCleanRep,
    state: nextState,
  }
}

// ---------------------------------------------------------------------------
// Word & Pseudo-word Generator
// ---------------------------------------------------------------------------

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"])

/**
 * Generates Keybr-style pronounceable pseudo-words and dictionary matches
 * containing ONLY characters from the unlocked alphabet.
 */
export function generateLearnWords(count: number = 25, state?: LearnState): string[] {
  const curState = state ?? getLearnProgression()
  const unlockedLetters = KEYBR_PROGRESSION.slice(0, curState.unlockedCount)
  const unlockedSet = new Set<string>(unlockedLetters)
  const target = curState.targetLetter.toLowerCase()

  const availableVowels = unlockedLetters.filter((c) => VOWELS.has(c))
  const availableConsonants = unlockedLetters.filter((c) => !VOWELS.has(c))

  // 1. Gather valid dictionary words strictly matching unlocked letters
  const validDictionaryWords: string[] = []
  for (const word of FREQUENCY_WORDS) {
    if (word.length < 2 || word.length > 7) continue
    let valid = true
    for (let i = 0; i < word.length; i++) {
      if (!unlockedSet.has(word[i])) {
        valid = false
        break
      }
    }
    if (valid) {
      validDictionaryWords.push(word)
    }
    if (validDictionaryWords.length >= 250) break
  }

  // 2. Pronounceable pseudo-word builder (Keybr Markov/syllable style)
  const pseudoTemplates = ["CVC", "CVCV", "CVCC", "VCV", "CCVC", "VCC"]

  function makePseudoWord(mustContainTarget: boolean): string {
    const template = pseudoTemplates[Math.floor(Math.random() * pseudoTemplates.length)]
    let result = ""
    for (const type of template) {
      if (type === "C") {
        const pool = availableConsonants.length > 0 ? availableConsonants : unlockedLetters
        result += pool[Math.floor(Math.random() * pool.length)]
      } else {
        const pool = availableVowels.length > 0 ? availableVowels : unlockedLetters
        result += pool[Math.floor(Math.random() * pool.length)]
      }
    }

    if (mustContainTarget && !result.includes(target)) {
      // Inject target letter at a sensible position
      const pos = Math.floor(Math.random() * result.length)
      result = result.substring(0, pos) + target + result.substring(pos + 1)
    }
    return result
  }

  const resultWords: string[] = []
  const dictTargetWords = validDictionaryWords.filter((w) => w.includes(target))
  const dictOtherWords = validDictionaryWords.filter((w) => !w.includes(target))

  for (let i = 0; i < count; i++) {
    // 60% of words should feature the current target letter for muscle-memory drilling
    const shouldTarget = i % 2 === 0 || Math.random() < 0.6

    if (shouldTarget) {
      if (dictTargetWords.length > 0 && Math.random() < 0.6) {
        resultWords.push(dictTargetWords[Math.floor(Math.random() * dictTargetWords.length)])
      } else {
        resultWords.push(makePseudoWord(true))
      }
    } else {
      if (dictOtherWords.length > 0 && Math.random() < 0.6) {
        resultWords.push(dictOtherWords[Math.floor(Math.random() * dictOtherWords.length)])
      } else {
        resultWords.push(makePseudoWord(false))
      }
    }
  }

  return resultWords
}
