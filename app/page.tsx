import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/phone-mockup";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Iris</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/chat" className="text-muted hover:text-foreground">
            Chat
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 text-center md:pt-16">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl md:leading-tight">
          Your personal
          <br />
          AI executive assistant
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Iris texts you what you need before you need it. Reminders, tasks, and
          your day — handled.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <span className="flex items-center text-sm text-muted">
            Try free. No app needed. 5 minutes to get started.
          </span>
        </div>
        <div className="mt-16 flex justify-center">
          <PhoneMockup />
        </div>
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">
            A day, run by Iris.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {features.map((f, i) => (
              <div key={f.title} className="space-y-3">
                <span className="text-sm font-medium text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-semibold">
            Executive assistance for the rest of us.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-border bg-[#f5f4f1] p-8">
              <p className="text-sm font-semibold text-muted">Traditional</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Executive assistant
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                $300 a month
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Typical in-house or agency hire
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/85">
                <li>For CEOs and the top 1%</li>
                <li>Works 40 hours a week</li>
                <li>Takes weeks to onboard</li>
              </ul>
              <Link href="/signup" className="mt-8 inline-block">
                <Button variant="secondary">Subscribe now</Button>
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-accent bg-accent-light/30 p-8">
              <p className="text-sm font-semibold text-accent">With Iris</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                AI executive assistant
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                7-day free trial
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Then free during beta
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/90">
                <li>For everyone</li>
                <li>Works 24/7</li>
                <li>Set up in 5 minutes</li>
                <li>Reminders on anything — calendar optional</li>
              </ul>
              <Link href="/signup" className="mt-8 inline-block">
                <Button>Try Iris free</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-accent py-20 text-center text-white">
        <h2 className="text-3xl font-semibold">
          Your 24/7 assistant is one text away.
        </h2>
        <Link href="/signup" className="mt-8 inline-block">
          <Button
            size="lg"
            className="bg-white text-accent hover:bg-white/90"
          >
            Get started
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Iris — Personal AI Executive Assistant · Free beta
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Your day, triaged before you're awake",
    body: "Morning briefs with calendar, tasks, and heads-ups — texted at the time you choose.",
  },
  {
    title: "Reminders on anything",
    body: "Tell Iris what to remember. She texts you when it's time — birthdays, errands, follow-ups.",
  },
  {
    title: "Life admin you keep dropping",
    body: "Birthdays, renewals, gift ideas — Iris remembers what you told her once.",
  },
  {
    title: "Just talk to Iris like a person",
    body: "Short, human texts over SMS or web. Same memory, same assistant.",
  },
];
