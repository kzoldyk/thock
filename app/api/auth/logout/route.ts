import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("thock_session");
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[logout] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
