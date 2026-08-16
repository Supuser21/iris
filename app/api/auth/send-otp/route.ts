import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSms } from "@/lib/sms";
import { ensureDb } from "@/lib/init";
import { isDevOtpMode } from "@/lib/env";
import { isValidUsPhone, normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  await ensureDb();
  const { phone } = await req.json();
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  if (!isValidUsPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid US phone number (10 digits)" },
      { status: 400 }
    );
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
    return NextResponse.json({ ok: true, devCode: code, phone: normalized });
  }

  await sendSms(
    normalized,
    `Your Iris code is ${code}. Expires in 10 minutes.`,
    { bypassOptOut: true }
  );
  return NextResponse.json({ ok: true, phone: normalized });
}
