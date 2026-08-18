/* eslint-disable @typescript-eslint/no-explicit-any */
function generateMockDevices() {
  const devices: any[] = [];
  const countries = ["US", "IN", "GB", "CA", "DE", "FR", "JP", "AU", "BR", "SG", "NL"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Opera"];
  const oss = ["Windows", "macOS", "Linux", "iOS", "Android"];
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Generate 85 devices
  for (let i = 0; i < 85; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const os = oss[Math.floor(Math.random() * oss.length)];
    const deviceType = os === "iOS" || os === "Android" 
      ? (Math.random() > 0.15 ? "mobile" : "tablet") 
      : "desktop";
      
    const daysAgo = Math.random() * 30;
    const created = now - daysAgo * dayMs;
    const lastVisited = created + Math.random() * (now - created);
    const visitCount = Math.floor(Math.random() * Math.min(25, Math.ceil(daysAgo * 0.8))) + 1;
    
    // Custom inline UUID
    const deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    const ip = `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const userAgent = `Mozilla/5.0 (${os === "Windows" ? "Windows NT 10.0; Win64; x64" : os === "macOS" ? "Macintosh; Intel Mac OS X 10_15_7" : os === "Linux" ? "X11; Linux x86_64" : os === "iOS" ? "iPhone; CPU iPhone OS 16_5 like Mac OS X" : "Linux; Android 13; K"}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}/114.0.0.0`;
    
    devices.push({
      device_id: deviceId,
      visit_count: visitCount,
      last_visited_at: Math.floor(lastVisited),
      created_at: Math.floor(created),
      ip_address: ip,
      user_agent: userAgent,
      os,
      browser,
      device_type: deviceType,
      country
    });
  }
  
  return devices;
}

export async function executeMockQuery(sql: string, params: any[] = []): Promise<any> {
  // Store mock data on globalThis to preserve it across hot-reloads in next dev
  const g = globalThis as any;
  if (!g.__thock_unique_devices) {
    g.__thock_unique_devices = generateMockDevices();
  }
  if (!g.__thock_users) {
    g.__thock_users = [];
    
    // Generate corresponding users for our mock devices
    g.__thock_unique_devices.forEach((d: any, idx: number) => {
      const isGuest = Math.random() > 0.25 ? 1 : 0;
      let username = "";
      if (isGuest) {
        const ADJECTIVES = [
          "Swift", "Silent", "Neon", "Crimson", "Iron", "Cosmic", "Phantom", "Solar",
          "Turbo", "Rogue", "Blazing", "Frost", "Storm", "Lunar", "Viper", "Stealth",
          "Thunder", "Shadow", "Crystal", "Sonic", "Hyper", "Obsidian", "Prism", "Ember",
          "Arctic", "Quantum", "Gilded", "Scarlet", "Midnight", "Titan"
        ];
        const NOUNS = [
          "Falcon", "Panda", "Hawk", "Wolf", "Fox", "Lynx", "Cobra", "Raven",
          "Tiger", "Eagle", "Puma", "Jaguar", "Viper", "Orca", "Badger", "Osprey",
          "Ferret", "Gecko", "Manta", "Raptor", "Phoenix", "Drake", "Coyote", "Bison",
          "Heron", "Marlin", "Condor", "Dingo", "Panther", "Ibis"
        ];
        const cleaned = d.device_id.replace(/-/g, "");
        const a = parseInt(cleaned.substring(0, 4), 16) % ADJECTIVES.length;
        const b = parseInt(cleaned.substring(4, 8), 16) % NOUNS.length;
        username = `${ADJECTIVES[a]}${NOUNS[b]}`;
      } else {
        const names = ["AlphaTyper", "KeyClicker", "CyberClack", "TactileNinja", "LinearEnthusiast", "ThockLord", "ClickyPanda", "WpmSpeedster", "PandaSwitch", "KeycapCollector", "DeskMatMaster", "SpacebarLover", "CoiledCable", "LaserKeycaps", "HotSwapKing", "TypingWizard", "AestheticKeeb", "SilentGamer"];
        username = names[idx % names.length] + (Math.floor(Math.random() * 900) + 100);
      }
      
      const userId = `user_${d.device_id.substring(0, 8)}`;
      d.user_id = userId;
      g.__thock_users.push({
        id: userId,
        username,
        is_guest: isGuest,
        created_at: d.created_at,
        password_hash: "mock_hash",
        salt: "mock_salt"
      });
    });
  }
  if (!g.__thock_scores) {
    g.__thock_scores = [];
  }
  if (!g.__thock_preferences) {
    g.__thock_preferences = [];
  }
  if (!g.__thock_letter_stats) {
    g.__thock_letter_stats = [];
  }

  const sqlNormalized = sql.trim().replace(/\s+/g, " ");

  // 1. CREATE TABLE or INDEX (noop)
  if (sqlNormalized.startsWith("CREATE")) {
    return [];
  }

  // 2. Select user by username: SELECT * FROM users WHERE username = ?
  if (sqlNormalized.includes("FROM users") && sqlNormalized.includes("username = ?")) {
    const username = params[0];
    const user = g.__thock_users.find((u: any) => u.username === username);
    return user ? [user] : [];
  }

  // 3. Select user by id: SELECT * FROM users WHERE id = ?
  if (sqlNormalized.includes("FROM users") && sqlNormalized.includes("id = ?")) {
    const id = params[0];
    const user = g.__thock_users.find((u: any) => u.id === id);
    return user ? [user] : [];
  }

  // 4. Insert user: INSERT INTO users ...
  if (sqlNormalized.startsWith("INSERT INTO users")) {
    const [id, username, password_hash, salt, created_at] = params;
    // Check uniqueness
    if (g.__thock_users.some((u: any) => u.username === username)) {
      throw new Error("UNIQUE constraint failed: users.username");
    }
    const newUser = { id, username, password_hash, salt, created_at };
    g.__thock_users.push(newUser);
    return [];
  }

  // 5. Insert score: INSERT INTO scores ...
  if (sqlNormalized.startsWith("INSERT INTO scores")) {
    const [id, user_id, wpm, accuracy, consistency, time_limit, mode, created_at, raw_wpm, mistakes, total_typed, elapsed_ms] = params;
    const newScore = {
      id,
      user_id,
      wpm,
      accuracy,
      consistency,
      time_limit,
      mode,
      created_at,
      raw_wpm: raw_wpm ?? wpm,
      mistakes: mistakes ?? 0,
      total_typed: total_typed ?? 0,
      elapsed_ms: elapsed_ms ?? (time_limit ? time_limit * 1000 : 30000)
    };
    g.__thock_scores.push(newScore);
    return [];
  }

  // 5b. Select user scores: SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC
  if (sqlNormalized.includes("FROM scores") && sqlNormalized.includes("user_id = ?") && (sqlNormalized.includes("ORDER BY created_at") || !sqlNormalized.includes("ORDER BY"))) {
    const user_id = params[0];
    const userScores = g.__thock_scores
      .filter((s: any) => s.user_id === user_id)
      .map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        wpm: s.wpm,
        raw_wpm: s.raw_wpm ?? s.wpm,
        accuracy: s.accuracy,
        consistency: s.consistency,
        mistakes: s.mistakes ?? 0,
        total_typed: s.total_typed ?? 0,
        elapsed_ms: s.elapsed_ms ?? ((s.time_limit || 30) * 1000),
        time_limit: s.time_limit,
        mode: s.mode,
        created_at: s.created_at,
      }));
    userScores.sort((a: any, b: any) => b.created_at - a.created_at);
    
    // Check if there is a limit
    if (sqlNormalized.includes("LIMIT ?")) {
      const limitParam = params[params.length - 1];
      return userScores.slice(0, Number(limitParam) || 50);
    }
    return userScores;
  }

  // 6. Select leaderboard: SELECT scores.*, users.username FROM scores JOIN users ON scores.user_id = users.id WHERE scores.time_limit = ? AND scores.mode = ? ORDER BY scores.wpm DESC, scores.accuracy DESC LIMIT ?
  if (sqlNormalized.includes("FROM scores JOIN users") || sqlNormalized.includes("scores.user_id = users.id")) {
    const [time_limit, mode, limit] = params;
    
    const joined = g.__thock_scores
      .filter((s: any) => s.time_limit === Number(time_limit) && s.mode === mode)
      .map((s: any) => {
        const user = g.__thock_users.find((u: any) => u.id === s.user_id);
        return {
          ...s,
          username: user ? user.username : "Unknown"
        };
      });

    // Sort by wpm DESC, accuracy DESC
    joined.sort((a: any, b: any) => {
      if (b.wpm !== a.wpm) {
        return b.wpm - a.wpm;
      }
      return b.accuracy - a.accuracy;
    });

    return joined.slice(0, limit);
  }

  // 7. Get user's personal best (optional): SELECT MAX(wpm) as pb_wpm ...
  if (sqlNormalized.includes("MAX(wpm)") || sqlNormalized.includes("MAX(scores.wpm)")) {
    const [user_id, time_limit, mode] = params;
    const userScores = g.__thock_scores.filter(
      (s: any) => s.user_id === user_id && s.time_limit === Number(time_limit) && s.mode === mode
    );
    if (userScores.length === 0) {
      return [{ pb_wpm: 0, pb_accuracy: 0 }];
    }
    userScores.sort((a: any, b: any) => b.wpm - a.wpm);
    return [{ pb_wpm: userScores[0].wpm, pb_accuracy: userScores[0].accuracy }];
  }

  // 8. Get user's personal rank
  // Sub-query to get user's ranking
  if (sqlNormalized.includes("COUNT(*)") && (sqlNormalized.includes("wpm > ?") || sqlNormalized.includes("max_wpm > ?"))) {
    const [time_limit, mode, wpm] = params;
    // Find unique users' best scores for this configuration to count ranking
    const uniqueBests = new Map<string, number>();
    g.__thock_scores
      .filter((s: any) => s.time_limit === Number(time_limit) && s.mode === mode)
      .forEach((s: any) => {
        const currentBest = uniqueBests.get(s.user_id) || 0;
        if (s.wpm > currentBest) {
          uniqueBests.set(s.user_id, s.wpm);
        }
      });
      
    const rankAbove = Array.from(uniqueBests.values()).filter(v => v > wpm).length;
    return [{ rank_above: rankAbove }];
  }

  // 8b. Select user's personal best (alternate structure): SELECT wpm, accuracy, consistency FROM scores WHERE user_id = ? AND time_limit = ? AND mode = ? ORDER BY wpm DESC, accuracy DESC LIMIT 1
  if (sqlNormalized.includes("FROM scores") && sqlNormalized.includes("user_id = ?") && sqlNormalized.includes("ORDER BY wpm DESC") && sqlNormalized.includes("LIMIT 1")) {
    const [user_id, time_limit, mode] = params;
    const userScores = g.__thock_scores.filter(
      (s: any) => s.user_id === user_id && s.time_limit === Number(time_limit) && s.mode === mode
    );
    if (userScores.length === 0) {
      return [];
    }
    userScores.sort((a: any, b: any) => {
      if (b.wpm !== a.wpm) {
        return b.wpm - a.wpm;
      }
      return b.accuracy - a.accuracy;
    });
    return [userScores[0]];
  }

  // 9. Select preferences: SELECT settings_json FROM preferences WHERE user_id = ?
  if (sqlNormalized.includes("FROM preferences") && sqlNormalized.includes("WHERE user_id = ?")) {
    const user_id = params[0];
    const pref = g.__thock_preferences.find((p: any) => p.user_id === user_id);
    return pref ? [pref] : [];
  }

  // 10. Insert/Replace preferences: INSERT INTO preferences ...
  if (sqlNormalized.startsWith("INSERT INTO preferences")) {
    const [user_id, settings_json, updated_at] = params;
    const index = g.__thock_preferences.findIndex((p: any) => p.user_id === user_id);
    const newPref = { user_id, settings_json, updated_at };
    if (index !== -1) {
      g.__thock_preferences[index] = newPref;
    } else {
      g.__thock_preferences.push(newPref);
    }
    return [];
  }

  // 11. Select count or sum of unique devices
  if (sqlNormalized.includes("FROM unique_devices") && sqlNormalized.includes("SUM(visit_count)")) {
    const total = g.__thock_unique_devices.reduce((acc: number, d: any) => acc + (d.visit_count || 1), 0);
    return [{ total, count: total }];
  }

  if (sqlNormalized.includes("FROM unique_devices") && sqlNormalized.includes("COUNT(*)")) {
    if (sqlNormalized.includes("last_visited_at >=")) {
      const cutoff = params[0] || (Date.now() - 5 * 60 * 1000);
      const onlineDevices = g.__thock_unique_devices.filter((d: any) => (d.last_visited_at || 0) >= cutoff);
      return [{ count: onlineDevices.length }];
    }
    return [{ count: g.__thock_unique_devices.length }];
  }

  // 12. Insert unique device: INSERT INTO unique_devices ...
  if (sqlNormalized.startsWith("INSERT INTO unique_devices")) {
    const deviceId = params[0];
    const now = params[1];
    const ipAddress = params[3];
    const rawUserAgent = params[4];
    const osName = params[5];
    const browserName = params[6];
    const deviceType = params[7];
    const country = params[8];

    const index = g.__thock_unique_devices.findIndex((d: any) => d.device_id === deviceId);
    if (index !== -1) {
      g.__thock_unique_devices[index].visit_count += 1;
      g.__thock_unique_devices[index].last_visited_at = now;
      g.__thock_unique_devices[index].ip_address = ipAddress;
      g.__thock_unique_devices[index].user_agent = rawUserAgent;
      g.__thock_unique_devices[index].os = osName;
      g.__thock_unique_devices[index].browser = browserName;
      g.__thock_unique_devices[index].device_type = deviceType;
      g.__thock_unique_devices[index].country = country;
    } else {
      g.__thock_unique_devices.push({
        device_id: deviceId,
        visit_count: 1,
        last_visited_at: now,
        created_at: now,
        ip_address: ipAddress,
        user_agent: rawUserAgent,
        os: osName,
        browser: browserName,
        device_type: deviceType,
        country: country
      });
    }
    return [];
  }

  // 12.5 Select visited users: SELECT u.id as user_id, u.username, u.is_guest, u.created_at, ...
  if (sqlNormalized.includes("FROM users u") && sqlNormalized.includes("unique_devices d")) {
    const joined = g.__thock_users.map((u: any) => {
      const userDevices = g.__thock_unique_devices.filter((d: any) => d.user_id === u.id);
      
      // Sort user devices by last visited time descending to find the latest
      const sortedDevices = [...userDevices].sort((a: any, b: any) => b.last_visited_at - a.last_visited_at);
      const latestDevice = sortedDevices[0] || null;
      
      const visitCount = userDevices.reduce((sum: number, d: any) => sum + (d.visit_count || 1), 0);
      const lastVisitedAt = latestDevice ? latestDevice.last_visited_at : u.created_at;
      
      return {
        user_id: u.id,
        username: u.username,
        is_guest: u.is_guest ?? 0,
        created_at: u.created_at,
        last_visited_at: lastVisitedAt,
        visit_count: visitCount || 1,
        ip_address: latestDevice ? latestDevice.ip_address : null,
        os: latestDevice ? latestDevice.os : null,
        browser: latestDevice ? latestDevice.browser : null,
        device_type: latestDevice ? latestDevice.device_type : null,
        country: latestDevice ? latestDevice.country : null,
        user_agent: latestDevice ? latestDevice.user_agent : null,
      };
    });
    return joined;
  }

  // 13. Select unique devices for user or all
  if (sqlNormalized.includes("FROM unique_devices")) {
    if (sqlNormalized.includes("user_id = ?")) {
      const user_id = params[0];
      const userDevices = g.__thock_unique_devices.filter((d: any) => d.user_id === user_id);
      userDevices.sort((a: any, b: any) => b.last_visited_at - a.last_visited_at);
      return userDevices;
    }
    const sorted = [...g.__thock_unique_devices];
    sorted.sort((a: any, b: any) => b.last_visited_at - a.last_visited_at);
    return sorted;
  }

  // 14. Select letter stats for user: SELECT * FROM user_letter_stats WHERE user_id = ?
  if (sqlNormalized.includes("FROM user_letter_stats") && sqlNormalized.includes("user_id = ?")) {
    const user_id = params[0];
    const stats = (g.__thock_letter_stats || [])
      .filter((s: any) => s.user_id === user_id)
      .map((s: any) => ({ ...s }));
    if (sqlNormalized.includes("ORDER BY grip_score ASC")) {
      stats.sort((a: any, b: any) => a.grip_score - b.grip_score);
    } else if (sqlNormalized.includes("ORDER BY char ASC")) {
      stats.sort((a: any, b: any) => a.char.localeCompare(b.char));
    }
    return stats;
  }

  // 15. Insert/Upsert letter stats: INSERT INTO user_letter_stats ...
  if (sqlNormalized.startsWith("INSERT INTO user_letter_stats") || sqlNormalized.startsWith("INSERT OR REPLACE INTO user_letter_stats")) {
    const [user_id, char, total_typed, correct_count, error_count, total_latency_ms, avg_latency_ms, accuracy, grip_score, updated_at] = params;
    const existingIndex = g.__thock_letter_stats.findIndex((s: any) => s.user_id === user_id && s.char === char);
    const newRecord = {
      user_id,
      char,
      total_typed: Number(total_typed) || 0,
      correct_count: Number(correct_count) || 0,
      error_count: Number(error_count) || 0,
      total_latency_ms: Number(total_latency_ms) || 0,
      avg_latency_ms: Number(avg_latency_ms) || 0,
      accuracy: Number(accuracy) || 100,
      grip_score: Number(grip_score) || 100,
      updated_at: Number(updated_at) || Date.now(),
    };
    if (existingIndex !== -1) {
      g.__thock_letter_stats[existingIndex] = newRecord;
    } else {
      g.__thock_letter_stats.push(newRecord);
    }
    return [];
  }

  throw new Error(`Unsupported SQL query in mock database: ${sql}`);
}
