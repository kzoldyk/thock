import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/auth-crypto";

const JWT_SECRET = process.env.JWT_SECRET!;

const ADJECTIVES = [
  "Swift", "Silent", "Neon", "Crimson", "Iron", "Cosmic", "Phantom", "Solar",
  "Turbo", "Rogue", "Blazing", "Frost", "Storm", "Lunar", "Viper", "Stealth",
  "Thunder", "Shadow", "Crystal", "Sonic", "Hyper", "Obsidian", "Prism", "Ember",
  "Arctic", "Quantum", "Gilded", "Scarlet", "Midnight", "Titan",
];

const NOUNS = [
  "Falcon", "Panda", "Hawk", "Wolf", "Fox", "Lynx", "Cobra", "Raven",
  "Tiger", "Eagle", "Puma", "Jaguar", "Viper", "Orca", "Badger", "Osprey",
  "Ferret", "Gecko", "Manta", "Raptor", "Phoenix", "Drake", "Coyote", "Bison",
  "Heron", "Marlin", "Condor", "Dingo", "Panther", "Ibis",
];

/** Deterministic: same device_id always maps to the same name pair */
function generateGuestUsername(deviceId: string): string {
  const cleaned = deviceId.replace(/-/g, "");
  const a = parseInt(cleaned.substring(0, 4), 16) % ADJECTIVES.length;
  const b = parseInt(cleaned.substring(4, 8), 16) % NOUNS.length;
  return `${ADJECTIVES[a]}${NOUNS[b]}`;
}

async function ensureUniqueName(base: string): Promise<string> {
  const existing = await db.query("SELECT id FROM users WHERE username = ?", [base]);
  if (!existing || existing.length === 0) return base;
  // Collision fallback — rare with 900 combinations; add numeric suffix
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}${i}`;
    const exists = await db.query("SELECT id FROM users WHERE username = ?", [candidate]);
    if (!exists || exists.length === 0) return candidate;
  }
  return `${base}_${crypto.randomUUID().substring(0, 4)}`;
}

async function issueSession(id: string, username: string): Promise<NextResponse> {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const token = await signJwt({ id, username, exp }, JWT_SECRET);
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ user: { id, username } });
  response.headers.set(
    "Set-Cookie",
    `thock_session=${token}; HttpOnly; Secure=${isProd ? "true" : "false"}; SameSite=Lax; Path=/; Max-Age=2592000`
  );
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // 1. Check if this device already has a linked user
    const devices = await db.query<{ user_id: string | null }>(
      "SELECT user_id FROM unique_devices WHERE device_id = ?",
      [deviceId]
    );

    if (devices && devices.length > 0 && devices[0].user_id) {
      const userId = devices[0].user_id;
      const users = await db.query<{ id: string; username: string }>(
        "SELECT id, username FROM users WHERE id = ?",
        [userId]
      );
      if (users && users.length > 0) {
        // Re-issue session for the existing user tied to this device
        return issueSession(users[0].id, users[0].username);
      }
    }

    // 2. Create a new guest user
    const baseUsername = generateGuestUsername(deviceId);
    const username = await ensureUniqueName(baseUsername);
    const userId = crypto.randomUUID();
    const createdAt = Date.now();

    await db.execute(
      "INSERT INTO users (id, username, password_hash, salt, is_guest, created_at) VALUES (?, ?, '__guest__', '__guest__', 1, ?)",
      [userId, username, createdAt]
    );

    // 3. Link user back to device row (best-effort — device may not exist yet)
    try {
      await db.execute(
        "UPDATE unique_devices SET user_id = ? WHERE device_id = ?",
        [userId, deviceId]
      );
    } catch (_) {
      // Non-fatal — will be linked on next /api/visits call
    }

    return issueSession(userId, username);
  } catch (err: any) {
    console.error("[auth/guest] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
