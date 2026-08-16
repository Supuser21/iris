import Link from "next/link";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-semibold">
            Iris
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-muted">
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
          </nav>
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
        <p className="mt-12 text-sm text-muted">
          <Link href="/legal" className="underline hover:text-foreground">
            Legal
          </Link>
          {" · "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/sms" className="underline hover:text-foreground">
            SMS program
          </Link>
          {" · "}
          <Link href="/" className="underline hover:text-foreground">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
