import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth-crypto";


const JWT_SECRET = (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) || "thock-super-secret-key-1337-clack-thock";

// GET: Fetch preferences for the logged-in user
export async function GET(request: Request) {
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
      return NextResponse.json({ preferences: null });
    }

    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ preferences: null });
    }

    const rows = await db.query(
      "SELECT settings_json FROM preferences WHERE user_id = ?",
      [payload.id]
    );

    if (rows && rows.length > 0) {
      const parsed = JSON.parse(rows[0].settings_json);
      return NextResponse.json({ preferences: parsed });
    }

    return NextResponse.json({ preferences: null });
  } catch (err: any) {
    console.error("[preferences-get] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Save/Upsert preferences for the logged-in user
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { preferences } = await request.json();
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Invalid preferences object" }, { status: 400 });
    }

    const settingsJson = JSON.stringify(preferences);
    const updatedAt = Date.now();

    await db.execute(
      `INSERT INTO preferences (user_id, settings_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at`,
      [payload.id, settingsJson, updatedAt]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[preferences-post] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
