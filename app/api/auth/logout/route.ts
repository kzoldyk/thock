import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear cookie by setting expiration to epoch
    response.headers.set(
      "Set-Cookie",
      "thock_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    );
    
    return response;
  } catch (err: any) {
    console.error("[logout] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
