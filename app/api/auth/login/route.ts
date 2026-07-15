import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, signJwt } from "@/lib/auth-crypto";

export const runtime = "edge";

const JWT_SECRET = process.env.JWT_SECRET || "thock-super-secret-key-1337-clack-thock";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    
    const cleanUsername = username.trim().toLowerCase();
    
    // Look up the user
    const users = await db.query("SELECT * FROM users WHERE username = ?", [cleanUsername]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    
    const user = users[0];
    
    // Compare password hash
    const inputHash = await hashPassword(password, user.salt);
    if (inputHash !== user.password_hash) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    
    // Create session token (expires in 30 days)
    const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const token = await signJwt({ id: user.id, username: user.username, exp }, JWT_SECRET);
    
    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("thock_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
      }
    });
  } catch (err: any) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
