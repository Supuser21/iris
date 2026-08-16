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
  googleCalendarConnected?: boolean;
  googleOAuthConfigured?: boolean;
};

type OrgIntegration = {
  id: string;
  provider: string;
  status: string;
};

const INTEGRATIONS = [
  { id: "telegram", name: "Telegram", use: "Crew and PM follow-up in Telegram." },
  { id: "teams", name: "Microsoft Teams", use: "Pull meeting context and post recaps." },
  { id: "procore", name: "Procore", use: "Bring job context and documents into Iris." },
  { id: "email", name: "Email", use: "Draft and track owner or subcontractor emails." },
  { id: "drive", name: "Google Drive", use: "Read plans, awards, and job docs." },
  { id: "stripe", name: "Stripe", use: "Manage billing when you are ready." },
];

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
  const [integrations, setIntegrations] = useState<OrgIntegration[]>([]);
  const [invitePhone, setInvitePhone] = useState("");
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
    fetch("/api/org/integrations")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.integrations)) setIntegrations(d.integrations);
      })
      .catch(() => {});
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

  async function requestIntegration(provider: string) {
    await fetch("/api/org/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const res = await fetch("/api/org/integrations");
    const data = await res.json();
    if (Array.isArray(data.integrations)) setIntegrations(data.integrations);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function invitePm() {
    await fetch("/api/org/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: invitePhone }),
    });
    setInvitePhone("");
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

      {user.googleOAuthConfigured && (
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Google Calendar</h2>
          <p className="text-sm text-muted">
            Connect so morning briefs and Iris can see today&apos;s events.
          </p>
          {user.googleCalendarConnected ? (
            <p className="text-sm text-accent font-medium">Connected</p>
          ) : (
            <a
              href="/api/auth/google"
              className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-card"
            >
              Connect Google Calendar
            </a>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Morning brief</h2>
        <p className="text-sm text-muted">
          Daily SMS summary of your tasks and reminders.
        </p>
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

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Team access</h2>
        <p className="text-sm text-muted">
          Invite another PM by US phone. When they sign in, they&apos;ll share this company&apos;s jobs.
        </p>
        <input
          value={invitePhone}
          onChange={(e) => setInvitePhone(e.target.value)}
          placeholder="PM phone number"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm"
        />
        <Button onClick={invitePm} disabled={!invitePhone.trim()}>
          Invite PM
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Connectors</h2>
          <p className="mt-2 text-sm text-muted">
            Request the systems you want. We&apos;ll turn them on for your company in an implementation sprint.
          </p>
        </div>
        <div className="grid gap-3">
          {INTEGRATIONS.map((integration) => {
            const requested = integrations.some(
              (item) => item.provider === integration.id
            );
            return (
              <div
                key={integration.id}
                className="rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="mt-1 text-muted">{integration.use}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={requested ? "secondary" : "ghost"}
                    disabled={requested}
                    onClick={() => requestIntegration(integration.id)}
                  >
                    {requested ? "Requested" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Button onClick={save}>{saved ? "Saved!" : "Save settings"}</Button>

      <p className="text-sm text-muted">
        Text Iris anytime at <span className="font-mono">{user.phone}</span>.
      </p>
    </div>
  );
}
