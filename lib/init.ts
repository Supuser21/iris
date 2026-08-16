import { initDb } from "@/lib/db";

let initPromise: Promise<void> | null = null;

export async function ensureDb() {
  if (!initPromise) {
    initPromise = initDb();
  }
  await initPromise;
}
