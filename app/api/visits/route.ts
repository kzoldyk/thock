import { NextResponse, userAgent } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const BASE_VISITS = 1000;
  const BASE_ONLINE = 4;
  const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  let totalCount = BASE_VISITS;
  let onlineCount = BASE_ONLINE;

  try {
    const body = await request.json().catch(() => ({}));
    const now = Date.now();

    if (body.deviceId) {
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
    
    // 1. Get total visits from database (offset with +1000)
    const visitsResult = await db.query<{ total: number }>(
      "SELECT COALESCE(SUM(visit_count), 0) as total FROM unique_devices"
    );
    const actualVisits = visitsResult && visitsResult.length > 0 ? (visitsResult[0].total || 0) : 0;
    totalCount = BASE_VISITS + actualVisits;

    // 2. Get online users (active in the last 5 minutes, offset with +4)
    const onlineCutoff = now - ONLINE_WINDOW_MS;
    const onlineResult = await db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM unique_devices WHERE last_visited_at >= ?",
      [onlineCutoff]
    );
    const actualOnline = onlineResult && onlineResult.length > 0 ? (onlineResult[0].count || 0) : 0;
    onlineCount = BASE_ONLINE + actualOnline;
  } catch (err) {
    console.error("[api-visits] error with DB:", err);
  }

  return NextResponse.json({ count: totalCount, onlineCount });
}

