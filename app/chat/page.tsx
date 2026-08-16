import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/signup");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          Iris
        </Link>
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/jobs" className="hover:text-foreground">
            Jobs
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
        </nav>
      </header>
      <ChatInterface />
    </div>
  );
}
