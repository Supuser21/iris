import {
  pgTable,
  text,
  boolean,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  timezone: text("timezone").default("America/New_York"),
  morningBriefTime: text("morning_brief_time"),
  morningBriefEnabled: boolean("morning_brief_enabled").default(false),
  onboardingStep: text("onboarding_step").default("welcome"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: bigint("google_token_expiry", { mode: "number" }),
  smsOptOut: boolean("sms_opt_out").default(false),
  morningBriefLastSent: text("morning_brief_last_sent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const memories = pgTable("memories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  repeatRule: text("repeat_rule"),
  sent: boolean("sent").default(false),
  cancelled: boolean("cancelled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  channel: text("channel").default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orgs = pgTable("orgs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id),
  companyType: text("company_type"),
  preferredTone: text("preferred_tone"),
  preferredRecapStyle: text("preferred_recap_style"),
  preferredBriefStyle: text("preferred_brief_style"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => orgs.id),
  name: text("name").notNull(),
  address: text("address"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => orgs.id),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone").notNull(),
  smsOptOut: boolean("sms_opt_out").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const jobPeople = pgTable("job_people", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobDocuments = pgTable("job_documents", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  title: text("title").notNull(),
  attendeePersonIds: text("attendee_person_ids").notNull(),
  transcript: text("transcript").notNull(),
  extracted: text("extracted").notNull(),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const outboundMessages = pgTable("outbound_messages", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  meetingId: text("meeting_id").references(() => meetings.id),
  personId: text("person_id").references(() => people.id),
  phone: text("phone").notNull(),
  reason: text("reason").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const inboundReplies = pgTable("inbound_replies", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  phone: text("phone").notNull(),
  body: text("body").notNull(),
  relayedToUserId: text("relayed_to_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orgMemories = pgTable("org_memories", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => orgs.id),
  content: text("content").notNull(),
  tags: text("tags"),
  sourceType: text("source_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Org = typeof orgs.$inferSelect;
export type OrgMemory = typeof orgMemories.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Person = typeof people.$inferSelect;
export type JobPerson = typeof jobPeople.$inferSelect;
export type JobDocument = typeof jobDocuments.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type OutboundMessage = typeof outboundMessages.$inferSelect;
export type InboundReply = typeof inboundReplies.$inferSelect;
