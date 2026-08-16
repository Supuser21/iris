import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { getDemoUrl } from "@/lib/env";

export default function HomePage() {
  const demoUrl = getDemoUrl();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Iris</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={demoUrl} target="_blank" rel="noreferrer">
            <Button size="sm">Book demo</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 text-center md:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-6xl md:leading-tight">
          Iris texts the people
          <br className="hidden sm:block" />
          {" "}
          who weren&apos;t in the meeting.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Pour moved. Super missed the call. Recap goes out after you hit send.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={demoUrl} target="_blank" rel="noreferrer">
            <Button size="lg">Book demo</Button>
          </Link>
          <span className="flex items-center text-sm text-muted">
            15 minutes. No app for the crew.
          </span>
        </div>
        <div className="mt-16 flex justify-center">
          <PhoneMockup />
        </div>
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">
            Follow-up that fits the jobsite.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {features.map((f, i) => (
              <div key={f.title} className="space-y-3">
                <span className="text-sm font-medium text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold">
            Stop paying people to chase jobsite texts.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-border bg-[#f5f4f1] p-8">
              <p className="text-sm font-semibold text-muted">Traditional</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Coordinator chasing texts
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                $4k+ a month
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Typical extra hire, still stuck in group threads
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/85">
                <li>Another salary on top of project overhead</li>
                <li>Updates still live in scattered texts</li>
                <li>Takes weeks to ramp on your jobs</li>
              </ul>
              <Link
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-block"
              >
                <Button variant="secondary">Book demo</Button>
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-accent bg-accent-light/30 p-8">
              <p className="text-sm font-semibold text-accent">With Iris</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                Follow-up over SMS
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Book a demo
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Then we price it around your jobs and crew
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/90">
                <li>Preview every crew text before it sends</li>
                <li>Crew needs no app or login</li>
                <li>Replies come back on the job thread</li>
                <li>Live in days, not weeks</li>
              </ul>
              <Link
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-block"
              >
                <Button>Book demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-accent py-20 text-center text-white">
        <h2 className="text-3xl font-semibold">
          One missed handoff can cost a day.
        </h2>
        <Link
          href={demoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block"
        >
          <Button size="lg" className="bg-white text-accent hover:bg-white/90">
            Book demo
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Iris — follow-up texts for construction.
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Recap while the meeting is still warm",
    body: "Drop in notes or a transcript. Iris pulls out what changed, who missed it, and who needs the update.",
  },
  {
    title: "Preview every crew text before it sends",
    body: "The PM stays in control. Iris drafts the message; you approve the recipients and copy.",
  },
  {
    title: "Replies come back to the PM, on that job",
    body: "Crew can answer by text. Iris keeps the reply with the right job instead of another loose thread.",
  },
  {
    title: "Talk to Iris like a person",
    body: "Use SMS or web to ask what changed, send a recap, or pull up the latest decision.",
  },
];
