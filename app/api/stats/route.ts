import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth-crypto";
import type { TestRecord } from "@/types";

const JWT_SECRET = (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) || "thock-super-secret-key-1337-clack-thock";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || "100")));

    const cookieHeader = request.headers.get("cookie") || "";
    let token = null;
    const cookiesList = cookieHeader.split(";");
    for (const cookie of cookiesList) {
      const [key, val] = cookie.trim().split("=");
      if (key === "thock_session") {
        token = val;
        break;
      }
    }

    if (!token) {
      return NextResponse.json({ scores: [], user: null });
    }

    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ scores: [], user: null });
    }

    // Query scores for this specific user
    const rows = await db.query(
      `SELECT id, wpm, accuracy, consistency, time_limit, mode, created_at, raw_wpm, mistakes, total_typed, elapsed_ms
       FROM scores
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [payload.id, limit]
    );

    const scores: TestRecord[] = (rows || []).map((r: any) => ({
      id: r.id,
      wpm: Number(r.wpm) || 0,
      rawWpm: Number(r.raw_wpm ?? r.wpm) || Number(r.wpm) || 0,
      accuracy: Number(r.accuracy) || 100,
      consistency: Number(r.consistency) || 100,
      mistakes: Number(r.mistakes) || 0,
      streak: 0,
      elapsedMs: Number(r.elapsed_ms) || (Number(r.time_limit) ? Number(r.time_limit) * 1000 : 30000),
      totalTyped: Number(r.total_typed) || Math.round(((Number(r.wpm) || 0) * (Number(r.time_limit) || 30) * 5) / 60),
      correctChars: Math.round(((Number(r.wpm) || 0) * (Number(r.time_limit) || 30) * 5) / 60),
      timeLimit: Number(r.time_limit) || 30,
      mode: (r.mode as any) || "time",
      createdAt: Number(r.created_at) || Date.now(),
    }));

    return NextResponse.json({
      scores,
      user: {
        id: payload.id,
        username: payload.username,
      },
    });
  } catch (err: any) {
    console.error("[api/stats] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
