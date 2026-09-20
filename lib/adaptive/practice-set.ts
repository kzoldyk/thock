import type { UserTypingProfile, WordAttempt, WordProfile } from "./types"
import { FREQUENCY_WORDS, getWordRank } from "../data/frequency"
import { effectiveDifficulty, classifyDifficultyBand } from "./difficulty"

/**
 * Practice vocabulary loop — the muscle-memory engine.
 *
 * The set is a curated ~60-word rotation:
 *  - "fast"  (~60%): words the user already types quickly and cleanly.
 *      Repeated exposure pushes their WPM further up, which lifts overall
 *      measured speed — users feel themselves improving fast.
 *  - "rehab" (~25%): words targeting current weaknesses.
 *  - "fresh" (~15%): unseen easy words for gentle exploration.
 *
 * Words rotate OUT after mastering (3 consecutive clean fast reps) and
 * failing rehab words drop back after 8 attempts.
 */

export const PRACTICE_SET_TARGET = 60
const FAST_SHARE = 0.6
const REHAB_SHARE = 0.25
export const MASTER_CLEAN_STREAK = 3
export const REHAB_MAX_ATTEMPTS = 8

/**
 * Rehab vocabulary is drawn from common words only — drilling a weakness
 * inside "grizzly" builds muscle memory for a word nobody types.
 */
const REHAB_MAX_RANK = 1000
/** Fresh exploration filler comes from the comfortably-frequent zone. */
const FRESH_POOL_SIZE = 600

interface PracticeWordMeta {
  word: string
  kind: "fast" | "rehab" | "fresh"
  cleanStreak: number
  rehabAttempts: number
}

/** Personal baseline proxy: median recentWpm across observed words */
function deriveBaselineWpm(profile: UserTypingProfile | null): number {
  const profiles = Object.values(profile?.words || {})
  if (profiles.length === 0) return 60
  const sorted = profiles.map((p) => p.recentWpm).sort((a, b) => a - b)
  return Math.max(30, sorted[Math.floor(sorted.length / 2)])
}

/**
 * Builds (or rebuilds) a practice set from the current profile state.
 * Called when the stored set is empty/undersized or after rotations.
 */
export function buildPracticeSet(
  profile: UserTypingProfile | null,
  rng: () => number = Math.random
): string[] {
  const baseline = deriveBaselineWpm(profile)
  const wordProfiles = Object.entries(profile?.words || {})
  const weaknesses = profile?.weaknesses || []

  // 1. Fast-and-clean candidates
  const fastWords = wordProfiles
    .filter(([, wp]) => wp.confidence > 0.5 && wp.recentAccuracy >= 97 && wp.recentWpm >= baseline * 0.95)
    .sort((a, b) => b[1].recentWpm - a[1].recentWpm)
    .map(([word]) => word)

  // 2. Rehab candidates: weak words directly, then words containing weak patterns
  const weakDirect = new Set(
    wordProfiles
      .filter(([, wp]) => wp.attempts >= 2 && wp.recentAccuracy < 92)
      .map(([word]) => word)
  )
  const weakPatterns = weaknesses.map((w) => w.pattern)
  const patternMatches: string[] = []
  for (const [word] of wordProfiles) {
    if (weakDirect.has(word)) continue
    if (weakPatterns.some((p) => p.length > 1 && word.includes(p))) {
      patternMatches.push(word)
    }
  }

  // 2. Rehab candidates: weak words directly, then words containing weak patterns.
  // Common words get priority; rare observed words are a last resort.
  const rankOf = (word: string): number => getWordRank(word) ?? Number.MAX_SAFE_INTEGER
  const byFrequency = (a: string, b: string) => rankOf(a) - rankOf(b)
  const weakDirectAll = [...weakDirect]
  const patternMatchesAll = [...patternMatches]
  weakDirectAll.sort(byFrequency)
  patternMatchesAll.sort(byFrequency)
  const rehabPool = [
    ...weakDirectAll.filter((w) => rankOf(w) <= REHAB_MAX_RANK),
    ...patternMatchesAll.filter((w) => rankOf(w) <= REHAB_MAX_RANK),
    ...weakDirectAll,
    ...patternMatchesAll,
  ]

  const fastQuota = Math.round(PRACTICE_SET_TARGET * FAST_SHARE)
  const rehabQuota = Math.round(PRACTICE_SET_TARGET * REHAB_SHARE)

  const picked = new Set<string>()
  const meta: PracticeWordMeta[] = []

  for (const w of fastWords.slice(0, fastQuota)) {
    if (!picked.has(w)) {
      picked.add(w)
      meta.push({ word: w, kind: "fast", cleanStreak: 0, rehabAttempts: 0 })
    }
  }
  for (const w of rehabPool.slice(0, rehabQuota)) {
    if (!picked.has(w)) {
      picked.add(w)
      meta.push({ word: w, kind: "rehab", cleanStreak: 0, rehabAttempts: 0 })
    }
  }
  if (picked.size < PRACTICE_SET_TARGET) {
    const freshEasy = FREQUENCY_WORDS.slice(0, FRESH_POOL_SIZE).filter(
      (w) =>
        !picked.has(w) &&
        classifyDifficultyBand(effectiveDifficulty(w, profile)) === "easy"
    )
    // Deterministic-ish shuffle via rng
    for (let i = freshEasy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[freshEasy[i], freshEasy[j]] = [freshEasy[j], freshEasy[i]]
    }
    for (const w of freshEasy.slice(0, PRACTICE_SET_TARGET - picked.size)) {
      picked.add(w)
      meta.push({ word: w, kind: "fresh", cleanStreak: 0, rehabAttempts: 0 })
    }
  }

  return Array.from(picked)
}

