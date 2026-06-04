import { initDb } from "@/lib/db";

let initialized = false;

export function ensureDb() {
  if (!initialized) {
    initDb();
    initialized = true;
  }
}
