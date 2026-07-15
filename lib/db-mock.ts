export async function executeMockQuery(sql: string, params: any[] = []): Promise<any> {
  // Store mock data on globalThis to preserve it across hot-reloads in next dev
  const g = globalThis as any;
  if (!g.__thock_users) {
    g.__thock_users = [];
  }
  if (!g.__thock_scores) {
    g.__thock_scores = [];
  }
  if (!g.__thock_preferences) {
    g.__thock_preferences = [];
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
    const [id, user_id, wpm, accuracy, consistency, time_limit, mode, created_at] = params;
    const newScore = { id, user_id, wpm, accuracy, consistency, time_limit, mode, created_at };
    g.__thock_scores.push(newScore);
    return [];
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
  if (sqlNormalized.includes("COUNT(*)") && sqlNormalized.includes("wpm > ?")) {
    // SELECT COUNT(*) as rank_above FROM scores WHERE time_limit = ? AND mode = ? AND wpm > ?
    const [time_limit, mode, wpm] = params;
    // Find unique users' best scores for this configuration to count ranking, or just count individual better scores
    // Usually ranking count scores that are strictly higher
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

  throw new Error(`Unsupported SQL query in mock database: ${sql}`);
}