/**
 * Applies one session's word attempts to the practice set.
 * Returns the updated set plus words that just mastered (for UI celebration).
 */
export function updatePracticeSetOnSession(
  currentSet: string[],
  attempts: WordAttempt[],
  profile: UserTypingProfile,
  rng: () => number = Math.random
): { practiceSet: string[]; newlyMastered: string[] } {
  if (currentSet.length === 0) {
    // Bootstrap from scratch once enough telemetry exists
    if (profile.testCount >= 3) {
      return { practiceSet: buildPracticeSet(profile, rng), newlyMastered: [] }
    }
    return { practiceSet: currentSet, newlyMastered: [] }
  }

  const baseline = deriveBaselineWpm(profile)
  const newlyMastered: string[] = []

  // Track consecutive-clean performance per member using word profiles
  const masteredThisSession: string[] = []
  const failingRehab: string[] = []

  for (const word of currentSet) {
    const attemptsForWord = attempts.filter((a) => a.word === word)
    if (attemptsForWord.length === 0) continue

    const wp: WordProfile | undefined = profile.words[word]
    const lastAttempt = attemptsForWord[attemptsForWord.length - 1]

    // Promotion check: latest attempt clean AND fast → streak logic via profile trend proxy.
    // We approximate streaks with the word profile: high confidence + accuracy + speed means ready to graduate.
    const cleanAndFast =
      lastAttempt.accuracy >= 98 && lastAttempt.wpm >= baseline * 1.05
    const sustainedMastery =
      wp !== undefined &&
      wp.recentAccuracy >= 97 &&
      wp.recentWpm >= baseline * 1.05 &&
      wp.confidence > 0.55

    if (cleanAndFast && sustainedMastery) {
      masteredThisSession.push(word)
    } else if (lastAttempt.accuracy < 92 && wp && wp.recentAccuracy < 90 && wp.attempts >= REHAB_MAX_ATTEMPTS) {
      failingRehab.push(word)
    }
  }

  const nextSet = currentSet.filter((w) => !masteredThisSession.includes(w) && !failingRehab.includes(w))
  newlyMastered.push(...masteredThisSession)

  // Refill: prioritize fresh weak patterns, then easy unseen words.
  // Never re-add words that just rotated out this session.
  if (nextSet.length < PRACTICE_SET_TARGET) {
    const refill = buildPartialRefill(nextSet, profile, rng)
    for (const w of refill) {
      if (
        !nextSet.includes(w) &&
        !masteredThisSession.includes(w) &&
        !failingRehab.includes(w)
      ) {
        nextSet.push(w)
      }
      if (nextSet.length >= PRACTICE_SET_TARGET) break
    }
  }

  return { practiceSet: nextSet, newlyMastered }
}

function buildPartialRefill(
  currentSet: string[],
  profile: UserTypingProfile,
  rng: () => number
): string[] {
  const members = new Set(currentSet)
  const picked = new Set<string>()
  const out: string[] = []
  const push = (word: string) => {
    if (!picked.has(word)) {
      picked.add(word)
      out.push(word)
    }
  }

  // Rehab-first refill
  const weakWords = Object.entries(profile.words || {})
    .filter(([, wp]) => wp.attempts >= 2 && wp.recentAccuracy < 92 && !members.has(wp.word))
    .sort((a, b) => a[1].recentAccuracy - b[1].recentAccuracy)
  for (const [word] of weakWords.slice(0, Math.round(PRACTICE_SET_TARGET * REHAB_SHARE))) {
    push(word)
  }

  // Fast-word refill
  const baseline = deriveBaselineWpm(profile)
  const fastWords = Object.entries(profile.words || {})
    .filter(([, wp]) => wp.confidence > 0.5 && wp.recentAccuracy >= 97 && wp.recentWpm >= baseline * 0.95 && !members.has(wp.word))
    .sort((a, b) => b[1].recentWpm - a[1].recentWpm)
  for (const [word] of fastWords.slice(0, Math.round(PRACTICE_SET_TARGET * FAST_SHARE))) {
    push(word)
  }

  // Fresh easy filler
  if (out.length < PRACTICE_SET_TARGET) {
    const fresh = FREQUENCY_WORDS.slice(0, FRESH_POOL_SIZE).filter(
      (w) =>
        !members.has(w) &&
        classifyDifficultyBand(effectiveDifficulty(w, profile)) === "easy"
    )
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[fresh[i], fresh[j]] = [fresh[j], fresh[i]]
    }
    for (const w of fresh.slice(0, PRACTICE_SET_TARGET - out.length)) {
      push(w)
    }
  }

  return out
}
