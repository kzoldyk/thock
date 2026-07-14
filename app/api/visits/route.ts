import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isLocal = searchParams.get("local") === "true";
  
  // Note: visits endpoint requires trailing slash, visits/up does not
  const url = isLocal 
    ? "https://api.counterapi.dev/v1/thock-typing/visits/" 
    : "https://api.counterapi.dev/v1/thock-typing/visits/up";

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch counter" }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json({ count: data.count });
  } catch (err) {
    console.error("[api-visits] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
