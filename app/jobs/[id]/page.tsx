import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { JobWorkspace } from "@/components/jobs/job-workspace";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId) {
    redirect("/signup");
  }

  const { id } = await params;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/jobs" className="text-sm text-muted hover:text-foreground">
              ← Back to jobs
            </Link>
            <p className="mt-2 text-sm text-muted">
              Preview first, then send. Crew replies come back here and to your phone.
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
        <JobWorkspace jobId={id} />
      </div>
    </div>
  );
}
