import { executeMockQuery } from "./db-mock";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  batch(queries: { sql: string; params?: any[] }[]): Promise<void>;
}

// 1. Cloudflare Native D1 Client
class D1NativeClient implements DatabaseClient {
  private db: any;
  constructor(db: any) {
    this.db = db;
  }
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const { results } = await stmt.all();
    return results || [];
  }
  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.db.prepare(sql).bind(...params).run();
  }
  async batch(queries: { sql: string; params?: any[] }[]): Promise<void> {
    const stmts = queries.map(q => this.db.prepare(q.sql).bind(...(q.params || [])));
    await this.db.batch(stmts);
  }
}

// 2. Cloudflare D1 REST API Client
class D1RestClient implements DatabaseClient {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;

  constructor(accountId: string, databaseId: string, apiToken: string) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
  }

  private async fetchD1(sql: string, params: any[] = []): Promise<any> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store"
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D1 HTTP query failed with status ${res.status}: ${text}`);
    }

    const json = await res.json() as any;
    if (!json.success) {
      throw new Error(`D1 HTTP query returned error: ${JSON.stringify(json.errors)}`);
    }

    return json.result[0];
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.fetchD1(sql, params);
    return result.results || [];
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.fetchD1(sql, params);
  }

  async batch(queries: { sql: string; params?: any[] }[]): Promise<void> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(queries),
      cache: "no-store"
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D1 HTTP batch query failed with status ${res.status}: ${text}`);
    }

    const json = await res.json() as any;
    if (!json.success) {
      throw new Error(`D1 HTTP batch query returned error: ${JSON.stringify(json.errors)}`);
    }
  }
}

// 3. In-Memory Mock Client
class MemoryMockClient implements DatabaseClient {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return executeMockQuery(sql, params);
  }
  async execute(sql: string, params: any[] = []): Promise<void> {
    await executeMockQuery(sql, params);
  }
  async batch(queries: { sql: string; params?: any[] }[]): Promise<void> {
    for (const q of queries) {
      await executeMockQuery(q.sql, q.params || []);
    }
  }
}

let isDbInitialized = false;

async function ensureDbInitialized(db: DatabaseClient) {
  if (isDbInitialized) return;
  
  try {
    await db.batch([
      {
        sql: `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          is_guest INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS scores (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          wpm REAL NOT NULL,
          accuracy REAL NOT NULL,
          consistency REAL NOT NULL,
          time_limit INTEGER NOT NULL,
          mode TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (mode, time_limit, wpm DESC)`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS preferences (
          user_id TEXT PRIMARY KEY,
          settings_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS unique_devices (
          device_id TEXT PRIMARY KEY,
          visit_count INTEGER NOT NULL DEFAULT 1,
          last_visited_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          os TEXT,
          browser TEXT,
          device_type TEXT,
          country TEXT
        )`
      }
    ]);
    
    // Auto-migrate new columns for existing tables
    const deviceColumnsToAdd = ['ip_address', 'user_agent', 'os', 'browser', 'device_type', 'country', 'user_id'];
    for (const col of deviceColumnsToAdd) {
      try {
        await db.execute(`ALTER TABLE unique_devices ADD COLUMN ${col} TEXT`);
      } catch (err) {
        // Ignore errors if column already exists
      }
    }

    // Allow password_hash and salt to be nullable (for guest users)
    const userColumnsToAdd = ['is_guest'];
    for (const col of userColumnsToAdd) {
      try {
        await db.execute(`ALTER TABLE users ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`);
      } catch (err) {
        // Ignore errors if column already exists
      }
    }

    isDbInitialized = true;
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

let cachedDbClient: DatabaseClient | null = null;

function getDbClient(): DatabaseClient {
  if (cachedDbClient) return cachedDbClient;

  // 1. Try to read native Cloudflare D1 binding from @opennextjs/cloudflare context
  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && (ctx.env as any).DB) {
      console.log("[db] Using Native Cloudflare D1 binding from getCloudflareContext().");
      cachedDbClient = new D1NativeClient((ctx.env as any).DB);
      return cachedDbClient;
    }
  } catch (e) {
    // getCloudflareContext failed (e.g. running in local Node dev mode or build time)
  }

  // 2. Check REST HTTP API config first to ensure consistency with custom tokens
  const env = typeof process !== "undefined" && process.env ? process.env : {} as any;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = env.CLOUDFLARE_DATABASE_ID || env.D1_DATABASE_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;

  if (accountId && databaseId && apiToken) {
    console.log("[db] Using Cloudflare D1 REST HTTP API driver.");
    cachedDbClient = new D1RestClient(accountId, databaseId, apiToken);
    return cachedDbClient;
  }

  // 3. Check native Cloudflare bindings fallback
  const envDb = typeof process !== "undefined" && process.env ? process.env.DB : undefined;
  const binding =
    envDb ||
    (globalThis as any).DB ||
    (globalThis as any).__NEXT_CLOUDFLARE_BINDINGS__?.DB;

  if (binding) {
    console.log("[db] Using Native Cloudflare D1 driver binding fallback.");
    cachedDbClient = new D1NativeClient(binding);
    return cachedDbClient;
  }

  // 4. Fallback to in-memory mock
  console.log("[db] Cloudflare D1 bindings not detected. Falling back to edge-compatible in-memory DB.");
  return new MemoryMockClient();
}

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = getDbClient();
    await ensureDbInitialized(client);
    return client.query<T>(sql, params);
  },
  async execute(sql: string, params?: any[]): Promise<void> {
    const client = getDbClient();
    await ensureDbInitialized(client);
    return client.execute(sql, params);
  },
  async batch(queries: { sql: string; params?: any[] }[]): Promise<void> {
    const client = getDbClient();
    await ensureDbInitialized(client);
    return client.batch(queries);
  }
};
