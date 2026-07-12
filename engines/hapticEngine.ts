class HapticEngine {
  private shakeFn: ((code: string) => void) | null = null

  setShakeCallback(fn: (code: string) => void) {
    this.shakeFn = fn
  }

  trigger(code: string) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }
    if (this.shakeFn) {
      this.shakeFn(code)
    }
  }
}

export const hapticEngine = new HapticEngine()
