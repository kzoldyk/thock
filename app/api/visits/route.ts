import { NextResponse, userAgent } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const isLocal = searchParams.get("local") === "true";
  
  // Note: visits endpoint requires trailing slash, visits/up does not
  const url = isLocal 
    ? "https://api.counterapi.dev/v1/thock-typing/visits/" 
    : "https://api.counterapi.dev/v1/thock-typing/visits/up";

  let totalCount = 0;
  let uniqueCount = 0;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      totalCount = data.count;
    }
  } catch (err) {
    console.error("[api-visits] error fetching counterapi:", err);
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.deviceId) {
      const now = Date.now();
      
      const { os, browser, device } = userAgent(request);
      const rawUserAgent = request.headers.get("user-agent") || "";
      const ipAddress = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
      const country = request.headers.get("cf-ipcountry") || "";
      
      const osName = os.name || "unknown";
      const browserName = browser.name || "unknown";
      const deviceType = device.type || "desktop";

      await db.execute(`
        INSERT INTO unique_devices (
          device_id, visit_count, last_visited_at, created_at,
          ip_address, user_agent, os, browser, device_type, country
        )
        VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(device_id) DO UPDATE SET
          visit_count = visit_count + 1,
          last_visited_at = excluded.last_visited_at,
          ip_address = excluded.ip_address,
          user_agent = excluded.user_agent,
          os = excluded.os,
          browser = excluded.browser,
          device_type = excluded.device_type,
          country = excluded.country
      `, [
        body.deviceId, now, now,
        ipAddress, rawUserAgent, osName, browserName, deviceType, country
      ]);
    }
    
    // Get unique device count
    const result = await db.query<{ count: number }>("SELECT COUNT(*) as count FROM unique_devices");
    if (result && result.length > 0) {
      uniqueCount = result[0].count;
    }
  } catch (err) {
    console.error("[api-visits] error with DB:", err);
  }

  return NextResponse.json({ count: totalCount, uniqueCount });
}
