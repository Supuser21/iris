"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowsPanel } from "@/components/jobs/workflows-panel";

type Org = {
  id: string;
  name: string;
  companyType: string | null;
  preferredTone: string | null;
  preferredRecapStyle: string | null;
  preferredBriefStyle: string | null;
};

type Job = {
  id: string;
  name: string;
  address: string | null;
  status: string | null;
};

type OrgMemory = {
  id: string;
  content: string;
  tags: string | null;
  sourceType: string;
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

export function JobsHome() {
  const [org, setOrg] = useState<Org | null>(null);
  const [memories, setMemories] = useState<OrgMemory[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [integrations, setIntegrations] = useState<OrgIntegration[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [preferredTone, setPreferredTone] = useState("");
  const [preferredRecapStyle, setPreferredRecapStyle] = useState("");
  const [preferredBriefStyle, setPreferredBriefStyle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryTags, setMemoryTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const [jobsRes, orgRes, integrationsRes] = await Promise.all([
      fetch("/api/jobs"),
      fetch("/api/org"),
      fetch("/api/org/integrations"),
    ]);
    const jobsData = await jobsRes.json();
    const orgData = await orgRes.json();
    const integrationsData = await integrationsRes.json();

    if (jobsData.org) setOrg(jobsData.org);
    if (Array.isArray(jobsData.jobs)) setJobs(jobsData.jobs);
    if (orgData.org) {
      setOrg(orgData.org);
      setCompanyType(orgData.org.companyType ?? "");
      setPreferredTone(orgData.org.preferredTone ?? "");
      setPreferredRecapStyle(orgData.org.preferredRecapStyle ?? "");
      setPreferredBriefStyle(orgData.org.preferredBriefStyle ?? "");
    }
    if (Array.isArray(orgData.memories)) setMemories(orgData.memories);
    if (Array.isArray(integrationsData.integrations)) {
      setIntegrations(integrationsData.integrations);
    }
  }

  useEffect(() => {
    load().catch(() => setError("Could not load jobs"));
  }, []);

  async function createJob() {
    setError("");
    if (!name.trim()) {
      setError("Job name required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create job");
      setName("");
      setAddress("");
      setNotice("Job created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job");
    } finally {
      setLoading(false);
    }
  }

  async function saveCompanyProfile() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: org?.name ?? "",
          companyType,
          preferredTone,
          preferredRecapStyle,
          preferredBriefStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save company profile");
      setOrg(data.org);
      setMemories(data.memories ?? []);
      setNotice("Company profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save company profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveMemory() {
    setError("");
    if (!memoryContent.trim()) {
      setError("Add a company preference first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/org/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: memoryContent,
          tags: memoryTags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save memory");
      setMemoryContent("");
      setMemoryTags("");
      setNotice("Company preference saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save memory");
    } finally {
      setLoading(false);
    }
  }

  async function invitePm() {
    setError("");
    if (!invitePhone.trim()) {
      setError("Phone required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: invitePhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not invite PM");
      setInvitePhone("");
      setNotice("PM invited.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not invite PM");
    } finally {
      setLoading(false);
    }
  }

  async function requestIntegration(provider: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not request integration");
      setNotice("Integration requested for a sprint.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request integration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-accent">
          {org?.name ?? "Your jobs"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Run every project from one thread
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Set how your company sounds, add a job, bring in the crew, and let Iris
          keep learning how your team actually moves work.
        </p>
      </section>

      {(error || notice) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-accent/20 bg-accent/5 text-foreground"
          }`}
        >
          {error || notice}
        </div>
      )}

      <WorkflowsPanel />

      <section className="grid gap-8 lg:grid-cols-[0.85fr,1.15fr]">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-accent">Team access</p>
            <h2 className="mt-2 text-xl font-semibold">Invite another PM</h2>
            <p className="mt-2 text-sm text-muted">
              Send an invite by US phone. When they sign in, they share this company&apos;s jobs.
            </p>
          </div>
          <input
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            placeholder="PM phone number"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button onClick={invitePm} disabled={loading}>
            Invite PM
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-accent">Connect in a sprint</p>
            <h2 className="mt-2 text-xl font-semibold">Turn on systems when you need them</h2>
            <p className="mt-2 text-sm text-muted">
              These are request-only for now. We&apos;ll enable the connector for your company in an implementation sprint.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((integration) => {
              const requested = integrations.some(
                (item) => item.provider === integration.id
              );
              return (
                <div
                  key={integration.id}
                  className="rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <p className="font-medium">{integration.name}</p>
                  <p className="mt-1 text-muted">{integration.use}</p>
                  <Button
                    size="sm"
                    variant={requested ? "secondary" : "ghost"}
                    className="mt-3"
                    disabled={loading || requested}
                    onClick={() => requestIntegration(integration.id)}
                  >
                    {requested ? "Requested" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-accent">Company profile</p>
            <h2 className="mt-2 text-xl font-semibold">How Iris should sound here</h2>
            <p className="mt-2 text-sm text-muted">
              Set the tone once so recaps, replies, and briefs start sounding like
              your company instead of generic software.
            </p>
          </div>
          <input
            value={org?.name ?? ""}
            onChange={(e) => setOrg((current) => current ? { ...current, name: e.target.value } : current)}
            placeholder="Company name"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value)}
            placeholder="Company type / trades"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={preferredTone}
            onChange={(e) => setPreferredTone(e.target.value)}
            rows={2}
            placeholder="Preferred tone (direct, calm, no fluff...)"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={preferredRecapStyle}
            onChange={(e) => setPreferredRecapStyle(e.target.value)}
            rows={2}
            placeholder="How recap texts should read"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={preferredBriefStyle}
            onChange={(e) => setPreferredBriefStyle(e.target.value)}
            rows={2}
            placeholder="How morning briefs should read"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button onClick={saveCompanyProfile} disabled={loading}>
            Save company profile
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-accent">Learned preferences</p>
            <h2 className="mt-2 text-xl font-semibold">What Iris has picked up</h2>
            <p className="mt-2 text-sm text-muted">
              These notes are inspectable on purpose. Add explicit rules and let the
              workspace seed the rest from jobs, crew, and transcripts.
            </p>
          </div>
          <textarea
            value={memoryContent}
            onChange={(e) => setMemoryContent(e.target.value)}
            rows={3}
            placeholder='Example: Keep missed-meeting recaps under 3 short lines and name the owner in the first sentence.'
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            value={memoryTags}
            onChange={(e) => setMemoryTags(e.target.value)}
            placeholder="Tags (tone, recap, crew...)"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button onClick={saveMemory} disabled={loading}>
            Save company preference
          </Button>
          <div className="space-y-3">
            {memories.length === 0 ? (
              <p className="text-sm text-muted">
                No learned preferences yet. Save one above or create jobs and meeting
                drafts to start building company memory.
              </p>
            ) : (
              memories.map((memory) => (
                <div key={memory.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                  <p>{memory.content}</p>
                  <p className="mt-2 text-xs text-muted">
                    {memory.tags || "untagged"} · {memory.sourceType}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr,1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">New job</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Riverside Apartments - Building B"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Job address"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={createJob} disabled={loading}>
            {loading ? "Creating…" : "Create job"}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Jobs</h2>
            <span className="text-sm text-muted">{jobs.length} total</span>
          </div>
          <div className="mt-4 space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted">
                No jobs yet. Start with one awarded project, then add the crew and
                drop in the first meeting notes.
              </p>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-2xl border border-border px-4 py-4 hover:border-accent/50 hover:bg-accent/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{job.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {job.address || "No address yet"}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {job.status ?? "active"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
