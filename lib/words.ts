const commonWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what", "so",
  "up", "out", "if", "about", "who", "get", "which", "go", "me", "when",
  "make", "can", "like", "time", "no", "just", "him", "know", "take", "people",
  "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
  "then", "now", "look", "only", "come", "its", "over", "think", "also", "back",
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us", "great",
  "between", "need", "large", "often", "hand", "high", "place", "small", "under", "long",
  "right", "still", "old", "big", "house", "world", "last", "ask", "own", "point",
  "city", "put", "man", "read", "why", "keep", "life", "show", "form", "off",
  "turn", "here", "move", "face", "thing", "find", "stand", "head", "same", "tell",
  "set", "study", "learn", "plant", "food", "sun", "four", "let", "run", "side",
  "feet", "car", "mile", "night", "walk", "white", "sea", "hard", "grow", "took",
  "river", "state", "once", "book", "hear", "stop", "idea", "eat", "watch", "far",
  "real", "almost", "girl", "cut", "talk", "soon", "list", "song", "being", "leave",
  "body", "music", "color", "mark", "dog", "horse", "birds", "room", "knew", "since",
  "ever", "piece", "told", "easy", "order", "red", "door", "sure", "top", "ship",
  "across", "today", "short", "better", "best", "low", "black", "wind", "rock", "space",
  "fast", "hold", "five", "step", "true", "table", "north", "money", "map", "busy",
  "pull", "cold", "voice", "fall", "power", "town", "fine", "fly", "unit", "dark",
  "note", "wait", "plan", "star", "box", "noun", "field", "rest", "able", "done",
  "drive", "front", "teach", "week", "gave", "green", "quick", "warm", "free", "mind",
  "clear", "tail", "fact", "stay", "full", "blue", "deep", "moon", "test", "boat",
  "gold", "plane", "dry", "game", "shape", "hot", "heat", "snow", "bring", "yes",
  "fill", "east", "paint", "grand", "ball", "yet", "wave", "drop", "heart", "am",
  "wide", "sail", "size", "ice", "pair", "felt", "pick", "count", "art", "bed",
  "egg", "ride", "cell", "sit", "race", "store", "train", "sleep", "wall", "wish",
  "sky", "board", "joy", "wild", "kept", "glass", "grass", "job", "edge", "sign",
  "past", "soft", "fun", "hope", "jump", "baby", "meet", "root", "buy", "hill",
  "safe", "cat", "type", "view", "cool", "play", "road", "help", "lead", "card",
  "win", "water", "light", "sound", "paper", "open", "home", "line", "care", "start",
  "story", "round", "clean", "write", "press", "cover", "check", "flow", "fair", "save",
  "ring", "modern", "hit", "team", "reach", "simple", "travel", "friend", "center", "path",
  "motion", "nature", "summer", "winter", "speech", "offer", "share", "level", "fresh", "shine",
]

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickRandom<T>(arr: T[], count: number, seed: number): T[] {
  const rng = mulberry32(seed)
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

export function generateWords(count: number = 30, seed?: number, complex: boolean = false): string[] {
  const words = pickRandom(commonWords, count, seed ?? 42)
  if (!complex) return words

  const rng = mulberry32(seed ?? 42)
  
  return words.map((word) => {
    let newWord = word
    const r = rng()
    
    // 1. Capitalization (caps & smalls)
    if (r < 0.25) {
      // Capitalize first letter
      newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1)
    } else if (r < 0.35) {
      // All caps
      newWord = newWord.toUpperCase()
    } else if (r < 0.45) {
      // Mixed caps (smalls and caps)
      newWord = newWord.split("").map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join("")
    }

    // 2. Symbols and proper symbols
    const rSym = rng()
    if (rSym < 0.15) {
      // Add punctuation at end
      const puncs = [".", ",", "?", "!", ";", ":"]
      const punc = puncs[Math.floor(rng() * puncs.length)]
      newWord = newWord + punc
    } else if (rSym < 0.25) {
      // Wrap with brackets or quotes
      const wraps = [["(", ")"], ["[", "]"], ["{", "}"], ["\"", "\""], ["'", "'"]]
      const wrap = wraps[Math.floor(rng() * wraps.length)]
      newWord = wrap[0] + newWord + wrap[1]
    } else if (rSym < 0.35) {
      // Add other common symbols/characters
      const symbols = ["@", "#", "$", "%", "^", "&", "*", "-", "_", "+", "=", "|", "/", "\\"]
      const sym = symbols[Math.floor(rng() * symbols.length)]
      if (rng() < 0.5) {
        newWord = sym + newWord
      } else {
        newWord = newWord + sym
      }
    }

    return newWord
  })
}

export function generateSentence(): string {
  return generateWords(8).join(" ")
}
