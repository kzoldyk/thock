import { describe, expect, it } from "vitest"
import { createWords, updateCharState, unsetCharState } from "@/engines/typingEngine"

describe("typing engine extra character management", () => {
  it("stores the typed character when adding an extra character", () => {
    const words = createWords(["hello"])
    
    // Type 'hello' correctly
    for (let i = 0; i < 5; i++) {
      updateCharState(words, 0, i, true, "hello"[i])
    }
    
    // Type extra character 'x' at index 5
    updateCharState(words, 0, 5, false, "x")
    
    expect(words[0].chars).toHaveLength(6)
    expect(words[0].chars[5]).toEqual({
      char: "x",
      state: "extra"
    })
  })

  it("removes the extra character from the array when backspaced", () => {
    const words = createWords(["hi"])
    
    // Type 'hi' correctly
    updateCharState(words, 0, 0, true, "h")
    updateCharState(words, 0, 1, true, "i")
    
    // Type extra 'a'
    updateCharState(words, 0, 2, false, "a")
    // Type extra 'b'
    updateCharState(words, 0, 3, false, "b")
    
    expect(words[0].chars).toHaveLength(4)
    
    // Backspace extra 'b' (at index 3)
    unsetCharState(words, 0, 3)
    expect(words[0].chars).toHaveLength(3)
    expect(words[0].chars[2].char).toBe("a")
    
    // Backspace extra 'a' (at index 2)
    unsetCharState(words, 0, 2)
    expect(words[0].chars).toHaveLength(2)
    
    // Backspace 'i' (at index 1) -> should untype, not splice
    unsetCharState(words, 0, 1)
    expect(words[0].chars).toHaveLength(2)
    expect(words[0].chars[1]).toEqual({
      char: "i",
      state: "untyped"
    })
  })
})
