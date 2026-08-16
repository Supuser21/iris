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
          <Link href="/legal" className="text-muted hover:text-foreground">
            Legal
          </Link>
          <Link href={demoUrl} target="_blank" rel="noreferrer">
            <Button size="sm">Book demo</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 text-center md:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-6xl md:leading-tight">
          The AI assistant
          <br className="hidden sm:block" />
          {" "}
          for construction teams.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Iris drafts the job update, texts the crew, and keeps every reply on
          the right job — so the field hears what changed before it costs you a
          day.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={demoUrl} target="_blank" rel="noreferrer">
            <Button size="lg">Book demo</Button>
          </Link>
          <span className="flex items-center text-sm text-muted">
            15-minute walkthrough on a real job.
          </span>
        </div>
        <div className="mt-16 flex justify-center">
          <PhoneMockup />
        </div>
          <p className="mx-auto mt-6 max-w-xl text-xs text-muted">
            US SMS via Twilio. Message frequency varies. Message and data rates
            may apply. Reply STOP to opt out, HELP for help.
          </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div>
              <p className="text-sm font-medium text-accent">Riverside Apartments</p>
              <h2 className="mt-2 text-2xl font-semibold">Job workspace</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                One place for crew, notes, meeting drafts, and the exact follow-up status.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="font-medium">Mike Alvarez</p>
                  <p className="text-muted">Super · sent · no reply yet</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="font-medium">Jen Walsh</p>
                  <p className="text-muted">PM · sent · replied</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-medium text-accent">Draft review</p>
              <h3 className="mt-2 text-lg font-semibold">Owner call recap</h3>
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                Riverside: pour moved to Thursday 6am. Rebar inspection stays at 9. Delivery slid to 10. Mike missed the call — send him the update and cc Jen.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button>Send recap</Button>
                <span className="text-sm text-muted">You approve before anything goes out.</span>
              </div>
            </div>
          </div>
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

      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">
            Example stories from construction teams.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <figure
                key={review.name}
                className="flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <p className="text-sm font-semibold">{review.name}</p>
                  <p className="text-sm text-muted">{review.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold">
            One price. Iris, plus the work to make it yours.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-border bg-[#f5f4f1] p-8">
              <p className="text-sm font-semibold text-muted">Traditional</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Coordinator chasing texts
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Another hire
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Salary, ramp time, and the same group threads
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
              <p className="text-sm font-semibold text-accent">Iris</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                Product, tools, and sprints
              </h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                $4,000 / month
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Iris plus monthly sprints to make it work like your company.
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-foreground/90">
                <li>Iris for job recaps, crew texts, and follow-up</li>
                <li>
                  Your own chat to build the tools you need from what Iris
                  already connects to
                </li>
                <li>Implementation sprints, the way an agency would run them</li>
                <li>Preview before send. Crew needs no app.</li>
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
        <p>Iris — SaaS workspace and SMS for construction teams.</p>
        <p className="mt-3 flex flex-wrap justify-center gap-4">
          <Link href="/legal" className="hover:text-foreground">
            Legal
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/sms" className="hover:text-foreground">
            SMS
          </Link>
        </p>
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

const reviews = [
  {
    name: "Marcus Hale",
    role: "Owner, Hale & Sons Construction",
    quote:
      "We used to find out a change was missed two days later. Now the recap goes out the same afternoon and I can see who got it.",
  },
  {
    name: "Dana Ruiz",
    role: "Operations, Northline Builders",
    quote:
      "The crew never downloaded anything. They just text back. That was the whole reason this stuck.",
  },
  {
    name: "Chris Pell",
    role: "Project manager, Pell Contracting",
    quote:
      "I still approve every message. Iris drafts it, I send it. The field actually reads it because it sounds like us.",
  },
];
