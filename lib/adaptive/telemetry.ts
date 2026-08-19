import type {
  WordAttempt,
  UserTypingProfile,
} from "./types"
import type { Keystroke, WordData } from "@/types"
import { createWordProfile, updateWordProfile } from "./word-profile"
import {
  extractNGramSamplesFromKeystrokes,
  createNGramProfile,
  updateNGramProfile,
} from "./ngram-profile"
import { extractWeaknessDistribution, createEmptyUserProfile } from "./user-profile"
import { getLocalLetterGrip, saveLocalLetterGrip } from "../letter-grip"

export const ADAPTIVE_PROFILE_STORAGE_KEY = "thock_adaptive_profile_v1"
const MAX_STORED_WORDS = 350
const MAX_STORED_NGRAMS = 500

/**
 * Extracts structured WordAttempt records from session words and keystrokes.
 */
export function extractWordAttempts(
  words: WordData[],
  targetText: string[],
  keystrokes: Keystroke[]
): WordAttempt[] {
  if (!targetText || targetText.length === 0 || keystrokes.length === 0) return []

  const attempts: WordAttempt[] = []
  let keyIdx = 0

  for (let wIdx = 0; wIdx < targetText.length; wIdx++) {
    const targetWord = targetText[wIdx]
    if (!targetWord) continue

    const wordKeystrokes: Keystroke[] = []
    let wordCompleted = false

    while (keyIdx < keystrokes.length) {
      const k = keystrokes[keyIdx++]
      wordKeystrokes.push(k)

      if (k.code === "Space" || k.key === " ") {
        wordCompleted = true
        break
      }
    }

    if (wordKeystrokes.length === 0) continue

    const startedAt = wordKeystrokes[0].timestamp
    const completedAt = wordKeystrokes[wordKeystrokes.length - 1].timestamp
    const durationMs = Math.max(80, completedAt - startedAt)

    // Character keys (excluding Backspace and final Space)
    const charKeys = wordKeystrokes.filter(
      (k) => k.code !== "Backspace" && k.code !== "Space" && k.key !== " "
    )
    const errors = charKeys.filter((k) => !k.isCorrect).length
    const typedChars = Math.max(1, charKeys.length)
    const accuracy = Math.max(0, Math.min(100, Math.round(((typedChars - errors) / typedChars) * 100)))

    // WPM for this word: (chars / 5) / (duration in minutes)
    const wpm = Math.max(5, Math.min(280, Math.round(((targetWord.length + 1) / 5) / (durationMs / 60000))))
    const avgLatency = Math.round(durationMs / typedChars)

    attempts.push({
      word: targetWord.toLowerCase(),
      startedAt,
      completedAt,
      durationMs,
      expectedCharacters: targetWord.length,
      typedCharacters: typedChars,
      errors,
      correctedErrors: Math.min(errors, wordKeystrokes.filter((k) => k.code === "Backspace").length),
      accuracy,
      wpm,
      avgLatencyMs: avgLatency,
    })

    if (!wordCompleted && keyIdx >= keystrokes.length) {
      break
    }
  }

  return attempts
}

/**
 * Retrieves the local adaptive user profile from localStorage or initializes a default.
 */
export function getLocalAdaptiveProfile(): UserTypingProfile {
  const gripProfile = getLocalLetterGrip()
  const baseProfile = createEmptyUserProfile()
  baseProfile.letters = { ...gripProfile.letters }

  if (typeof window === "undefined") {
    baseProfile.weaknesses = extractWeaknessDistribution(baseProfile)
    return baseProfile
  }

  try {
    const raw = window.localStorage.getItem(ADAPTIVE_PROFILE_STORAGE_KEY)
    if (!raw) {
      baseProfile.weaknesses = extractWeaknessDistribution(baseProfile)
      return baseProfile
    }

    const parsed = JSON.parse(raw) as Partial<UserTypingProfile>
    const merged: UserTypingProfile = {
      letters: { ...gripProfile.letters, ...(parsed.letters || {}) },
      words: parsed.words || {},
      ngrams: parsed.ngrams || {},
      weaknesses: [],
      testCount: parsed.testCount || 0,
      lastUpdatedAt: parsed.lastUpdatedAt || Date.now(),
    }
    merged.weaknesses = extractWeaknessDistribution(merged)
    return merged
  } catch (err) {
    console.error("[adaptive-telemetry] Failed to read local adaptive profile:", err)
    baseProfile.weaknesses = extractWeaknessDistribution(baseProfile)
    return baseProfile
  }
}

/**
 * Ingests a completed session's keystrokes and updates word, n-gram, and letter telemetry.
 */
export function recordSessionTelemetry(
  keystrokes: Keystroke[],
  words: WordData[],
  targetText: string[],
  currentProfile?: UserTypingProfile | null
): UserTypingProfile {
  const profile = currentProfile ? { ...currentProfile } : getLocalAdaptiveProfile()

  // 1. Ingest letter-level statistics
  const updatedGrip = saveLocalLetterGrip(keystrokes)
  profile.letters = { ...updatedGrip.letters }

  // 2. Ingest word-level statistics
  const wordAttempts = extractWordAttempts(words, targetText, keystrokes)
  const wordMap = { ...profile.words }

  for (const attempt of wordAttempts) {
    const word = attempt.word
    if (!word) continue
    if (wordMap[word]) {
      wordMap[word] = updateWordProfile(wordMap[word], attempt)
    } else {
      wordMap[word] = createWordProfile(attempt)
    }
  }

  // 3. Ingest N-gram transitions
  const ngramMap = { ...profile.ngrams }
  for (let i = 0; i < targetText.length; i++) {
    const targetWord = targetText[i]
    if (!targetWord) continue

    // Keystrokes matching this target word
    const samples = extractNGramSamplesFromKeystrokes(targetWord, keystrokes)
    for (const sample of samples) {
      if (ngramMap[sample.ngram]) {
        ngramMap[sample.ngram] = updateNGramProfile(ngramMap[sample.ngram], sample)
      } else {
        ngramMap[sample.ngram] = createNGramProfile(sample)
      }
    }
  }

  // Prune least-recently-seen entries if map size exceeds limit to prevent localStorage bloat
  const wordEntries = Object.entries(wordMap)
  if (wordEntries.length > MAX_STORED_WORDS) {
    wordEntries.sort((a, b) => b[1].lastSeenAt - a[1].lastSeenAt)
    profile.words = Object.fromEntries(wordEntries.slice(0, MAX_STORED_WORDS))
  } else {
    profile.words = wordMap
  }

  const ngramEntries = Object.entries(ngramMap)
  if (ngramEntries.length > MAX_STORED_NGRAMS) {
    ngramEntries.sort((a, b) => b[1].lastSeenAt - a[1].lastSeenAt)
    profile.ngrams = Object.fromEntries(ngramEntries.slice(0, MAX_STORED_NGRAMS))
  } else {
    profile.ngrams = ngramMap
  }

  profile.testCount = (profile.testCount || 0) + 1
  profile.lastUpdatedAt = Date.now()
  profile.weaknesses = extractWeaknessDistribution(profile)

  // 4. Save to LocalStorage
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ADAPTIVE_PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch (err) {
      console.error("[adaptive-telemetry] Failed to save adaptive profile to localStorage:", err)
    }
  }

  return profile
}
