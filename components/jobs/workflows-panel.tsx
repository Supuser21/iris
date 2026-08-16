"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Workflow = {
  id: string;
  name: string;
  triggerPhrase: string;
  goal: string;
  outputType: string;
  kind: string;
  latestRun: {
    id: string;
    status: string;
    output: string;
    createdAt: string;
  } | null;
};

function runSummary(output: string) {
  try {
    const parsed = JSON.parse(output) as {
      summary?: string;
      message?: string;
      previewText?: string;
    };
    return parsed.summary || parsed.previewText || parsed.message || "Last run saved.";
  } catch {
    return "Last run saved.";
  }
}

export function WorkflowsPanel() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const res = await fetch("/api/org/workflows");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load workflows");
    if (Array.isArray(data.workflows)) setWorkflows(data.workflows);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load workflows")
    );
  }, []);

  async function runWorkflow(id: string) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch(`/api/org/workflows/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not run workflow");
      setNotice("Workflow ran. Check the latest result below or ask Iris in chat.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run workflow");
    } finally {
      setLoading(false);
    }
  }

  async function loadRiverside() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/demo/riverside", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load Riverside demo");
      setNotice(data.message ?? "Riverside demo is ready.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Riverside demo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Company tools</p>
          <h2 className="mt-2 text-xl font-semibold">Workflows Iris can run</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            These stay on this company&apos;s cloud org. Ask Iris in chat, or build a
            new one in plain English.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={loading} onClick={loadRiverside}>
            Load Riverside demo
          </Button>
          <Link href="/chat?mode=build">
            <Button>Build a tool</Button>
          </Link>
        </div>
      </div>

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

      <div className="space-y-3">
        {workflows.length === 0 ? (
          <p className="text-sm text-muted">
            No workflows yet. Load the Riverside demo or ask Iris to build one.
          </p>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="rounded-xl border border-border px-4 py-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{workflow.name}</p>
                  <p className="mt-1 text-muted">{workflow.goal}</p>
                  <p className="mt-2 text-xs text-muted">
                    Trigger: “{workflow.triggerPhrase}” · {workflow.outputType} ·{" "}
                    {workflow.kind}
                  </p>
                  {workflow.latestRun && (
                    <p className="mt-2 text-xs text-muted">
                      Last run: {runSummary(workflow.latestRun.output)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => runWorkflow(workflow.id)}
                >
                  Run
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
