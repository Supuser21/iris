import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSms } from "@/lib/twilio";
import { ensureDb } from "@/lib/init";
import { isDevOtpMode } from "@/lib/env";

export async function POST(req: Request) {
  ensureDb();
  const { phone } = await req.json();
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  const code = isDevOtpMode()
    ? "123456"
    : String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(otpCodes).where(eq(otpCodes.phone, normalized));
  await db.insert(otpCodes).values({
    id: nanoid(),
    phone: normalized,
    code,
    expiresAt,
  });

  if (isDevOtpMode()) {
    console.log(`[OTP dev] ${normalized}: ${code}`);
    return NextResponse.json({ ok: true, devCode: code });
  }

  await sendSms(
    normalized,
    `Your Iris code is ${code}. Expires in 10 minutes.`
  );
  return NextResponse.json({ ok: true });
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}
