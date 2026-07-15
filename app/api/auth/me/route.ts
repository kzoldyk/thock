import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth-crypto";

export const runtime = "edge";

const JWT_SECRET = process.env.JWT_SECRET || "thock-super-secret-key-1337-clack-thock";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("thock_session")?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    const payload = await verifyJwt(token, JWT_SECRET);
    if (!payload) {
      // Clear invalid cookie
      cookieStore.delete("thock_session");
      return NextResponse.json({ user: null });
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
