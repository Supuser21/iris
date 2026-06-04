import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  timezone: text("timezone").default("America/New_York"),
  morningBriefTime: text("morning_brief_time"), // HH:mm
  morningBriefEnabled: integer("morning_brief_enabled", { mode: "boolean" }).default(false),
  onboardingStep: text("onboarding_step").default("welcome"),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).default(false),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: integer("google_token_expiry"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  tags: text("tags"), // comma-separated
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  dueAt: integer("due_at", { mode: "timestamp" }),
  completed: integer("completed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  dueAt: integer("due_at", { mode: "timestamp" }).notNull(),
  repeatRule: text("repeat_rule"), // yearly | weekly | daily | null
  sent: integer("sent", { mode: "boolean" }).default(false),
  cancelled: integer("cancelled", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  channel: text("channel").default("web"), // web | sms
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const otpCodes = sqliteTable("otp_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Message = typeof messages.$inferSelect;
