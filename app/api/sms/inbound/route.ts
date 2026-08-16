import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboundReplies, users, type User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";
import {
  advanceOnboarding,
  applyOnboardingUpdates,
  getOnboardingSmsNudge,
} from "@/lib/onboarding";
import { runIrisAgent, saveMessage, sendLookupAck } from "@/lib/agent/run";
import {
  isBriefSendConfirmation,
  needsWebLookup,
} from "@/lib/agent/lookup";
import { getAppUrl } from "@/lib/env";
import { getLatestCrewContext } from "@/lib/construction";
import { sendSms } from "@/lib/sms";
import { handleSmsCompliance } from "@/lib/sms/compliance";
import { parseInboundSms } from "@/lib/sms/inbound";
import { normalizePhone } from "@/lib/phone";
import { nanoid } from "nanoid";

/** Agent + tools can exceed default 10s on Vercel Hobby. */
export const maxDuration = 60;

export async function POST(req: Request) {
  await ensureDb();
  const parsed = await parseInboundSms(req);
  if (!parsed) {
    console.warn("[sms/inbound] invalid payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const from = normalizePhone(parsed.from);
  const { body } = parsed;
  if (!from) {
    console.warn("[sms/inbound] could not normalize from:", parsed.from);
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, from))
      .limit(1);

    const crewContext = await getLatestCrewContext(from);

    const compliance = await handleSmsCompliance(from, body, user?.id);
    if (compliance.handled) return twimlEmpty();

    if (
      crewContext &&
      (!user || crewContext.org.ownerUserId !== user.id)
    ) {
      await relayCrewReply(crewContext, body);
      return twimlEmpty();
    }

    if (!user) {
      const signupUrl = `${getAppUrl()}/signup`;
      await sendSms(
        from,
        `Hey — I'm Iris. Sign up first so I know it's you: ${signupUrl} Then text me anytime.`,
        { bypassOptOut: true }
      );
      return twimlEmpty();
    }

    if (user.smsOptOut) {
      return twimlEmpty();
    }

    if (!user.onboardingComplete) {
      const { updates } = await advanceOnboarding(user, body);
      const advanced = Object.keys(updates).length > 0;
      if (advanced) {
        await applyOnboardingUpdates(user.id, updates);
      }
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      const agentUser = updated ?? user;

      if (!advanced) {
        const nudge = getOnboardingSmsNudge(agentUser);
        if (nudge) {
          await saveMessage(agentUser.id, "user", body, "sms");
          await saveMessage(agentUser.id, "assistant", nudge, "sms");
          await sendSms(from, nudge);
          return twimlEmpty();
        }
      }

      await replyViaSms(agentUser, from, body);
      return twimlEmpty();
    }

    await replyViaSms(user, from, body);
    return twimlEmpty();
  } catch (err) {
    console.error("[sms/inbound] handler failed", { from, err });
    try {
      await sendSms(
        from,
        "Sorry — I hit a snag. Try again in a moment or message from the web chat."
      );
    } catch (sendErr) {
      console.error("[sms/inbound] fallback SMS failed", sendErr);
    }
    return twimlEmpty();
  }
}

async function replyViaSms(user: User, from: string, body: string) {
  if (user.smsOptOut) return;

  const lookup = needsWebLookup(body);
  if (lookup) {
    await saveMessage(user.id, "user", body, "sms");
    const ack = await sendLookupAck(user.id, "sms");
    await sendSms(from, truncateSms(ack));
  }

  const { text, smsSent } = await runIrisAgent(user, body, "sms", {
    skipUserSave: lookup,
  });

  if (smsSent && isBriefSendConfirmation(text)) return;

  const outbound = text.trim();
  if (!outbound) {
    if (smsSent) return;
    console.warn("[sms/inbound] empty agent reply, sending fallback", {
      userId: user.id,
    });
    await sendSms(
      from,
      "Sorry — I didn't get a reply out. Try again in a moment."
    );
    return;
  }
  if (smsSent && outbound.length < 80) return;

  await sendSms(from, truncateSms(outbound));
}

async function relayCrewReply(
  context: NonNullable<Awaited<ReturnType<typeof getLatestCrewContext>>>,
  body: string
) {
  await db.insert(inboundReplies).values({
    id: nanoid(),
    jobId: context.job.id,
    personId: context.person.id,
    phone: context.person.phone,
    body,
    relayedToUserId: context.org.ownerUserId,
  });

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.id, context.org.ownerUserId))
    .limit(1);
  if (!owner) return;

  const relayText = `${context.person.name} on ${context.job.name}: ${body}`;
  await sendSms(owner.phone, truncateSms(relayText));
}

function truncateSms(text: string, max = 320): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function twimlEmpty() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });
}
