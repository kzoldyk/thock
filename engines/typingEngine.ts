import type { WordData, Char, CharState, TypingStats, Keystroke, SessionState } from "@/types"
import type { StatsSample } from "./metrics/history"
import { calculateAverageWpm, calculateRollingWpm, smoothMetric } from "./metrics/wpm"
import { calculateAverageRawWpm } from "./metrics/rawWpm"
import { calculateAccuracy } from "./metrics/accuracy"
import { calculateConsistencyFromHistory } from "./metrics/consistency"
import { calculateMistakes } from "./metrics/mistakes"
import { calculateBestStreak } from "./metrics/streak"

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
  wordMistake: boolean
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
      result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, wordMistake: false, action: "ignore" },
      newState: state,
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: false,
    }
  }

  const word = words[currentWordIndex]
  if (!word) {
    return {
      result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, wordMistake: false, action: "ignore" },
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
        result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: false, wordMistake: false, action: "backspace" },
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
        result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: true, wordMistake: false, action: "backspace" },
        newState: "typing",
        newWordIndex: currentWordIndex - 1,
        newCharIndex: prevCharIndex,
        shouldUpdate: true,
      }
    }
    return {
      result: { sessionEnded: false, isCorrect: true, isBackspace: true, isSpace: false, wordMistake: false, action: "ignore" },
      newState: state,
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex,
      shouldUpdate: false,
    }
  }

  // Space
  if (code === "Space" || key === " ") {
    const hasMistakes = word.chars.some((char) => char.state === "incorrect" || char.state === "extra")
    const wordMistake = hasMistakes || currentCharIndex !== targetWord.length
    word.isCurrent = false
    word.isCompleted = true

    if (currentWordIndex < words.length - 1) {
      const nextWord = words[currentWordIndex + 1]
      nextWord.isCurrent = true
      return {
        result: { sessionEnded: false, isCorrect: true, isBackspace: false, isSpace: true, wordMistake, action: "space" },
        newState: "typing",
        newWordIndex: currentWordIndex + 1,
        newCharIndex: 0,
        shouldUpdate: true,
      }
    }

    return {
      result: { sessionEnded: true, isCorrect: true, isBackspace: false, isSpace: true, wordMistake, action: "space" },
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
        wordMistake: false,
        action: "char",
      },
      newState: finished ? "finished" : "typing",
      newWordIndex: currentWordIndex,
      newCharIndex: currentCharIndex + 1,
      shouldUpdate: true,
    }
  }

  return {
    result: { sessionEnded: false, isCorrect: false, isBackspace: false, isSpace: false, wordMistake: false, action: "ignore" },
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
  history: StatsSample[],
  currentWordIndex: number,
  currentCharIndex: number,
): TypingStats {
  const mistakeStats = calculateMistakes(words, targetText)
  const totalTyped = keystrokes.filter((key) => key.code !== "Backspace").length
  const averageWpm = calculateAverageWpm(mistakeStats.correctCharacters + mistakeStats.correctSpaces, elapsedMs)
  const raw = calculateAverageRawWpm(totalTyped, elapsedMs)

  const latestHistory = history[history.length - 1]
  const liveWpmUnsmoothed = history.length > 0 ? calculateRollingWpm(history) : averageWpm
  const liveWpm = smoothMetric(latestHistory?.liveWpm ?? null, liveWpmUnsmoothed)
  const correctKeystrokes = mistakeStats.correctCharacters + mistakeStats.correctSpaces
  const incorrectKeystrokes = mistakeStats.incorrectCharacters
  const accuracy = calculateAccuracy(correctKeystrokes, incorrectKeystrokes)
  const consistency = calculateConsistencyFromHistory(history)
  const streak = calculateBestStreak(words)
  const wpm = averageWpm

  return {
    wpm,
    averageWpm,
    liveWpm,
    raw,
    accuracy,
    consistency,
    mistakes: mistakeStats.mistakes,
    wordMistakes: mistakeStats.wordMistakes,
    streak,
    elapsedMs,
    totalTyped,
    correctChars: correctKeystrokes,
  }
}

export function updateCharState(
  words: WordData[],
  wordIndex: number,
  charIndex: number,
  isCorrect: boolean,
  typedChar?: string,
): void {
  const word = words[wordIndex]
  if (!word) return
  if (charIndex < word.chars.length) {
    word.chars[charIndex].state = isCorrect ? "correct" : "incorrect"
  } else {
    word.chars.push({
      char: typedChar || "",
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
    if (word.chars[charIndex].state === "extra") {
      word.chars.splice(charIndex, 1)
    } else {
      word.chars[charIndex].state = "untyped"
    }
  }
}
