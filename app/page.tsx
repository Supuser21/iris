import type { ReactNode } from "react";
import { PhoneMockup, TextScene } from "@/components/landing/phone-mockup";
import { getDemoUrl } from "@/lib/env";

function DemoLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`landing-cta px-8 py-4 text-lg ${className}`}
    >
      {children}
    </a>
  );
}

const TICKER = [
  "pour Thursday 6am",
  "cc Jen",
  "rebar flagged",
  "delivery slid to 10",
  "inspection still 9",
  "deck revision today",
  "Mike missed the call",
  "send it",
];

function TickerRow() {
  return (
    <div className="flex items-center gap-12">
      {TICKER.map((t) => (
        <span key={t} className="flex items-center gap-12">
          <span className="text-sm text-white/35 sm:text-base">{t}</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const demoUrl = getDemoUrl();

  return (
    <div className="landing min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="landing-display text-2xl">Iris</span>
        <nav className="flex items-center gap-6 text-sm">
          <DemoLink href={demoUrl} className="px-5 py-2 text-sm">
            Book demo
          </DemoLink>
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 pb-16 pt-14 md:pt-20">
        <div className="landing-marquee absolute inset-x-0 top-8 hidden md:block">
          <div className="landing-marquee-track">
            <TickerRow />
            <TickerRow />
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-16 md:pt-24 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h1 className="landing-display text-5xl leading-[0.98] md:text-7xl">
              Iris texts the people
              <br />
              who weren’t in the meeting.
            </h1>
            <p className="landing-muted mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
              Pour moved. Super missed the call. Recap goes out after you hit
              send.
            </p>
            <div className="mt-10">
              <DemoLink href={demoUrl}>Book demo</DemoLink>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      <section className="border-t border-[#26241f] px-6 py-28 md:py-36">
        <div className="mx-auto max-w-4xl">
          <h2 className="landing-display text-4xl leading-tight md:text-6xl">
            Iris fits the jobsite,
            <br />
            not the other way around.
          </h2>
          <div className="landing-muted mt-12 space-y-6 text-xl leading-relaxed md:text-2xl">
            <p>Lives in SMS — no app for the crew.</p>
            <p>You preview every text before it sends.</p>
            <p>Replies come back to the PM, on that job.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#26241f] px-6 py-28 md:py-36">
        <div className="mx-auto max-w-3xl">
          <h2 className="landing-display text-4xl leading-tight md:text-6xl">
            The pour moved Thursday.
            <br />
            Here’s what the field got.
          </h2>
          <TextScene className="mt-12" />
        </div>
      </section>

      <section className="border-t border-[#26241f] px-6 py-32 text-center md:py-44">
        <div className="mx-auto max-w-4xl">
          <h2 className="landing-display text-4xl leading-tight md:text-6xl">
            One missed handoff
            <br />
            can cost a day.
          </h2>
          <div className="mt-12">
            <DemoLink href={demoUrl}>Book demo</DemoLink>
          </div>
        </div>
      </section>

      <footer className="landing-muted border-t border-[#26241f] px-6 py-8 text-center text-sm">
        Iris — the follow-up text for construction.
      </footer>
    </div>
  );
}
