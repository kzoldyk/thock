import type {
  TestRecord,
  UserStatsSummary,
  ModeStatBreakdown,
  SpeedBucket,
  DiagnosticInsight,
} from "@/types"

export const STORAGE_KEY = "thock_user_history_v1"
const MAX_STORED_TESTS = 500

/**
 * Safely retrieve local test history from localStorage.
 */
export function getLocalHistory(): TestRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is TestRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.wpm === "number" &&
        !isNaN(item.wpm) &&
        typeof item.createdAt === "number"
    )
  } catch (err) {
    console.error("[user-stats] Failed to read local history:", err)
    return []
  }
}

/**
 * Save a new test result locally to localStorage.
 */
export function saveLocalTestResult(
  data: Omit<TestRecord, "id" | "createdAt"> & { id?: string; createdAt?: number }
): TestRecord {
  const newRecord: TestRecord = {
    id: data.id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    wpm: Math.round(Number.isNaN(data.wpm) ? 0 : data.wpm),
    rawWpm: Math.round(Number.isNaN(data.rawWpm) ? 0 : data.rawWpm),
    accuracy: Math.round(Number.isNaN(data.accuracy) ? 100 : data.accuracy),
    consistency: Math.round(Number.isNaN(data.consistency) ? 100 : data.consistency),
    mistakes: Math.max(0, Math.round(Number.isNaN(data.mistakes) ? 0 : data.mistakes)),
    streak: Math.max(0, Math.round(Number.isNaN(data.streak) ? 0 : data.streak)),
    elapsedMs: Math.max(0, Math.round(data.elapsedMs || 0)),
    totalTyped: Math.max(0, Math.round(data.totalTyped || 0)),
    correctChars: Math.max(0, Math.round(data.correctChars || 0)),
    timeLimit: data.timeLimit || 30,
    mode: data.mode || "time",
    createdAt: data.createdAt || Date.now(),
  }

  if (typeof window !== "undefined") {
    try {
      const existing = getLocalHistory()
      // Avoid exact duplicates
      const isDuplicate = existing.some(
        (r) => r.createdAt === newRecord.createdAt && r.wpm === newRecord.wpm
      )
      if (!isDuplicate) {
        const updated = [newRecord, ...existing].slice(0, MAX_STORED_TESTS)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error("[user-stats] Failed to write local history:", err)
    }
  }

  return newRecord
}

/**
 * Clear local test history.
 */
export function clearLocalHistory(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error("[user-stats] Failed to clear local history:", err)
    }
  }
}

/**
 * Merge remote and local records without duplicates.
 */
