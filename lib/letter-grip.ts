import type { Keystroke } from "@/types"

export const LETTER_GRIP_STORAGE_KEY = "thock_letter_grip_v1"

export interface LetterStat {
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

export interface UserGripProfile {
  letters: Record<string, LetterStat>
  strengths: string[]
  weaknesses: string[]
  neutral: string[]
  totalCharactersTyped: number
  overallAccuracy: number
}

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("")

/**
 * Standard baseline initialization for a single character.
 */
export function createDefaultLetterStat(char: string): LetterStat {
  return {
    char,
    totalTyped: 0,
    correctCount: 0,
    errorCount: 0,
    totalLatencyMs: 0,
    avgLatencyMs: 180,
    accuracy: 100,
    gripScore: 100,
    updatedAt: Date.now(),
  }
}

/**
 * Compute a normalized 0-100 Grip Mastery score from accuracy and inter-key latency.
 */
export function computeGripScore(
  totalTyped: number,
  correctCount: number,
  avgLatencyMs: number
): number {
  if (totalTyped <= 0) return 100

  const accuracy = Math.max(0, Math.min(100, (correctCount / totalTyped) * 100))

  // Typical typing latency spans ~100ms (fast) to ~450ms+ (hesitant)
  const normalizedLatency = Math.max(100, Math.min(500, avgLatencyMs || 200))
  const speedScore = Math.max(20, Math.min(100, 100 - ((normalizedLatency - 100) / 400) * 80))

  // Grip is 75% accuracy driven + 25% speed/smoothness driven
  const grip = Math.round(accuracy * 0.75 + speedScore * 0.25)
  return Math.max(0, Math.min(100, grip))
}

/**
 * Classifies letters into strengths, weaknesses, and neutral based on grip scores and sample volume.
 */
export function classifyStrengthsAndWeaknesses(
  letterMap: Record<string, LetterStat>
): { strengths: string[]; weaknesses: string[]; neutral: string[] } {
  const letters = Object.values(letterMap).filter((l) => /^[a-z]$/.test(l.char))

  const tested = letters.filter((l) => l.totalTyped >= 3)
  const untested = letters.filter((l) => l.totalTyped < 3).map((l) => l.char)

  if (tested.length === 0) {
    return {
      strengths: [],
      weaknesses: [],
      neutral: ALPHABET,
    }
  }

  // Sort by grip score ascending (lowest grip first)
  const sorted = [...tested].sort((a, b) => a.gripScore - b.gripScore)

  // Weaknesses: letters with grip < 80 or highest error count
  const weakCandidates = sorted.filter((l) => l.gripScore < 80 || l.errorCount > 0)
  const weaknesses = (weakCandidates.length > 0 ? weakCandidates : sorted.slice(0, 3)).map((l) => l.char)

  // Strengths: letters with high grip score >= 85 and good accuracy
  const strengthCandidates = sorted.filter(
    (l) => l.gripScore >= 85 && l.accuracy >= 92 && !weaknesses.includes(l.char)
  )
  const strengths = strengthCandidates.map((l) => l.char)

  // Neutral: tested letters that are neither strong nor weak, plus untested
  const neutral = [
    ...tested.filter((l) => !weaknesses.includes(l.char) && !strengths.includes(l.char)).map((l) => l.char),
    ...untested,
  ]

  return { strengths, weaknesses, neutral }
}

/**
 * Convert a dictionary of LetterStats into a complete UserGripProfile.
 */
export function buildGripProfile(letterMap: Record<string, LetterStat>): UserGripProfile {
  // Ensure all 26 alphabetic characters exist in letterMap
  for (const ch of ALPHABET) {
    if (!letterMap[ch]) {
      letterMap[ch] = createDefaultLetterStat(ch)
    }
  }

  const { strengths, weaknesses, neutral } = classifyStrengthsAndWeaknesses(letterMap)

  let totalTyped = 0
  let totalCorrect = 0

  for (const stat of Object.values(letterMap)) {
    totalTyped += stat.totalTyped
    totalCorrect += stat.correctCount
  }

  const overallAccuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 100) : 100

  return {
    letters: letterMap,
    strengths,
    weaknesses,
    neutral,
    totalCharactersTyped: totalTyped,
    overallAccuracy,
  }
}

/**
 * Safely retrieve local letter grip profile from localStorage.
 */
export function getLocalLetterGrip(): UserGripProfile {
  if (typeof window === "undefined") {
    const map: Record<string, LetterStat> = {}
    for (const ch of ALPHABET) {
      map[ch] = createDefaultLetterStat(ch)
    }
    return buildGripProfile(map)
  }

  try {
    const raw = window.localStorage.getItem(LETTER_GRIP_STORAGE_KEY)
    if (!raw) {
      const map: Record<string, LetterStat> = {}
      for (const ch of ALPHABET) {
        map[ch] = createDefaultLetterStat(ch)
      }
      return buildGripProfile(map)
    }

    const parsed = JSON.parse(raw) as Record<string, LetterStat>
    return buildGripProfile(parsed)
  } catch (err) {
    console.error("[letter-grip] Failed to read local letter grip:", err)
    const map: Record<string, LetterStat> = {}
    for (const ch of ALPHABET) {
      map[ch] = createDefaultLetterStat(ch)
    }
    return buildGripProfile(map)
  }
}

/**
 * Aggregate a session's keystrokes and merge them into local storage letter grip.
 */
export function saveLocalLetterGrip(keystrokes: Keystroke[]): UserGripProfile {
  const profile = getLocalLetterGrip()
  const map = { ...profile.letters }

  let prevTime: number | null = null

  for (let i = 0; i < keystrokes.length; i++) {
    const k = keystrokes[i]
    if (k.code === "Backspace" || k.code === "Space" || !k.target) {
      prevTime = k.timestamp
      continue
    }

    const char = k.target.toLowerCase()
    // Focus on alphanumeric characters
    if (!/^[a-z0-9]$/.test(char)) {
      prevTime = k.timestamp
      continue
    }

    if (!map[char]) {
      map[char] = createDefaultLetterStat(char)
    }

    const current = map[char]
    const isCorrect = Boolean(k.isCorrect)

    // Calculate latency from previous key (capped at 1500ms to ignore pauses)
    let latency = 180
    if (prevTime !== null) {
      const diff = k.timestamp - prevTime
      if (diff > 30 && diff < 1500) {
        latency = diff
      }
    }
    prevTime = k.timestamp

    const newTotal = current.totalTyped + 1
    const newCorrect = current.correctCount + (isCorrect ? 1 : 0)
    const newError = current.errorCount + (isCorrect ? 0 : 1)
    const newTotalLatency = current.totalLatencyMs + latency
    const newAvgLatency = Math.round(newTotalLatency / newTotal)
    const newAccuracy = Math.round((newCorrect / newTotal) * 100)
    const newGrip = computeGripScore(newTotal, newCorrect, newAvgLatency)

    map[char] = {
      char,
      totalTyped: newTotal,
      correctCount: newCorrect,
      errorCount: newError,
      totalLatencyMs: newTotalLatency,
      avgLatencyMs: newAvgLatency,
      accuracy: newAccuracy,
      gripScore: newGrip,
      updatedAt: Date.now(),
    }
  }

  const updatedProfile = buildGripProfile(map)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LETTER_GRIP_STORAGE_KEY, JSON.stringify(map))
    } catch (err) {
      console.error("[letter-grip] Failed to save local letter grip:", err)
    }
  }

  return updatedProfile
}
