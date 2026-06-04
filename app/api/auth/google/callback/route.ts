import { NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google-calendar";
import { getAppUrl } from "@/lib/env";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${getAppUrl()}/settings?error=google`);
  }

  try {
    await exchangeGoogleCode(code, state);
    return NextResponse.redirect(`${getAppUrl()}/settings?connected=google`);
  } catch {
    return NextResponse.redirect(`${getAppUrl()}/settings?error=google`);
  }
}
