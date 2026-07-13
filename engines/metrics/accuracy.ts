export function calculateAccuracy(correctUnits: number, incorrectUnits: number): number {
  const total = correctUnits + incorrectUnits
  if (total <= 0) return 100
  return (correctUnits / total) * 100
}