export function mergeTestRecords(local: TestRecord[], remote: TestRecord[]): TestRecord[] {
  const map = new Map<string, TestRecord>()
  // Process remote first
  for (const r of remote) {
    map.set(r.id, r)
  }
  // Overlay local
  for (const l of local) {
    if (!map.has(l.id)) {
      // Check if another record has nearly identical timestamp and wpm
      const hasSimilar = Array.from(map.values()).some(
        (r) => Math.abs(r.createdAt - l.createdAt) < 3000 && r.wpm === l.wpm
      )
      if (!hasSimilar) {
        map.set(l.id, l)
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Calculate active daily practice streak (consecutive calendar days with >=1 test).
 */
export function calculateDailyStreak(records: TestRecord[]): number {
  if (!records || records.length === 0) return 0

  const daySet = new Set<string>()
  for (const r of records) {
    const d = new Date(r.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`
    daySet.add(key)
  }

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`

  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(yesterday.getDate()).padStart(2, "0")}`

  // Streak continues if typed today or yesterday
  const checkDate = daySet.has(todayKey) ? today : daySet.has(yesterdayKey) ? yesterday : null
  if (!checkDate) return 0

  let streak = 0
  const cur = new Date(checkDate)

  while (true) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
      cur.getDate()
    ).padStart(2, "0")}`
    if (daySet.has(key)) {
      streak++
      cur.setDate(cur.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculate count of tests completed today.
 */
export function countTestsToday(records: TestRecord[]): number {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return records.filter((r) => r.createdAt >= todayStart).length
}

/**
 * Calculate speed distribution histogram (bell curve).
 */
export function calculateSpeedBuckets(records: TestRecord[]): SpeedBucket[] {
  const buckets: SpeedBucket[] = [
    { label: "<40", min: 0, max: 39, count: 0, percentage: 0 },
    { label: "40-59", min: 40, max: 59, count: 0, percentage: 0 },
    { label: "60-79", min: 60, max: 79, count: 0, percentage: 0 },
    { label: "80-99", min: 80, max: 99, count: 0, percentage: 0 },
    { label: "100-119", min: 100, max: 119, count: 0, percentage: 0 },
    { label: "120-139", min: 120, max: 139, count: 0, percentage: 0 },
    { label: "140+", min: 140, max: 999, count: 0, percentage: 0 },
  ]

  if (records.length === 0) return buckets

  for (const r of records) {
    const wpm = r.wpm
    for (const b of buckets) {
      if (wpm >= b.min && wpm <= b.max) {
        b.count++
        break
      }
    }
  }

  const total = records.length
  for (const b of buckets) {
    b.percentage = total > 0 ? Math.round((b.count / total) * 100) : 0
  }

  return buckets
}

/**
 * Calculate mode-by-mode benchmark breakdown.
 */
export function calculateModeBreakdowns(records: TestRecord[]): ModeStatBreakdown[] {
  const definitions: { key: string; label: string; match: (r: TestRecord) => boolean }[] = [
    { key: "time-15", label: "15s Time", match: (r) => r.mode === "time" && r.timeLimit === 15 },
    { key: "time-30", label: "30s Time", match: (r) => r.mode === "time" && (r.timeLimit === 30 || !r.timeLimit) },
    { key: "time-60", label: "60s Time", match: (r) => r.mode === "time" && r.timeLimit === 60 },
    { key: "words", label: "Words", match: (r) => r.mode === "words" },
    { key: "quotes", label: "Quotes", match: (r) => r.mode === "quotes" },
    { key: "code", label: "Code", match: (r) => r.mode === "code" },
  ]

  return definitions.map(({ key, label, match }) => {
    const matched = records.filter(match)
    if (matched.length === 0) {
      return {
        mode: key,
        label,
        testsCount: 0,
        bestWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        avgConsistency: 0,
        totalTimeSeconds: 0,
      }
    }

    const bestWpm = Math.max(...matched.map((r) => r.wpm))
    const avgWpm = Math.round(matched.reduce((acc, r) => acc + r.wpm, 0) / matched.length)
    const avgAccuracy = Math.round(matched.reduce((acc, r) => acc + r.accuracy, 0) / matched.length)
    const avgConsistency = Math.round(matched.reduce((acc, r) => acc + r.consistency, 0) / matched.length)
    const totalTimeSeconds = Math.round(matched.reduce((acc, r) => acc + (r.elapsedMs || (r.timeLimit || 30) * 1000), 0) / 1000)

    return {
      mode: key,
      label,
      testsCount: matched.length,
      bestWpm,
      avgWpm,
      avgAccuracy,
      avgConsistency,
      totalTimeSeconds,
    }
  })
}

/**
 * Generate actionable diagnostic insights based on user test trends.
 */
export function generateDiagnosticInsights(
  records: TestRecord[],
  summary: Partial<UserStatsSummary>
): DiagnosticInsight[] {
  const insights: DiagnosticInsight[] = []

  if (records.length === 0) {
    insights.push({
      id: "get_started",
      type: "tip",
      title: "Begin Your Baseline Training",
      description: "Complete at least 3 typing tests to calibrate your speed curve, rhythm consistency, and precision baseline.",
    })
    return insights
  }

  const avgWpm = summary.avgWpm || 0
  const avgRaw = summary.avgRawWpm || 0
  const avgAcc = summary.avgAccuracy || 100
  const avgCons = summary.avgConsistency || 100
  const errorPenalty = Math.max(0, avgRaw - avgWpm)

  // 1. Error Penalty analysis
  if (errorPenalty >= 12 && avgAcc < 95) {
    insights.push({
      id: "error_penalty",
      type: "warning",
      title: "High Error Penalty Detected",
      description: `You are sacrificing approx. ${errorPenalty} WPM to correction backspaces. Slowing down by 5% will immediately increase your net speed.`,
      metric: `-${errorPenalty} WPM penalty`,
    })
  } else if (avgAcc >= 98 && records.length >= 3) {
    insights.push({
      id: "elite_precision",
      type: "positive",
      title: "Laser Precision Discipline",
      description: "Your accuracy exceeds 98%. Clean muscle memory prevents hesitation stalls and creates a stable foundation for raw speed bursts.",
      metric: `${avgAcc}% accuracy`,
    })
  }

  // 2. Rhythm & Consistency
  if (avgCons >= 80 && records.length >= 3) {
    insights.push({
      id: "steady_cadence",
      type: "positive",
      title: "Fluid Rhythm & Cadence",
      description: "Your keystroke interval variance is remarkably low. Uniform finger travel ensures less cognitive fatigue during prolonged tests.",
      metric: `${avgCons}% consistency`,
    })
  } else if (avgCons < 65 && records.length >= 3) {
    insights.push({
      id: "rhythm_variance",
      type: "tip",
      title: "Pacing Fluctuations",
      description: "Large speed fluctuations detected between word transitions. Focus on maintaining a smooth, steady metronome pace rather than rushing easy words.",
      metric: `${avgCons}% consistency`,
    })
  }

  // 3. Endurance vs Sprint (15s vs 60s)
  const time15 = records.filter((r) => r.mode === "time" && r.timeLimit === 15)
  const time60 = records.filter((r) => r.mode === "time" && r.timeLimit === 60)
  if (time15.length >= 2 && time60.length >= 2) {
    const avg15 = time15.reduce((a, b) => a + b.wpm, 0) / time15.length
    const avg60 = time60.reduce((a, b) => a + b.wpm, 0) / time60.length
    const drop = Math.round(avg15 - avg60)
    if (drop >= 14) {
      insights.push({
        id: "endurance_drop",
        type: "tip",
        title: "Sprint vs Endurance Fade",
        description: `Your 15s sprint speed (${Math.round(avg15)} WPM) drops by ${drop} WPM during 60s sessions. Incorporate longer 60s endurance drills to build stamina.`,
        metric: `-${drop} WPM over 60s`,
      })
    }
  }

  // 4. Milestone & Practice Volume
  if (records.length >= 25) {
    insights.push({
      id: "dedicated_practitioner",
      type: "positive",
      title: "Consistent Training Habit",
      description: `Over ${records.length} sessions logged. High sample volume confirms reliable personal best and median speed baselines.`,
      metric: `${records.length} tests logged`,
    })
  }

  return insights
}

/**
 * Filter records by timeframe and mode.
 */
export function filterTestRecords(
  records: TestRecord[],
  timeframe: "all" | "30d" | "7d" | "today" = "all",
  modeFilter: string = "all"
): TestRecord[] {
  const now = Date.now()
  const oneDay = 86400000

  return records.filter((r) => {
    // Timeframe filter
    if (timeframe === "today") {
      const todayStart = new Date().setHours(0, 0, 0, 0)
      if (r.createdAt < todayStart) return false
    } else if (timeframe === "7d") {
      if (now - r.createdAt > 7 * oneDay) return false
    } else if (timeframe === "30d") {
      if (now - r.createdAt > 30 * oneDay) return false
    }

    // Mode filter
    if (modeFilter !== "all") {
      if (modeFilter.startsWith("time-")) {
        const targetLimit = Number(modeFilter.replace("time-", ""))
        if (r.mode !== "time" || r.timeLimit !== targetLimit) return false
      } else {
        if (r.mode !== modeFilter) return false
      }
    }

    return true
  })
}

/**
 * Compute the full UserStatsSummary from a list of records.
 */
export function computeUserStatsSummary(
  allRecords: TestRecord[],
  timeframe: "all" | "30d" | "7d" | "today" = "all",
  modeFilter: string = "all"
): UserStatsSummary {
  const filtered = filterTestRecords(allRecords, timeframe, modeFilter)

  if (filtered.length === 0) {
    return {
      totalTests: 0,
      totalTimeSeconds: 0,
      totalTypedChars: 0,
      totalWords: 0,
      totalMistakes: 0,
      avgWpm: 0,
      bestWpm: 0,
      avgRawWpm: 0,
      bestRawWpm: 0,
      avgAccuracy: 0,
      bestAccuracy: 0,
      avgConsistency: 0,
      currentDailyStreak: calculateDailyStreak(allRecords),
      testsToday: countTestsToday(allRecords),
      highAccuracyRatio: 0,
      speedImprovementRate: 0,
      speedBuckets: calculateSpeedBuckets([]),
      modeBreakdowns: calculateModeBreakdowns([]),
      insights: generateDiagnosticInsights([], {}),
      recentTests: [],
    }
  }

  const totalTests = filtered.length
  const wpms = filtered.map((r) => r.wpm)
  const rawWpms = filtered.map((r) => r.rawWpm || r.wpm)
  const accuracies = filtered.map((r) => r.accuracy)
  const consistencies = filtered.map((r) => r.consistency)

  const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / totalTests)
  const bestWpm = Math.max(...wpms)
  const avgRawWpm = Math.round(rawWpms.reduce((a, b) => a + b, 0) / totalTests)
  const bestRawWpm = Math.max(...rawWpms)
  const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / totalTests)
  const bestAccuracy = Math.max(...accuracies)
  const avgConsistency = Math.round(consistencies.reduce((a, b) => a + b, 0) / totalTests)

  const totalTimeSeconds = Math.round(
    filtered.reduce((acc, r) => acc + (r.elapsedMs || (r.timeLimit || 30) * 1000), 0) / 1000
  )
  const totalTypedChars = filtered.reduce((acc, r) => acc + (r.totalTyped || Math.round((r.wpm * (r.elapsedMs || 30000) * 5) / 60000)), 0)
  const totalWords = Math.round(totalTypedChars / 5)
  const totalMistakes = filtered.reduce((acc, r) => acc + (r.mistakes || 0), 0)

  const highAccuracyCount = filtered.filter((r) => r.accuracy >= 98).length
  const highAccuracyRatio = Math.round((highAccuracyCount / totalTests) * 100)

  // Improvement rate: compare earliest 5 tests to latest 5 tests
  let speedImprovementRate = 0
  if (allRecords.length >= 10) {
    const sortedChrono = [...allRecords].sort((a, b) => a.createdAt - b.createdAt)
    const early = sortedChrono.slice(0, 5)
    const late = sortedChrono.slice(-5)
    const earlyAvg = early.reduce((a, b) => a + b.wpm, 0) / early.length
    const lateAvg = late.reduce((a, b) => a + b.wpm, 0) / late.length
    if (earlyAvg > 0) {
      speedImprovementRate = Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100)
    }
  }

  const speedBuckets = calculateSpeedBuckets(filtered)
  const modeBreakdowns = calculateModeBreakdowns(filtered)

  const partialSummary = {
    avgWpm,
    bestWpm,
    avgRawWpm,
    avgAccuracy,
    avgConsistency,
  }
  const insights = generateDiagnosticInsights(filtered, partialSummary)

  return {
    totalTests,
    totalTimeSeconds,
    totalTypedChars,
    totalWords,
    totalMistakes,
    avgWpm,
    bestWpm,
    avgRawWpm,
    bestRawWpm,
    avgAccuracy,
    bestAccuracy,
    avgConsistency,
    currentDailyStreak: calculateDailyStreak(allRecords),
    testsToday: countTestsToday(allRecords),
    highAccuracyRatio,
    speedImprovementRate,
    speedBuckets,
    modeBreakdowns,
    insights,
    recentTests: filtered.slice(0, 50),
  }
}

/**
 * Format total practice time into a clean human string (e.g. "2h 45m" or "42s").
 */
export function formatPracticeTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

/**
 * Export test records as CSV format.
 */
export function exportHistoryAsCsv(records: TestRecord[]): string {
  const headers = [
    "ID",
    "Date",
    "Mode",
    "TimeLimit",
    "NetWPM",
    "RawWPM",
    "Accuracy",
    "Consistency",
    "Mistakes",
    "TotalTyped",
    "ElapsedMs",
  ]
  const rows = records.map((r) => [
    r.id,
    new Date(r.createdAt).toISOString(),
    r.mode,
    r.timeLimit,
    r.wpm,
    r.rawWpm,
    r.accuracy,
    r.consistency,
    r.mistakes,
    r.totalTyped,
    r.elapsedMs,
  ])
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

/**
 * Export test records as formatted JSON string.
 */
export function exportHistoryAsJson(records: TestRecord[]): string {
  return JSON.stringify(records, null, 2)
}
