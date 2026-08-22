/**
 * Easter egg registry + discovery tracking.
 *
 * Hidden words trigger visual/audio effects when typed (see useTypingSession).
 * The adaptive word engine occasionally injects undiscovered eggs into
 * sequences so users stumble onto them naturally.
 */

export interface EasterEgg {
  /** Lowercase trigger word */
  word: string
  /** Effect id passed to useAppStore.setActiveEffect */
  effect: string
  /** Display label once discovered */
  label: string
  /** Cryptic teaser shown before discovery */
  hint: string
}

export const EASTER_EGGS: EasterEgg[] = [
  { word: "thock", effect: "thock-ripple", label: "THOCK", hint: "the sound this place is named after" },
  { word: "flow", effect: "warm-mode", label: "FLOW", hint: "when typing feels effortless" },
  { word: "rhythm", effect: "rhythm", label: "RHYTHM", hint: "keep the beat, steady hands" },
  { word: "space", effect: "deep-space", label: "SPACE", hint: "the biggest key of all" },
  { word: "hello", effect: "wave", label: "HELLO", hint: "start a conversation" },
  { word: "love", effect: "heart", label: "LOVE", hint: "what you feel for a good keyboard" },
  { word: "coffee", effect: "steam", label: "COFFEE", hint: "a programmer's fuel" },
  { word: "rain", effect: "rain", label: "RAIN", hint: "listen outside the window" },
  { word: "apple", effect: "clean-white", label: "APPLE", hint: "one brand keeps things clean" },
  { word: "nothing", effect: "monochrome-mode", label: "NOTHING", hint: "less is more" },
]

const DISCOVERY_STORAGE_KEY = "thock_easter_eggs_v1"

/** Map of discovered egg word -> times triggered */
export type EggDiscoveryMap = Record<string, number>

export function findEasterEgg(word: string): EasterEgg | null {
  if (!word) return null
  const clean = word.toLowerCase().replace(/[^a-z]/g, "")
  return EASTER_EGGS.find((egg) => egg.word === clean) || null
}

export function getDiscoveredEggs(): EggDiscoveryMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(DISCOVERY_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    const out: EggDiscoveryMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (findEasterEgg(key) && typeof value === "number" && value > 0) {
        out[key] = value
      }
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Records a discovery/trigger. Returns true only the FIRST time a given
 * egg is found (useful for one-time celebration UI).
 */
export function recordEggDiscovery(word: string): boolean {
  const egg = findEasterEgg(word)
  if (!egg || typeof window === "undefined") return false
  try {
    const discovered = getDiscoveredEggs()
    const isFirstTime = !discovered[egg.word]
    discovered[egg.word] = (discovered[egg.word] || 0) + 1
    window.localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(discovered))
    return isFirstTime
  } catch {
    return false
  }
}

export interface SecretsProgress {
  found: number
  total: number
}

export function getSecretsProgress(): SecretsProgress {
  const discovered = getDiscoveredEggs()
  return { found: Object.keys(discovered).length, total: EASTER_EGGS.length }
}

/**
 * Returns a cryptic teaser for a random undiscovered egg, or null when
 * everything has been found.
 */
export function pickUndiscoveredHint(rng: () => number = Math.random): string | null {
  const discovered = getDiscoveredEggs()
  const remaining = EASTER_EGGS.filter((egg) => !discovered[egg.word])
  if (remaining.length === 0) return null
  return remaining[Math.floor(rng() * remaining.length)].hint
}

/**
 * Picks an undiscovered egg suitable for injection into a generated word
 * sequence. Skips words already present in the sequence or recently typed.
 * Returns null when nothing qualifies (all found / conflicts).
 */
export function pickEasterEggInjection(
  rng: () => number,
  excludeWords: Iterable<string>
): string | null {
  const exclude = new Set(excludeWords)
  const discovered = getDiscoveredEggs()
  const candidates = EASTER_EGGS.filter(
    (egg) => !discovered[egg.word] && !exclude.has(egg.word)
  )
  if (candidates.length === 0) return null
  return candidates[Math.floor(rng() * candidates.length)].word
}
