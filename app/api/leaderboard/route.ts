import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth-crypto";


const JWT_SECRET = (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) || "thock-super-secret-key-1337-clack-thock";

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
      return NextResponse.json({ error: "Unauthorized. Please sign in to submit scores." }, { status: 401 });
    }

    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      const response = NextResponse.json({ error: "Invalid session. Please sign in again." }, { status: 401 });
      response.headers.set(
        "Set-Cookie",
        "thock_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
      );
      return response;
    }

    // Verify user exists in database
    const users = await db.query("SELECT id FROM users WHERE id = ?", [payload.id]);
    if (!users || users.length === 0) {
      const response = NextResponse.json({ error: "User session invalid. Please sign in again." }, { status: 401 });
      response.headers.set(
        "Set-Cookie",
        "thock_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
      );
      return response;
    }

    const body = await request.json();
    const rawWpm = Number(body.wpm);
    const rawAccuracy = Number(body.accuracy);
    const rawConsistency = Number(body.consistency);
    const rawTimeLimit = Number(body.timeLimit);
    const rawMode = String(body.mode || "time");

    // Normalizations & Range Bounds
    const wpm = !isNaN(rawWpm) ? Math.max(0, Math.min(350, Math.round(rawWpm))) : 0;
    const accuracy = !isNaN(rawAccuracy) ? Math.max(0, Math.min(100, Math.round(rawAccuracy))) : 100;
    const consistency = !isNaN(rawConsistency) ? Math.max(0, Math.min(100, Math.round(rawConsistency))) : 100;
    const timeLimit = !isNaN(rawTimeLimit) && rawTimeLimit > 0 ? Math.round(rawTimeLimit) : 30;
    const mode = rawMode;

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
