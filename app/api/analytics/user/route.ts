import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildGripProfile, createDefaultLetterStat, type LetterStat, ALPHABET } from "@/lib/letter-grip"

const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || "1501"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const authHeader =
      request.headers.get("x-analytics-password") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    const queryPass = url.searchParams.get("password")
    const providedPassword = authHeader || queryPass

    if (providedPassword !== ANALYTICS_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing analytics password" },
        { status: 401 }
      )
    }

    const userId = url.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // 1. Fetch User Record
    const userRows = await db.query(
      `SELECT id, username, is_guest, created_at FROM users WHERE id = ?`,
      [userId]
    )

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = {
      id: userRows[0].id,
      username: userRows[0].username,
      isGuest: Boolean(userRows[0].is_guest),
      createdAt: Number(userRows[0].created_at),
    }

    // 2. Fetch User Devices & Network Details
    const deviceRows = await db.query(
      `SELECT device_id, visit_count, last_visited_at, created_at, 
              ip_address, user_agent, os, browser, device_type, country 
       FROM unique_devices 
       WHERE user_id = ?
       ORDER BY last_visited_at DESC`,
      [userId]
    )

    const devices = (deviceRows || []).map((d: any) => ({
      deviceId: d.device_id,
      visitCount: Number(d.visit_count) || 1,
      lastVisitedAt: Number(d.last_visited_at),
      createdAt: Number(d.created_at),
      ipAddress: d.ip_address || "N/A",
      userAgent: d.user_agent || "N/A",
      os: d.os || "Unknown",
      browser: d.browser || "Unknown",
      deviceType: d.device_type || "desktop",
      country: d.country || "Unknown",
    }))

    const totalVisits = devices.reduce((sum: number, d: any) => sum + d.visitCount, 0)
    const latestDevice = devices[0] || null
    const lastVisitedAt = latestDevice ? latestDevice.lastVisitedAt : user.createdAt
    const isOnline = Date.now() - lastVisitedAt <= 5 * 60 * 1000

    // 3. Fetch Typing Scores
    const scoreRows = await db.query(
      `SELECT id, wpm, raw_wpm, accuracy, consistency, time_limit, mode, created_at, mistakes, total_typed, elapsed_ms
       FROM scores
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    )

    const scores = (scoreRows || []).map((s: any) => ({
      id: s.id,
      wpm: Number(s.wpm) || 0,
      rawWpm: Number(s.raw_wpm ?? s.wpm) || Number(s.wpm) || 0,
      accuracy: Number(s.accuracy) || 100,
      consistency: Number(s.consistency) || 100,
      mistakes: Number(s.mistakes) || 0,
      totalTyped: Number(s.total_typed) || 0,
      elapsedMs: Number(s.elapsed_ms) || (Number(s.time_limit) ? Number(s.time_limit) * 1000 : 30000),
      timeLimit: Number(s.time_limit) || 30,
      mode: s.mode || "time",
      createdAt: Number(s.created_at) || Date.now(),
    }))

    // Calculate Typing Metrics
    const totalTests = scores.length
    const maxWpm = totalTests > 0 ? Math.max(...scores.map((s) => s.wpm)) : 0
    const avgWpm = totalTests > 0 ? Math.round(scores.reduce((a, b) => a + b.wpm, 0) / totalTests) : 0
    const avgAccuracy = totalTests > 0 ? Math.round(scores.reduce((a, b) => a + b.accuracy, 0) / totalTests) : 100
    const avgConsistency = totalTests > 0 ? Math.round(scores.reduce((a, b) => a + b.consistency, 0) / totalTests) : 100
    const totalPracticeTimeMs = scores.reduce((sum, s) => sum + s.elapsedMs, 0)
    const totalMistakes = scores.reduce((sum, s) => sum + s.mistakes, 0)
    const totalTypedChars = scores.reduce((sum, s) => sum + s.totalTyped, 0)

    // 4. Fetch Letter-Wise Mastery & Grip Stats
    const letterRows = await db.query(
      `SELECT char, total_typed, correct_count, error_count, total_latency_ms, avg_latency_ms, accuracy, grip_score, updated_at
       FROM user_letter_stats
       WHERE user_id = ?
       ORDER BY grip_score ASC`,
      [userId]
    )

    const letterMap: Record<string, LetterStat> = {}
    for (const r of letterRows || []) {
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

    const gripProfile = buildGripProfile(letterMap)

    return NextResponse.json({
      user,
      activity: {
        totalVisits: Math.max(1, totalVisits),
        lastVisitedAt,
        isOnline,
        primaryIp: latestDevice?.ipAddress || "N/A",
        country: latestDevice?.country || "Unknown",
        os: latestDevice?.os || "Unknown",
        browser: latestDevice?.browser || "Unknown",
        deviceType: latestDevice?.deviceType || "desktop",
        userAgent: latestDevice?.userAgent || "N/A",
        devices,
      },
      statsSummary: {
        totalTests,
        maxWpm,
        avgWpm,
        avgAccuracy,
        avgConsistency,
        totalPracticeTimeMs,
        totalMistakes,
        totalTypedChars,
      },
      scores,
      gripProfile,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[api/analytics/user] error:", err)
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    )
  }
}
