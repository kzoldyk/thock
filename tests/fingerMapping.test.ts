import { describe, it, expect } from "vitest"
import {
  FINGER_ASSIGNMENTS,
  getFingerForChar,
  getFingerForKeyCode,
  getFingerForKey,
} from "@/lib/finger-mapping"

describe("Finger Mapping & Keyboard Color Zoning Engine", () => {
  it("assigns matching colors and finger IDs to all keys of the same finger", () => {
    // Left Middle finger controls 3, e, d, c in Amber (#eab308)
    const middleKeys = ["3", "e", "d", "c"]
    for (const key of middleKeys) {
      const finger = getFingerForChar(key)
      expect(finger).toBeDefined()
      expect(finger?.id).toBe("left-middle")
      expect(finger?.hand).toBe("left")
      expect(finger?.fingerNumber).toBe(3)
      expect(finger?.color).toBe("#eab308")
    }

    // Left Pinky finger controls 1, q, a, z in Rose (#f43f5e)
    const pinkyKeys = ["1", "q", "a", "z"]
    for (const key of pinkyKeys) {
      const finger = getFingerForChar(key)
      expect(finger).toBeDefined()
      expect(finger?.id).toBe("left-pinky")
      expect(finger?.hand).toBe("left")
      expect(finger?.fingerNumber).toBe(5)
      expect(finger?.color).toBe("#f43f5e")
    }

    // Right Middle finger controls 8, i, k, comma in Blue (#3b82f6)
    const rightMiddleKeys = ["8", "i", "k", ","]
    for (const key of rightMiddleKeys) {
      const finger = getFingerForChar(key)
      expect(finger).toBeDefined()
      expect(finger?.id).toBe("right-middle")
      expect(finger?.hand).toBe("right")
      expect(finger?.fingerNumber).toBe(3)
      expect(finger?.color).toBe("#3b82f6")
    }
  })

  it("accurately maps KeyboardEvent codes to finger assignments", () => {
    expect(getFingerForKeyCode("KeyE")?.id).toBe("left-middle")
    expect(getFingerForKeyCode("KeyJ")?.id).toBe("right-index")
    expect(getFingerForKeyCode("Space")?.finger).toBe("thumb")
    expect(getFingerForKeyCode("Semicolon")?.id).toBe("right-pinky")
  })

  it("handles fallback lookup with getFingerForKey", () => {
    expect(getFingerForKey("KeyD", "D")?.color).toBe("#eab308")
    expect(getFingerForKey(undefined, "K")?.color).toBe("#3b82f6")
    expect(getFingerForKey("Space", "")?.color).toBe("#64748b")
  })

  it("assigns correct human-friendly ordinals (1=Thumb to 5=Pinky)", () => {
    expect(FINGER_ASSIGNMENTS["left-thumb"].fingerNumber).toBe(1)
    expect(FINGER_ASSIGNMENTS["left-index"].fingerNumber).toBe(2)
    expect(FINGER_ASSIGNMENTS["left-middle"].fingerNumber).toBe(3)
    expect(FINGER_ASSIGNMENTS["left-ring"].fingerNumber).toBe(4)
    expect(FINGER_ASSIGNMENTS["left-pinky"].fingerNumber).toBe(5)

    expect(FINGER_ASSIGNMENTS["right-thumb"].fingerNumber).toBe(1)
    expect(FINGER_ASSIGNMENTS["right-index"].fingerNumber).toBe(2)
    expect(FINGER_ASSIGNMENTS["right-middle"].fingerNumber).toBe(3)
    expect(FINGER_ASSIGNMENTS["right-ring"].fingerNumber).toBe(4)
    expect(FINGER_ASSIGNMENTS["right-pinky"].fingerNumber).toBe(5)
  })
})
