import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-crypto";

export const runtime = "edge";

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
    
    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
      }
    });
  } catch (err: any) {
    console.error("[me] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
