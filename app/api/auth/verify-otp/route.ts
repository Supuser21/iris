import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { otpCodes, users, messages } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { ensureDb } from "@/lib/init";
import { WELCOME_MESSAGE } from "@/lib/agent/system-prompt";
import { sendSms } from "@/lib/twilio";

export async function POST(req: Request) {
  ensureDb();
  const { phone, code } = await req.json();
  if (!phone || !code) {
    return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, normalized),
        eq(otpCodes.code, String(code).trim()),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);

  if (!user) {
    const id = nanoid();
    await db.insert(users).values({
      id,
      phone: normalized,
      onboardingStep: "welcome",
      onboardingComplete: false,
    });
    [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    await db.insert(messages).values({
      id: nanoid(),
      userId: id,
      role: "assistant",
      content: WELCOME_MESSAGE,
      channel: "web",
    });

    await sendSms(normalized, WELCOME_MESSAGE.split("\n\n")[0] + " Open the app to continue setup.");
  }

  const session = await getSession();
  session.userId = user!.id;
  session.phone = normalized;
  await session.save();

  await db.delete(otpCodes).where(eq(otpCodes.phone, normalized));

  return NextResponse.json({
    ok: true,
    userId: user!.id,
    onboardingComplete: user!.onboardingComplete,
  });
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}
