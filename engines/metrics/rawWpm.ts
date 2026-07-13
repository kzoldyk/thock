export function calculateAverageRawWpm(totalCharacters: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return (totalCharacters / 5) / (elapsedMs / 60000)
}
