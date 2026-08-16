import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { JobsHome } from "@/components/jobs/jobs-home";

export default async function JobsPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/signup");
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Iris
            </Link>
            <p className="mt-2 text-sm text-muted">
              Jobs, crew, meeting recaps, and who needs the text.
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/chat" className="hover:text-foreground">
              Chat
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
          </nav>
        </header>
        <JobsHome />
      </div>
    </div>
  );
}
