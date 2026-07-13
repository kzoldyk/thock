export interface StatsSample {
  timestamp: number
  liveWpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
}

export class StatsHistoryBuffer {
  private readonly buffer: Array<StatsSample | undefined>
  private start = 0
  private count = 0

  constructor(private readonly capacity: number) {
    this.buffer = new Array<StatsSample | undefined>(capacity)
  }

  push(sample: StatsSample): void {
    if (this.capacity <= 0) return
    const index = (this.start + this.count) % this.capacity
    this.buffer[index] = sample
    if (this.count < this.capacity) {
      this.count++
      return
    }
    this.start = (this.start + 1) % this.capacity
  }

  latest(): StatsSample | undefined {
    if (this.count === 0) return undefined
    return this.buffer[(this.start + this.count - 1) % this.capacity]
  }

  toArray(): StatsSample[] {
    const items: StatsSample[] = []
    for (let i = 0; i < this.count; i++) {
      const item = this.buffer[(this.start + i) % this.capacity]
      if (item) items.push(item)
    }
    return items
  }

  recentWithin(windowMs: number): StatsSample[] {
    const items = this.toArray()
    if (items.length === 0) return []
    const latest = items[items.length - 1]!.timestamp
    return items.filter((sample) => latest - sample.timestamp <= windowMs)
  }

  clear(): void {
    this.start = 0
    this.count = 0
    this.buffer.fill(undefined)
  }

  get size(): number {
    return this.count
  }
}

export function createStatsHistory(capacity = 120): StatsHistoryBuffer {
  return new StatsHistoryBuffer(capacity)
}
