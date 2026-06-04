import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { hasGoogleOAuth } from "@/lib/env";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.redirect(new URL("/signup", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
  if (!hasGoogleOAuth()) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 503 }
    );
  }
  const url = getGoogleAuthUrl(session.userId);
  return NextResponse.redirect(url);
}
