import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all unique devices from the database
    const devices = await db.query(`
      SELECT device_id, visit_count, last_visited_at, created_at, 
             ip_address, user_agent, os, browser, device_type, country 
      FROM unique_devices 
      ORDER BY last_visited_at DESC
    `);

    if (!devices || devices.length === 0) {
      return NextResponse.json({
        summary: {
          totalVisitors: 0,
          totalVisits: 0,
          avgVisits: 0,
          returnRate: 0,
        },
        dailyTrend: [],
        distributions: {
          os: [],
          browser: [],
          deviceType: [],
          country: [],
        },
        recentSessions: [],
        visitedUsers: [],
      });
    }

    const totalVisitors = devices.length;
    let totalVisits = 0;
    let returningVisitors = 0;

    const osCount: Record<string, number> = {};
    const browserCount: Record<string, number> = {};
    const deviceTypeCount: Record<string, number> = {};
    const countryCount: Record<string, number> = {};

    for (const d of devices) {
      totalVisits += d.visit_count || 1;
      if ((d.visit_count || 1) > 1) {
        returningVisitors++;
      }

      // OS count
      const os = d.os || "Unknown";
      osCount[os] = (osCount[os] || 0) + 1;

      // Browser count
      const browser = d.browser || "Unknown";
      browserCount[browser] = (browserCount[browser] || 0) + 1;

      // Device Type count
      const deviceType = d.device_type || "desktop";
      deviceTypeCount[deviceType] = (deviceTypeCount[deviceType] || 0) + 1;

      // Country count
      const country = d.country || "Unknown";
      countryCount[country] = (countryCount[country] || 0) + 1;
    }

    const avgVisits = Number((totalVisits / totalVisitors).toFixed(1));
    const returnRate = Number(((returningVisitors / totalVisitors) * 100).toFixed(1));

    // Formulate daily trend data for the last 30 days
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyData: Record<string, { date: string; visits: number; visitors: number }> = {};
    const now = Date.now();

    // Pre-populate last 30 days in order
    for (let i = 29; i >= 0; i--) {
      const dateStr = new Date(now - i * dayMs).toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, visits: 0, visitors: 0 };
    }

    for (const d of devices) {
      const createdDate = new Date(d.created_at).toISOString().split('T')[0];
      const lastVisitedDate = new Date(d.last_visited_at).toISOString().split('T')[0];

      // Add to new visitors
      if (dailyData[createdDate]) {
        dailyData[createdDate].visitors += 1;
      }

      // Distribute visits
      if (d.visit_count === 1) {
        if (dailyData[createdDate]) {
          dailyData[createdDate].visits += 1;
        }
      } else {
        // First visit at creation
        if (dailyData[createdDate]) {
          dailyData[createdDate].visits += 1;
        }
        // Last visit at last_visited_at
        if (dailyData[lastVisitedDate]) {
          dailyData[lastVisitedDate].visits += 1;
          if (lastVisitedDate !== createdDate) {
            dailyData[lastVisitedDate].visitors += 1; // Mark active on return day too
          }
        }

        // Distribute middle visits
        const middleVisits = d.visit_count - 2;
        if (middleVisits > 0) {
          const diffDays = Math.floor((d.last_visited_at - d.created_at) / dayMs);
          if (diffDays > 0) {
            for (let v = 0; v < middleVisits; v++) {
              const randOffset = Math.floor(Math.random() * (diffDays + 1));
              const visitTime = d.created_at + randOffset * dayMs;
              const visitDateStr = new Date(visitTime).toISOString().split('T')[0];
              if (dailyData[visitDateStr]) {
                dailyData[visitDateStr].visits += 1;
              }
            }
          } else {
            if (dailyData[createdDate]) {
              dailyData[createdDate].visits += middleVisits;
            }
          }
        }
      }
    }

    const dailyTrend = Object.values(dailyData);

    // Convert distributions to sorted arrays
    const mapToPercentArray = (counts: Record<string, number>, total: number) => {
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Number(((count / total) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count);
    };

    const distributions = {
      os: mapToPercentArray(osCount, totalVisitors),
      browser: mapToPercentArray(browserCount, totalVisitors),
      deviceType: mapToPercentArray(deviceTypeCount, totalVisitors),
      country: mapToPercentArray(countryCount, totalVisitors),
    };

    // Format recent sessions (anonymizing IPs)
    const recentSessions = devices.map((d) => {
      let anonymizedIp = "N/A";
      if (d.ip_address) {
        if (d.ip_address.includes(".")) {
          // IPv4
          const parts = d.ip_address.split(".");
          if (parts.length === 4) {
            anonymizedIp = `${parts[0]}.${parts[1]}.xxx.xxx`;
          }
        } else if (d.ip_address.includes(":")) {
          // IPv6
          const parts = d.ip_address.split(":");
          if (parts.length > 2) {
            anonymizedIp = `${parts[0]}:${parts[1]}:xxxx:xxxx::xxxx`;
          }
        }
      }

      return {
        deviceId: d.device_id,
        visitCount: d.visit_count || 1,
        lastVisitedAt: d.last_visited_at,
        createdAt: d.created_at,
        ipAddress: anonymizedIp,
        os: d.os || "Unknown",
        browser: d.browser || "Unknown",
        deviceType: d.device_type || "desktop",
        country: d.country || "Unknown",
      };
    });

    const dbUsers = await db.query(`
      SELECT 
        u.id as user_id, 
        u.username, 
        u.is_guest, 
        u.created_at,
        COALESCE(MAX(d.last_visited_at), u.created_at) as last_visited_at, 
        COALESCE(SUM(d.visit_count), 1) as visit_count
      FROM users u
      LEFT JOIN unique_devices d ON u.id = d.user_id
      GROUP BY u.id, u.username, u.is_guest, u.created_at
    `);

    const visitedUsers = (dbUsers || []).map((u) => ({
      userId: u.user_id,
      username: u.username,
      isGuest: u.is_guest === 1,
      createdAt: u.created_at,
      lastVisitedAt: u.last_visited_at,
      visitCount: u.visit_count,
    }));

    return NextResponse.json({
      summary: {
        totalVisitors,
        totalVisits,
        avgVisits,
        returnRate,
      },
      dailyTrend,
      distributions,
      recentSessions,
      visitedUsers,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[api-analytics] error generating analytics:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
