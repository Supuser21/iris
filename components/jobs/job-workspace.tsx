"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Person = {
  id: string;
  name: string;
  role: string | null;
  phone: string;
  smsOptOut: boolean | null;
};

type MeetingExtract = {
  decisions: string[];
  owners: { name: string; task: string }[];
  suggestedAbsenteeIds: string[];
  unmatchedNames: string[];
  draftRecap: string;
};

type Meeting = {
  id: string;
  title: string;
  status: string | null;
  parsedExtract: MeetingExtract;
};

type Snapshot = {
  job: {
    id: string;
    name: string;
    address: string | null;
    status: string | null;
  };
  crew: Person[];
  documents: {
    id: string;
    title: string;
    source: string;
    fileName: string | null;
    mimeType: string | null;
    createdAt: string;
  }[];
  meetings: Meeting[];
  outbound: {
    id: string;
    phone: string;
    body: string;
    status: string;
    reason: string;
    createdAt: string;
    personId: string | null;
  }[];
  replies: {
    id: string;
    phone: string;
    body: string;
    createdAt: string;
    personId: string;
  }[];
};

export function JobWorkspace({ jobId }: { jobId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [crewName, setCrewName] = useState("");
  const [crewRole, setCrewRole] = useState("");
  const [crewPhone, setCrewPhone] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docSource, setDocSource] = useState("note");
  const [docFile, setDocFile] = useState<File | null>(null);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingTranscript, setMeetingTranscript] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  const [draftBodies, setDraftBodies] = useState<Record<string, string>>({});
  const [selectedPeople, setSelectedPeople] = useState<Record<string, string[]>>(
    {}
  );

  async function load() {
    const res = await fetch(`/api/jobs/${jobId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load job");
    setSnapshot(data);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load job")
    );
  }, [jobId]);

  useEffect(() => {
    if (!snapshot) return;
    const nextBodies: Record<string, string> = {};
    const nextSelected: Record<string, string[]> = {};
    for (const meeting of snapshot.meetings) {
      nextBodies[meeting.id] = meeting.parsedExtract.draftRecap;
      nextSelected[meeting.id] = meeting.parsedExtract.suggestedAbsenteeIds;
    }
    setDraftBodies(nextBodies);
    setSelectedPeople(nextSelected);
  }, [snapshot]);

  const crewById = useMemo(() => {
    const map = new Map<string, Person>();
    for (const person of snapshot?.crew ?? []) {
      map.set(person.id, person);
    }
    return map;
  }, [snapshot]);

  const followUpStatus = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.crew.map((person) => {
      const lastOutbound = snapshot.outbound.find(
        (item) => item.personId === person.id || item.phone === person.phone
      );
      const lastReply = snapshot.replies.find(
        (reply) => reply.personId === person.id || reply.phone === person.phone
      );
      return { person, lastOutbound, lastReply };
    });
  }, [snapshot]);

  async function post(path: string, body: unknown) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      await load();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function postForm(path: string, body: FormData) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      await load();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  if (!snapshot) {
    return <p className="text-sm text-muted">Loading job…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-3xl font-semibold tracking-tight">{snapshot.job.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {snapshot.job.address || "No address added yet"} ·{" "}
          {snapshot.job.status || "active"}
        </p>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Keep the crew list tight, feed Iris the notes that matter, then review the
          recap before anyone gets texted.
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

      <section className="grid gap-8 xl:grid-cols-[1fr,1.2fr]">
        <div className="space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-accent">Crew</p>
              <h2 className="mt-2 text-lg font-semibold">Who Iris can reach</h2>
              <p className="mt-2 text-sm text-muted">
                US numbers only. Crew can reply for 7 days after the last Iris text.
              </p>
            </div>
            <div className="space-y-3">
              <input
                value={crewName}
                onChange={(e) => setCrewName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                value={crewRole}
                onChange={(e) => setCrewRole(e.target.value)}
                placeholder="Role (Super, Electrician, PM...)"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                value={crewPhone}
                onChange={(e) => setCrewPhone(e.target.value)}
                placeholder="US phone number"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <Button
                disabled={loading}
                onClick={async () => {
                  const data = await post(`/api/jobs/${jobId}/people`, {
                    name: crewName,
                    role: crewRole,
                    phone: crewPhone,
                  });
                  if (data) {
                    setCrewName("");
                    setCrewRole("");
                    setCrewPhone("");
                    setNotice("Crew member added.");
                  }
                }}
              >
                Add crew member
              </Button>
            </div>
            <div className="space-y-2">
              {snapshot.crew.map((person) => (
                <div
                  key={person.id}
                  className="rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-muted">
                        {person.role || "Crew"} · {person.phone}
                      </p>
                    </div>
                    {person.smsOptOut && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        Opted out
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {snapshot.crew.length === 0 && (
                <p className="text-sm text-muted">No crew added yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-accent">Notes</p>
              <h2 className="mt-2 text-lg font-semibold">What the company has told Iris</h2>
            </div>
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <select
              value={docSource}
              onChange={(e) => setDocSource(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            >
              <option value="note">Note</option>
              <option value="award">Award</option>
              <option value="transcript">Transcript</option>
            </select>
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Paste award notes, scope notes, or other context"
              rows={7}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <div className="rounded-xl border border-dashed border-border bg-background p-4">
              <label className="text-sm font-medium">Upload PDF or image</label>
              <p className="mt-1 text-xs text-muted">
                PDFs are extracted into job context. Images are saved as job files with a note.
              </p>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-sm"
              />
            </div>
            <Button
              disabled={loading}
              onClick={async () => {
                const data = docFile
                  ? await postForm(
                      `/api/jobs/${jobId}/documents`,
                      (() => {
                        const form = new FormData();
                        form.set("title", docTitle);
                        form.set("source", docSource);
                        form.set("file", docFile);
                        return form;
                      })()
                    )
                  : await post(`/api/jobs/${jobId}/documents`, {
                      title: docTitle,
                      content: docContent,
                      source: docSource,
                    });
                if (data) {
                  setDocTitle("");
                  setDocContent("");
                  setDocSource("note");
                  setDocFile(null);
                  setNotice("Job note saved.");
                }
              }}
            >
              {docFile ? "Upload file" : "Save note"}
            </Button>
            <div className="space-y-2 text-sm text-muted">
              {snapshot.documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border px-4 py-3">
                  <p className="font-medium text-foreground">{doc.title}</p>
                  <p>
                    {doc.source}
                    {doc.fileName ? ` · ${doc.fileName}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-accent">Meeting intake</p>
              <h2 className="mt-2 text-lg font-semibold">Turn a transcript into a sendable recap</h2>
            </div>
            <input
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Tuesday owner call"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-medium">Attendees</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {snapshot.crew.map((person) => (
                  <label key={person.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={attendeeIds.includes(person.id)}
                      onChange={(e) =>
                        setAttendeeIds((current) =>
                          e.target.checked
                            ? [...current, person.id]
                            : current.filter((id) => id !== person.id)
                        )
                      }
                    />
                    <span>
                      {person.name}
                      {person.role ? ` (${person.role})` : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <textarea
              value={meetingTranscript}
              onChange={(e) => setMeetingTranscript(e.target.value)}
              placeholder="Paste the Teams transcript or meeting notes"
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <Button
              disabled={loading}
              onClick={async () => {
                const data = await post(`/api/jobs/${jobId}/meetings`, {
                  title: meetingTitle,
                  transcript: meetingTranscript,
                  attendeePersonIds: attendeeIds,
                });
                if (data) {
                  setMeetingTitle("");
                  setMeetingTranscript("");
                  setAttendeeIds([]);
                  setNotice("Meeting draft created.");
                }
              }}
            >
              Process meeting
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-accent">Draft review</p>
              <h2 className="mt-2 text-lg font-semibold">Review before send</h2>
              <p className="mt-2 text-sm text-muted">
                Iris suggests the recap and recipients. You decide what goes out.
              </p>
            </div>
            {snapshot.meetings.length === 0 && (
              <p className="text-sm text-muted">
                Process a transcript and Iris will draft the recap before anything gets sent.
              </p>
            )}
            {snapshot.meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-2xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-muted">{meeting.status || "draft"}</p>
                  </div>
                  {meeting.status === "sent" && (
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      Sent
                    </span>
                  )}
                </div>

                {meeting.parsedExtract.decisions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Decisions</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {meeting.parsedExtract.decisions.map((decision, index) => (
                        <li key={index}>- {decision}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.parsedExtract.owners.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Owners</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {meeting.parsedExtract.owners.map((owner, index) => (
                        <li key={index}>
                          {owner.name}: {owner.task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.parsedExtract.unmatchedNames.length > 0 && (
                  <p className="text-sm text-amber-700">
                    Not on crew yet: {meeting.parsedExtract.unmatchedNames.join(", ")}
                  </p>
                )}

                <textarea
                  value={draftBodies[meeting.id] ?? ""}
                  onChange={(e) =>
                    setDraftBodies((current) => ({
                      ...current,
                      [meeting.id]: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Recipients</p>
                  {snapshot.crew.map((person) => (
                    <label key={person.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(selectedPeople[meeting.id] ?? []).includes(person.id)}
                        onChange={(e) =>
                          setSelectedPeople((current) => {
                            const next = current[meeting.id] ?? [];
                            return {
                              ...current,
                              [meeting.id]: e.target.checked
                                ? [...next, person.id]
                                : next.filter((id) => id !== person.id),
                            };
                          })
                        }
                      />
                      <span className="flex items-center gap-2">
                        {person.name}
                        {person.role ? ` (${person.role})` : ""}
                        {meeting.parsedExtract.suggestedAbsenteeIds.includes(person.id) && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            Suggested
                          </span>
                        )}
                        {person.smsOptOut && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Opted out
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>

                {meeting.status !== "sent" && (
                  <Button
                    disabled={loading}
                    onClick={async () => {
                      const data = await post(`/api/jobs/${jobId}/meetings/${meeting.id}/send`, {
                        personIds: selectedPeople[meeting.id] ?? [],
                        body: draftBodies[meeting.id] ?? "",
                      });
                      if (data) setNotice("Recap sent.");
                    }}
                  >
                    Send
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-accent">Follow-up status</p>
              <h2 className="mt-2 text-lg font-semibold">Who got it and who replied</h2>
              <p className="mt-2 text-sm text-muted">
                Uses the latest Iris text and crew reply on this job.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              {followUpStatus.map(({ person, lastOutbound, lastReply }) => (
                <div
                  key={person.id}
                  className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-muted">
                      {person.role || "Crew"} · {person.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {lastOutbound ? lastOutbound.status : "not sent"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        lastReply
                          ? "bg-accent/10 text-accent"
                          : "bg-[#f5f4f1] text-muted"
                      }`}
                    >
                      {lastReply ? "replied" : "no reply"}
                    </span>
                  </div>
                </div>
              ))}
              {followUpStatus.length === 0 && (
                <p className="text-muted">Add crew to see follow-up status.</p>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-accent">Activity</p>
                <h2 className="mt-2 text-lg font-semibold">Outbound texts</h2>
              </div>
              <div className="space-y-3 text-sm">
                {snapshot.outbound.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-3">
                    <p className="font-medium">{item.phone}</p>
                    <p className="text-muted">{item.reason} · {item.status}</p>
                    <p className="mt-2 whitespace-pre-wrap">{item.body}</p>
                  </div>
                ))}
                {snapshot.outbound.length === 0 && (
                  <p className="text-muted">Nothing sent yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-accent">Activity</p>
                <h2 className="mt-2 text-lg font-semibold">Crew replies</h2>
              </div>
              <div className="space-y-3 text-sm">
                {snapshot.replies.map((reply) => (
                  <div key={reply.id} className="rounded-xl border border-border p-3">
                    <p className="font-medium">
                      {crewById.get(reply.personId)?.name ?? reply.phone}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{reply.body}</p>
                  </div>
                ))}
                {snapshot.replies.length === 0 && (
                  <p className="text-muted">No crew replies yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
