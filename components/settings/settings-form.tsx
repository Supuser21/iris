"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BillingPlaceholder } from "@/components/settings/billing-placeholder";

type User = {
  id: string;
  phone: string;
  name: string | null;
  timezone: string | null;
  morningBriefTime: string | null;
  morningBriefEnabled: boolean | null;
  googleAccessToken: string | null;
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Warsaw",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function SettingsForm() {
  const [user, setUser] = useState<User | null>(null);
  const [timezone, setTimezone] = useState("America/New_York");
  const [briefTime, setBriefTime] = useState("07:00");
  const [briefEnabled, setBriefEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setTimezone(d.user.timezone ?? "America/New_York");
          setBriefTime(d.user.morningBriefTime ?? "07:00");
          setBriefEnabled(d.user.morningBriefEnabled ?? false);
        }
      });
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        morningBriefTime: briefTime,
        morningBriefEnabled: briefEnabled,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) {
    return (
      <p className="text-muted">
        <Link href="/signup" className="text-accent underline">
          Sign in
        </Link>{" "}
        to manage settings.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Google Calendar</h2>
        <p className="mt-1 text-sm text-muted">
          Optional — unlock morning briefs and meeting heads-ups.
        </p>
        {user.googleAccessToken ? (
          <p className="mt-4 text-sm text-accent">Connected</p>
        ) : (
          <a
            href="/api/auth/google"
            className="mt-4 inline-flex rounded-full bg-accent-light px-6 py-3 text-sm font-medium text-accent hover:bg-[#dce8e3]"
          >
            Connect Google Calendar
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Timezone</h2>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Morning brief</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={briefEnabled}
            onChange={(e) => setBriefEnabled(e.target.checked)}
          />
          Send daily morning brief via SMS
        </label>
        <input
          type="time"
          value={briefTime}
          onChange={(e) => setBriefTime(e.target.value)}
          className="rounded-xl border border-border px-4 py-3 text-sm"
        />
      </section>

      <BillingPlaceholder />

      <Button onClick={save}>{saved ? "Saved!" : "Save settings"}</Button>

      <p className="text-sm text-muted">
        Reminders-only mode works without calendar. Text Iris anytime at{" "}
        <span className="font-mono">{user.phone}</span>.
      </p>
    </div>
  );
}
