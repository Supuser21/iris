import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "SMS program — Iris",
  description:
    "Iris SMS program details: Twilio number, consent, message frequency, STOP, and HELP.",
};

export default function SmsPage() {
  return (
    <LegalLayout title="SMS program" updated="August 16, 2026">
      <p>
        Iris sends operational SMS from a dedicated US phone number through
        Twilio. This page is the public SMS disclosure for users and carrier
        review.
      </p>

      <h2 id="program" className="scroll-mt-8 text-lg font-semibold text-foreground">
        Program
      </h2>
      <p>
        <strong>Program name:</strong> Iris
      </p>
      <p>
        <strong>What you get:</strong> one-time passcodes, account and
        onboarding texts, job recaps, crew follow-up, teammate invites,
        reminders, and alerts about jobs or connected company data such as
        inventory.
      </p>

      <h2 id="frequency" className="scroll-mt-8 text-lg font-semibold text-foreground">
        Frequency and rates
      </h2>
      <p>
        Message frequency varies. You may get one verification text when you
        sign up, then more when you or your company use Iris.{" "}
        <strong>Message and data rates may apply.</strong> Carriers are not
        liable for delayed or undelivered messages.
      </p>

      <h2 id="opt-in" className="scroll-mt-8 text-lg font-semibold text-foreground">
        How you opt in
      </h2>
      <p>
        Enter your US mobile number at{" "}
        <Link href="/signup" className="underline">
          talkwithiris.xyz/signup
        </Link>{" "}
        and check the box agreeing to Iris SMS. That box links to our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
        . Consent is not a condition of purchase.
      </p>
      <p>
        If a company adds crew or teammate numbers, that company is
        responsible for having consent to text those people through Iris.
      </p>

      <h2 id="opt-out" className="scroll-mt-8 text-lg font-semibold text-foreground">
        STOP and HELP
      </h2>
      <p>
        Reply <strong>STOP</strong> to unsubscribe. Reply <strong>START</strong>{" "}
        to opt back in. Reply <strong>HELP</strong> for help, or email{" "}
        <a className="underline" href="mailto:privacy@talkwithiris.xyz">
          privacy@talkwithiris.xyz
        </a>
        .
      </p>

      <h2 id="sharing" className="scroll-mt-8 text-lg font-semibold text-foreground">
        We do not share numbers for marketing
      </h2>
      <p>
        <strong>
          No mobile information will be shared with third parties or affiliates
          for marketing or promotional purposes.
        </strong>{" "}
        Full details are in the{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
