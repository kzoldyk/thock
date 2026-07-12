import type { WordData, Char, CharState, TypingStats, Keystroke, SessionState } from "@/types"

export function createWordData(word: string): Char[] {
  return word.split("").map((ch) => ({
    char: ch,
    state: "untyped" as CharState,
  }))
}

export function createWords(targetText: string[]): WordData[] {
  return targetText.map((word) => ({
    chars: createWordData(word),
    isCurrent: false,
    isCompleted: false,
  }))
}

export function startSession(targetText: string[]): {
  words: WordData[]
  currentWordIndex: number
  currentCharIndex: number
  state: SessionState
} {
  const words = createWords(targetText)
  words[0].isCurrent = true
  return {
    words,
    currentWordIndex: 0,
    currentCharIndex: 0,
    state: "idle",
  }
}

export interface ProcessKeyResult {
  sessionEnded: boolean
  isCorrect: boolean
  isBackspace: boolean
  isSpace: boolean
  action: "char" | "space" | "backspace" | "ignore" | "restart"
}

export function processKey(
  key: string,
  code: string,
  currentWordIndex: number,
  currentCharIndex: number,
  words: WordData[],
  targetText: string[],
  state: SessionState,
): {
  result: ProcessKeyResult
  newState: SessionState
  newWordIndex: number
  newCharIndex: number
  shouldUpdate: boolean
} {
  if (state === "finished") {
    return {
      result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, action: "ignore" },
      newState: state,
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: false,
    }
  }

  const word = words[currentWordIndex]
  if (!word) {
    return {
      result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, action: "ignore" },
      newState: state,
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: false,
    }
  }

  const targetWord = targetText[currentWordIndex]

  // Backspace
  if (code === "Backspace") {
    if (currentCharIndex > 0) {
      return {
        result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: false, action: "backspace" },
        newState: "typing",
        newWordIndex: currentWordIndex,
        newCharIndex: currentCharIndex - 1,
        shouldUpdate: true,
      }
    }
    if (currentCharIndex === 0 && currentWordIndex > 0) {
      const prevWord = words[currentWordIndex - 1]
      prevWord.isCurrent = true
      prevWord.isCompleted = false
      word.isCurrent = false
      const prevCharIndex = targetText[currentWordIndex - 1].length
      return {
        result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: true, action: "backspace" },
        newState: "typing",
        newWordIndex: currentWordIndex - 1,
        newCharIndex: prevCharIndex,
        shouldUpdate: true,
      }
    }
    return {
      result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: false, action: "ignore" },
      newState: state,
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: false,
    }
  }

  // Space
  if (code === "Space" || key === " ") {
    word.isCurrent = false
    word.isCompleted = true

    if (currentWordIndex < words.length - 1) {
      const nextWord = words[currentWordIndex + 1]
      nextWord.isCurrent = true
      return {
        result: { sessionEnded: false, isCorrect: true, isBackspace: false, isSpace: true, action: "space" },
        newState: "typing",
        newWordIndex: currentWordIndex + 1,
        newCharIndex: 0,
        shouldUpdate: true,
      }
    }

    return {
      result: { sessionEnded: true, isCorrect: true, isBackspace: false, isSpace: true, action: "space" },
      newState: "finished",
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: true,
    }
  }

  // Regular character
  if (key.length === 1) {
    let isCorrect = false
    if (currentCharIndex < targetWord.length) {
      isCorrect = key === targetWord[currentCharIndex]
    }

    const isLastWord = currentWordIndex === words.length - 1
    const isLastChar = currentCharIndex >= targetWord.length - 1
    const finished = isLastWord && isLastChar

    return {
      result: {
        sessionEnded: finished,
        isCorrect,
        isBackspace: false,
        isSpace: false,
        action: "char",
      },
      newState: finished ? "finished" : "typing",
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex + 1,
      shouldUpdate: true,
    }
  }

  return {
    result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, action: "ignore" },
    newState: state,
    newWordIndex: currentWordIndex,
    newCharIndex: currentCharIndex,
    shouldUpdate: false,
  }
}

export function computeStats(
  words: WordData[],
  targetText: string[],
  elapsedMs: number,
  keystrokes: Keystroke[],
  currentWordIndex: number,
  currentCharIndex: number,
): TypingStats {
  let totalCorrect = 0
  let totalTyped = 0
  let mistakes = 0

  for (const word of words) {
    for (const char of word.chars) {
      if (char.state === "correct") totalCorrect++
      if (char.state === "incorrect" || char.state === "extra") mistakes++
      if (char.state !== "untyped") totalTyped++
    }
  }

  let correctChars = totalCorrect
  const elapsedMin = Math.max(elapsedMs / 60000, 0.0001)
  const wpm = Math.round((totalCorrect / 5) / elapsedMin)
  const raw = Math.round((totalTyped / 5) / elapsedMin)
  const accuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 100) : 100

  const wpmSamples = getWpmSamples(words, elapsedMin)
  const consistency = computeConsistency(wpmSamples, wpm)

  let streak = 0
  let currentStreak = 0
  for (const w of words) {
    for (const c of w.chars) {
      if (c.state === "correct") {
        currentStreak++
        streak = Math.max(streak, currentStreak)
      } else if (c.state === "incorrect" || c.state === "extra") {
        currentStreak = 0
      }
    }
  }

  return {
    wpm,
    raw,
    accuracy,
    consistency,
    mistakes,
    streak,
    elapsedMs,
    totalTyped,
    correctChars,
  }
}

function getWpmSamples(words: WordData[], elapsedMin: number): number[] {
  const samples: number[] = []
  let typed = 0
  for (const w of words) {
    for (const c of w.chars) {
      if (c.state === "correct" || c.state === "incorrect") {
        typed++
      }
    }
  }
  if (typed > 0) samples.push(Math.round((typed / 5) / Math.max(elapsedMin, 0.001)))
  return samples.length > 0 ? samples : [0]
}

function computeConsistency(samples: number[], currentAvg: number): number {
  if (samples.length < 2 || currentAvg === 0) return 100
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  const stdDev = Math.sqrt(variance)
  const cv = stdDev / mean
  return Math.max(0, Math.round((1 - cv) * 100))
}

export function updateCharState(
  words: WordData[],
  wordIndex: number,
  charIndex: number,
  isCorrect: boolean,
): void {
  const word = words[wordIndex]
  if (!word) return
  if (charIndex < word.chars.length) {
    word.chars[charIndex].state = isCorrect ? "correct" : "incorrect"
  } else {
    word.chars.push({
      char: "",
      state: "extra",
    })
  }
}

export function unsetCharState(
  words: WordData[],
  wordIndex: number,
  charIndex: number,
): void {
  const word = words[wordIndex]
  if (!word) return
  if (charIndex >= 0 && charIndex < word.chars.length) {
    word.chars[charIndex].state = "untyped"
  }
}
