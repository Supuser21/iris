import Link from "next/link";
import type { ReactNode } from "react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { getDemoUrl } from "@/lib/env";

function DemoLink({
  href,
  children,
  inverse = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`inline-flex items-center justify-center rounded-full px-8 py-4 text-lg font-medium transition-colors ${
        inverse
          ? "bg-white text-accent hover:bg-white/90"
          : "bg-accent text-white hover:opacity-90"
      } ${className}`}
    >
      {children}
    </a>
  );
}

export default function HomePage() {
  const demoUrl = getDemoUrl();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Iris</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="text-muted hover:text-foreground">
            Jobs
          </Link>
          <Link href="/chat" className="text-muted hover:text-foreground">
            Chat
          </Link>
          <DemoLink href={demoUrl} className="px-5 py-2 text-sm">
            Book demo
          </DemoLink>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-8 md:pt-16 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            For owners and ops leaders
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl md:leading-tight">
            Standardize job follow-up
            <br />
            without adding more overhead.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Iris reads the handoff, drafts the update, and makes sure the right
            PM, super, or sub gets the text before a missed detail becomes a
            delay. Your team keeps control. Iris keeps the thread moving.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <DemoLink href={demoUrl}>Book demo</DemoLink>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-card"
            >
              See the workflow
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
            <span>Preview before send</span>
            <span>Crew replies route back to the PM</span>
            <span>One thread across every job</span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 text-sm text-muted md:grid-cols-3">
          <div>
            <p className="font-semibold text-foreground">Stops updates from dying in notes</p>
            <p className="mt-1">The recap gets drafted while the meeting is still fresh.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Puts one follow-up standard across jobs</p>
            <p className="mt-1">Same system whether the work lives with PMs, supers, or ops.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Makes the missed handoff visible</p>
            <p className="mt-1">Who was told, who replied, and what changed all stay in one place.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Where construction teams leak time today
          </h2>
          <p className="mt-4 text-lg text-muted">
            Nobody needs another dashboard. They need fewer dropped handoffs,
            fewer “I never got that,” and less follow-up living in one PM&apos;s head.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pains.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            How Iris works on a real job
          </h2>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="space-y-3">
                <span className="text-sm font-medium text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            Less dropped follow-up. Fewer “who told them?”
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-border bg-[#f5f4f1] p-8">
              <p className="text-sm font-semibold text-muted">Without Iris</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Manual coordination
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Slower jobs, shakier handoffs
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Memory, inboxes, and group texts doing operations work
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/85">
                <li>Meeting notes sit in a folder nobody opens</li>
                <li>Schedule changes get relayed inconsistently</li>
                <li>Ops only finds the miss after the delay</li>
              </ul>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-accent bg-accent-light/30 p-8">
              <p className="text-sm font-semibold text-accent">With Iris</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                One AI operations layer
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Faster follow-up, cleaner accountability
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Review first, then ship the right message to the right people
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/90">
                <li>Draft recaps before the handoff gets lost</li>
                <li>Text crews, supers, and PMs from one workflow</li>
                <li>Route replies back to the person running the job</li>
                <li>Keep every job decision searchable later</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-accent py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-semibold md:text-4xl">
            If one missed handoff can cost you a day, the follow-up system matters.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85">
            Book a demo and see how Iris can run recap, crew follow-up, and job
            context across your company.
          </p>
          <DemoLink href={demoUrl} inverse className="mt-8">
            Book demo
          </DemoLink>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Iris — the follow-up layer for construction teams that cannot afford dropped details.
      </footer>
    </div>
  );
}

const pains = [
  {
    title: "The update exists, but the right person never got it",
    body: "A meeting happened, someone took notes, and the field still missed the one change that mattered.",
  },
  {
    title: "Operations depends on whoever happened to be on the call",
    body: "Important follow-up lives in memory, inboxes, and side texts instead of one repeatable operating rhythm.",
  },
  {
    title: "The team only sees the miss after schedule slips",
    body: "By the time someone says “nobody told me,” the cost is already on the job.",
  },
];

const steps = [
  {
    title: "Drop in the meeting notes or transcript",
    body: "Iris reads what changed, who owns it, and which people were not in the room when it happened.",
  },
  {
    title: "Review the recap before it goes out",
    body: "The PM or ops lead edits the message, confirms recipients, and keeps control over every crew text.",
  },
  {
    title: "Keep the job moving from one thread",
    body: "Replies route back to the PM, job context stays searchable, and the next handoff starts from facts instead of guesswork.",
  },
];
