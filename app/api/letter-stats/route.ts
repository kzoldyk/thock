import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyJwt } from "@/lib/auth-crypto"
import {
  buildGripProfile,
  computeGripScore,
  createDefaultLetterStat,
  type LetterStat,
} from "@/lib/letter-grip"

const JWT_SECRET =
  (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) ||
  "thock-super-secret-key-1337-clack-thock"

// GET: Retrieve authenticated user's letter grip profile
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || ""
    let token: string | null = null
    const cookiesList = cookieHeader.split(";")
    for (const cookie of cookiesList) {
      const [key, val] = cookie.trim().split("=")
      if (key === "thock_session") {
        token = val
        break
      }
    }

    if (!token) {
      return NextResponse.json({ profile: null, user: null })
    }

    const payload = await verifyJwt(token, JWT_SECRET)
    if (!payload) {
      return NextResponse.json({ profile: null, user: null })
    }

    const rows = await db.query(
      `SELECT char, total_typed, correct_count, error_count, total_latency_ms, avg_latency_ms, accuracy, grip_score, updated_at
       FROM user_letter_stats
       WHERE user_id = ?
       ORDER BY grip_score ASC`,
      [payload.id]
    )

    const letterMap: Record<string, LetterStat> = {}
    for (const r of rows || []) {
      letterMap[r.char] = {
        char: r.char,
        totalTyped: Number(r.total_typed) || 0,
        correctCount: Number(r.correct_count) || 0,
        errorCount: Number(r.error_count) || 0,
        totalLatencyMs: Number(r.total_latency_ms) || 0,
        avgLatencyMs: Number(r.avg_latency_ms) || 180,
        accuracy: Number(r.accuracy) || 100,
        gripScore: Number(r.grip_score) || 100,
        updatedAt: Number(r.updated_at) || Date.now(),
      }
    }

    const profile = buildGripProfile(letterMap)

    return NextResponse.json({
      profile,
      user: {
        id: payload.id,
        username: payload.username,
      },
    })
  } catch (err: any) {
    console.error("[api/letter-stats GET] error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

// POST: Save/Merge session letter stats delta
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || ""
    let token: string | null = null
    const cookiesList = cookieHeader.split(";")
    for (const cookie of cookiesList) {
      const [key, val] = cookie.trim().split("=")
      if (key === "thock_session") {
        token = val
        break
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Guest session - local only" })
    }

    const payload = await verifyJwt(token, JWT_SECRET)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid session" })
    }

    const body = await request.json()
    const { letterDeltas } = body as {
      letterDeltas?: Array<{
        char: string
        totalTyped: number
        correctCount: number
        errorCount: number
        totalLatencyMs: number
      }>
    }

    if (!letterDeltas || !Array.isArray(letterDeltas) || letterDeltas.length === 0) {
      return NextResponse.json({ success: true, updatedCount: 0 })
    }

    // Fetch existing records for user to accurately merge
    const existingRows = await db.query(
      `SELECT char, total_typed, correct_count, error_count, total_latency_ms
       FROM user_letter_stats
       WHERE user_id = ?`,
      [payload.id]
    )

    const existingMap = new Map<string, any>()
    for (const row of existingRows || []) {
      existingMap.set(row.char, row)
    }

    const now = Date.now()

    for (const delta of letterDeltas) {
      const char = delta.char.toLowerCase()
      if (!/^[a-z0-9]$/.test(char)) continue

      const existing = existingMap.get(char) || {
        total_typed: 0,
        correct_count: 0,
        error_count: 0,
        total_latency_ms: 0,
      }

      const newTotal = (Number(existing.total_typed) || 0) + (Number(delta.totalTyped) || 0)
      const newCorrect = (Number(existing.correct_count) || 0) + (Number(delta.correctCount) || 0)
      const newError = (Number(existing.error_count) || 0) + (Number(delta.errorCount) || 0)
      const newLatency = (Number(existing.total_latency_ms) || 0) + (Number(delta.totalLatencyMs) || 0)

      const newAvgLatency = newTotal > 0 ? Math.round(newLatency / newTotal) : 180
      const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100
      const newGrip = computeGripScore(newTotal, newCorrect, newAvgLatency)

      await db.execute(
        `INSERT OR REPLACE INTO user_letter_stats (
          user_id, char, total_typed, correct_count, error_count, total_latency_ms, avg_latency_ms, accuracy, grip_score, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.id,
          char,
          newTotal,
          newCorrect,
          newError,
          newLatency,
          newAvgLatency,
          newAccuracy,
          newGrip,
          now,
        ]
      )
    }

    return NextResponse.json({ success: true, updatedCount: letterDeltas.length })
  } catch (err: any) {
    console.error("[api/letter-stats POST] error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
