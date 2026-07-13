import type { WordData } from "@/types"

export interface MistakeStats {
  mistakes: number
  wordMistakes: number
  correctCharacters: number
  incorrectCharacters: number
  correctSpaces: number
}

export function calculateMistakes(words: WordData[], targetText: string[]): MistakeStats {
  let mistakes = 0
  let correctCharacters = 0
  let incorrectCharacters = 0
  let correctSpaces = 0
  let wordMistakes = 0

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    if (!word) continue

    let wordHadMistake = false

    for (let charIndex = 0; charIndex < word.chars.length; charIndex++) {
      const char = word.chars[charIndex]
      if (char.state === "correct") {
        correctCharacters++
      } else if (char.state === "incorrect" || char.state === "extra") {
        mistakes++
        incorrectCharacters++
        wordHadMistake = true
      }
    }

    const targetWord = targetText[wordIndex] ?? ""
    if (word.isCompleted && (wordHadMistake || word.chars.length !== targetWord.length)) {
      wordMistakes++
    }

    if (word.isCompleted && !wordHadMistake && word.chars.length === targetWord.length) {
      correctSpaces++
    }
  }

  return {
    mistakes,
    wordMistakes,
    correctCharacters,
    incorrectCharacters,
    correctSpaces,
  }
}
