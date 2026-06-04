import Link from "next/link";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/chat" className="text-sm text-muted hover:text-foreground">
          ← Back to chat
        </Link>
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
