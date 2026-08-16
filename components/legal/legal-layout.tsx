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
        <Link href="/" className="text-xl font-semibold">
          Iris
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
        <p className="mt-12 text-sm text-muted">
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
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
