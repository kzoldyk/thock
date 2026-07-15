import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSalt, hashPassword, signJwt } from "@/lib/auth-crypto";

export const runtime = "edge";

const JWT_SECRET = (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) || "thock-super-secret-key-1337-clack-thock";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    
    // Check if user exists
    const existing = await db.query("SELECT * FROM users WHERE username = ?", [cleanUsername]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }
    
    const userId = crypto.randomUUID();
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const createdAt = Date.now();
    
    await db.execute(
      "INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
      [userId, cleanUsername, passwordHash, salt, createdAt]
    );
    
    // Create session token (expires in 30 days)
    const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const token = await signJwt({ id: userId, username: cleanUsername, exp }, JWT_SECRET);
    
    // Create response and set cookie directly via Set-Cookie headers
    const response = NextResponse.json({
      user: {
        id: userId,
        username: cleanUsername,
      }
    });

    const isProd = typeof process !== "undefined" && process.env ? process.env.NODE_ENV === "production" : false;
    response.headers.set(
      "Set-Cookie",
      `thock_session=${token}; HttpOnly; Secure=${isProd ? "true" : "false"}; SameSite=Lax; Path=/; Max-Age=2592000`
    );
    
    return response;
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
