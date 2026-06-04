import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

let sqlite: Database.Database | null = null;
let _db: BetterSQLite3Database<typeof schema> | null = null;

function getSqlite() {
  if (!sqlite) {
    const dbPath =
      process.env.DATABASE_URL?.replace("file:", "") ?? "./data/iris.db";
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("busy_timeout = 5000");
  }
  return sqlite;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    if (!_db) {
      _db = drizzle(getSqlite(), { schema });
    }
    const value = _db[prop as keyof typeof _db];
    if (typeof value === "function") {
      return value.bind(_db);
    }
    return value;
  },
});

export function initDb() {
  const s = getSqlite();
  s.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      morning_brief_time TEXT,
      morning_brief_enabled INTEGER DEFAULT 0,
      onboarding_step TEXT DEFAULT 'welcome',
      onboarding_complete INTEGER DEFAULT 0,
      google_access_token TEXT,
      google_refresh_token TEXT,
      google_token_expiry INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_at INTEGER,
      completed INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      due_at INTEGER NOT NULL,
      repeat_rule TEXT,
      sent INTEGER DEFAULT 0,
      cancelled INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      channel TEXT DEFAULT 'web',
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER
    );
  `);
}
