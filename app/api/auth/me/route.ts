import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth-crypto";


const JWT_SECRET = (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : undefined) || "thock-super-secret-key-1337-clack-thock";

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
      return NextResponse.json({ user: null });
    }
    
    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      // Clear invalid cookie directly in response headers
      const response = NextResponse.json({ user: null });
      response.headers.set(
        "Set-Cookie",
        "thock_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
      );
      return response;
    }
    
    // Verify user exists in database
    const users = await db.query("SELECT id, username FROM users WHERE id = ?", [payload.id]);
    if (!users || users.length === 0) {
      const response = NextResponse.json({ user: null });
      response.headers.set(
        "Set-Cookie",
        "thock_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
      );
      return response;
    }
    
    return NextResponse.json({
      user: {
        id: users[0].id,
        username: users[0].username,
      }
    });
  } catch (err: any) {
    console.error("[me] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
