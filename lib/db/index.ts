import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Create a free Neon database — see README.md"
    );
  }
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error(
      "DATABASE_URL must be a Postgres connection string (Neon). SQLite is no longer used in production."
    );
  }
  return url;
}

export function getDb() {
  if (!_db) {
    const sql = neon(getConnectionString());
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export async function initDb() {
  const sql = neon(getConnectionString());
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      morning_brief_time TEXT,
      morning_brief_enabled BOOLEAN DEFAULT FALSE,
      onboarding_step TEXT DEFAULT 'welcome',
      onboarding_complete BOOLEAN DEFAULT FALSE,
      google_access_token TEXT,
      google_refresh_token TEXT,
      google_token_expiry BIGINT,
      sms_opt_out BOOLEAN DEFAULT FALSE,
      morning_brief_last_sent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS morning_brief_last_sent TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      tags TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      due_at TIMESTAMPTZ,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      due_at TIMESTAMPTZ NOT NULL,
      repeat_rule TEXT,
      sent BOOLEAN DEFAULT FALSE,
      cancelled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      channel TEXT DEFAULT 'web',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES users(id),
      company_type TEXT,
      preferred_tone TEXT,
      preferred_recap_style TEXT,
      preferred_brief_style TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE orgs ADD COLUMN IF NOT EXISTS company_type TEXT`;
  await sql`ALTER TABLE orgs ADD COLUMN IF NOT EXISTS preferred_tone TEXT`;
  await sql`ALTER TABLE orgs ADD COLUMN IF NOT EXISTS preferred_recap_style TEXT`;
  await sql`ALTER TABLE orgs ADD COLUMN IF NOT EXISTS preferred_brief_style TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      name TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT NOT NULL,
      sms_opt_out BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS job_people (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      person_id TEXT NOT NULL REFERENCES people(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS job_documents (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE job_documents ADD COLUMN IF NOT EXISTS file_name TEXT`;
  await sql`ALTER TABLE job_documents ADD COLUMN IF NOT EXISTS mime_type TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'pm',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS org_invites (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'pm',
      status TEXT NOT NULL DEFAULT 'pending',
      invited_by_user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS org_integrations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      title TEXT NOT NULL,
      attendee_person_ids TEXT NOT NULL,
      transcript TEXT NOT NULL,
      extracted TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS outbound_messages (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      meeting_id TEXT REFERENCES meetings(id),
      person_id TEXT REFERENCES people(id),
      phone TEXT NOT NULL,
      reason TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS inbound_replies (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      person_id TEXT NOT NULL REFERENCES people(id),
      phone TEXT NOT NULL,
      body TEXT NOT NULL,
      relayed_to_user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS org_memories (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      content TEXT NOT NULL,
      tags TEXT,
      source_type TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE people ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`;
  await sql`
    CREATE TABLE IF NOT EXISTS org_workflows (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES orgs(id),
      name TEXT NOT NULL,
      trigger_phrase TEXT NOT NULL,
      goal TEXT NOT NULL,
      output_type TEXT NOT NULL,
      allowed_tools TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'custom',
      created_by_user_id TEXT NOT NULL REFERENCES users(id),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES org_workflows(id),
      job_id TEXT REFERENCES jobs(id),
      input TEXT NOT NULL,
      output TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
