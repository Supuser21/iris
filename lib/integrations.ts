import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { orgMemories } from "@/lib/db/schema";

export type KnowledgeSourceType =
  | "manual_note"
  | "meeting_transcript"
  | "job_doc"
  | "crew"
  | "pm_chat"
  | "job_record"
  | "drive"
  | "teams"
  | "procore";

export type KnowledgeSource = {
  orgId: string;
  jobId?: string | null;
  sourceType: KnowledgeSourceType;
  title: string;
  content: string;
  tags?: string | null;
};

export function normalizeKnowledgeSource(
  input: KnowledgeSource
): KnowledgeSource {
  return {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    tags: input.tags?.trim() || null,
  };
}

export function summarizeKnowledgeSource(source: KnowledgeSource) {
  const compact = source.content.replace(/\s+/g, " ").trim();
  const summary = compact.length > 240 ? `${compact.slice(0, 237)}…` : compact;
  return `${source.title}: ${summary}`;
}

export async function saveOrgMemoryFromSource(input: KnowledgeSource) {
  const source = normalizeKnowledgeSource(input);
  await db.insert(orgMemories).values({
    id: nanoid(),
    orgId: source.orgId,
    content: summarizeKnowledgeSource(source),
    tags: source.tags ?? null,
    sourceType: source.sourceType,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
