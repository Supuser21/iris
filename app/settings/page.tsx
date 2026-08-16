import Link from "next/link";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="flex gap-4 text-sm text-muted">
          <Link href="/jobs" className="hover:text-foreground">
            ← Back to jobs
          </Link>
          <Link href="/chat" className="hover:text-foreground">
            Chat
          </Link>
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Connect what you want — or stay in reminders-only mode.
        </p>
        <div className="mt-8">
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
