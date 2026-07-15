import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth-crypto";

export const runtime = "edge";

const JWT_SECRET = process.env.JWT_SECRET || "thock-super-secret-key-1337-clack-thock";

// GET: Retrieve the top scores and optionally the current user's rank/best
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeLimit = Number(searchParams.get("timeLimit") || "30");
    const mode = searchParams.get("mode") || "time";
    const limit = Number(searchParams.get("limit") || "50");

    // Fetch leaderboard scores
    const scores = await db.query(
      `SELECT scores.id, scores.user_id, scores.wpm, scores.accuracy, scores.consistency, scores.time_limit, scores.mode, scores.created_at, users.username
       FROM scores
       JOIN users ON scores.user_id = users.id
       WHERE scores.time_limit = ? AND scores.mode = ?
       ORDER BY scores.wpm DESC, scores.accuracy DESC
       LIMIT ?`,
      [timeLimit, mode, limit]
    );

    // Retrieve current user details if session token is valid
    const cookieStore = await cookies();
    const token = cookieStore.get("thock_session")?.value;
    let userBest = null;

    if (token) {
      const payload = await verifyJwt(token, JWT_SECRET);
      if (payload) {
        // Fetch personal best for this specific mode/timeLimit
        const pbQuery = await db.query(
          `SELECT wpm, accuracy, consistency
           FROM scores
           WHERE user_id = ? AND time_limit = ? AND mode = ?
           ORDER BY wpm DESC, accuracy DESC
           LIMIT 1`,
          [payload.id, timeLimit, mode]
        );

        if (pbQuery && pbQuery.length > 0) {
          const pb = pbQuery[0];
          // Get rank count (how many users have a better high score than this user)
          // We count unique users with better scores to find ranking position
          const rankQuery = await db.query(
            `SELECT COUNT(*) as rank_above
             FROM (
               SELECT user_id, MAX(wpm) as max_wpm
               FROM scores
               WHERE time_limit = ? AND mode = ?
               GROUP BY user_id
             )
             WHERE max_wpm > ?`,
            [timeLimit, mode, pb.wpm]
          );
          
          const rankAbove = rankQuery && rankQuery.length > 0 ? Number(rankQuery[0].rank_above || 0) : 0;
          userBest = {
            wpm: pb.wpm,
            accuracy: pb.accuracy,
            consistency: pb.consistency,
            rank: rankAbove + 1
          };
        }
      }
    }

    return NextResponse.json({ scores, userBest });
  } catch (err: any) {
    console.error("[leaderboard-get] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Save a new score run to the database
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("thock_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to submit scores." }, { status: 401 });
    }

    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session. Please sign in again." }, { status: 401 });
    }

    const { wpm, accuracy, consistency, timeLimit, mode } = await request.json();

    // Validations
    if (typeof wpm !== "number" || wpm < 0 || wpm > 350) {
      return NextResponse.json({ error: "Invalid WPM score" }, { status: 400 });
    }
    if (typeof accuracy !== "number" || accuracy < 0 || accuracy > 100) {
      return NextResponse.json({ error: "Invalid accuracy score" }, { status: 400 });
    }
    if (typeof consistency !== "number" || consistency < 0 || consistency > 100) {
      return NextResponse.json({ error: "Invalid consistency score" }, { status: 400 });
    }
    if (typeof timeLimit !== "number" || timeLimit <= 0) {
      return NextResponse.json({ error: "Invalid time limit" }, { status: 400 });
    }
    if (typeof mode !== "string" || !mode) {
      return NextResponse.json({ error: "Invalid game mode" }, { status: 400 });
    }

    const scoreId = crypto.randomUUID();
    const createdAt = Date.now();

    await db.execute(
      `INSERT INTO scores (id, user_id, wpm, accuracy, consistency, time_limit, mode, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [scoreId, payload.id, wpm, accuracy, consistency, timeLimit, mode, createdAt]
    );

    return NextResponse.json({
      success: true,
      score: {
        id: scoreId,
        wpm,
        accuracy,
        consistency,
        timeLimit,
        mode,
        createdAt
      }
    });
  } catch (err: any) {
    console.error("[leaderboard-post] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
