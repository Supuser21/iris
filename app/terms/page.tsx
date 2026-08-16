import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Iris",
  description:
    "Terms for the Iris SaaS workspace and SMS program, including STOP and HELP.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="August 16, 2026">
      <p>
        These Terms of Service (“Terms”) govern use of Iris, the SaaS product
        at{" "}
        <a className="underline" href="https://talkwithiris.xyz">
          talkwithiris.xyz
        </a>
        , including the web workspace and SMS sent from our US phone number
        through Twilio. By creating an account, requesting a verification
        code, or using Iris, you agree to these Terms and our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold text-foreground">The service</h2>
      <p>
        Iris is a software-as-a-service operations layer for construction and
        similar field businesses. You can manage jobs, crew, notes, meetings,
        and workflows in the web app; connect company data such as inventory
        or job systems; and have Iris draft or send SMS about that work. SMS
        is part of the product, not a separate marketing list.
      </p>

      <h2 className="text-lg font-semibold text-foreground">SMS program</h2>
      <p>
        <strong>Program name:</strong> Iris
      </p>
      <p>
        <strong>Program description:</strong> Iris texts US mobile numbers for
        one-time passcodes, account and onboarding messages, job recaps, crew
        follow-up, teammate invites, reminders, and alerts about jobs or
        connected company data (including inventory when you connect it).
      </p>
      <p>
        <strong>Message frequency:</strong> Varies. You may receive one
        verification text when you sign up, then additional messages when you
        or your company use Iris (for example a recap you approve, a morning
        brief you enable, or an inventory or job alert you configure).
      </p>
      <p>
        <strong>Message and data rates may apply.</strong> Carriers are not
        liable for delayed or undelivered messages.
      </p>
      <p>
        <strong>Opt out:</strong> Reply <strong>STOP</strong> to any Iris text
        to unsubscribe. You will receive a confirmation. After that, Iris will
        not text that number unless you reply <strong>START</strong> or opt in
        again.
      </p>
      <p>
        <strong>Help:</strong> Reply <strong>HELP</strong> for help, or email{" "}
        <a className="underline" href="mailto:privacy@talkwithiris.xyz">
          privacy@talkwithiris.xyz
        </a>
        .
      </p>
      <p>
        Supported carriers include major US wireless carriers. Availability
        may vary by carrier.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Consent</h2>
      <p>
        Providing your mobile number on the signup page and requesting a code
        is your consent to receive Iris SMS as described above. Consent is not
        a condition of purchasing any good or service. You can use the web
        workspace after signup even if you later opt out of SMS.
      </p>
      <p>
        If you add crew, invite teammates, or import phone numbers, you
        represent that each person is a US mobile subscriber who consented to
        receive these operational texts from your company through Iris, or
        that you have another lawful basis to contact them. You are
        responsible for those numbers and for honoring STOP requests.
      </p>
      <p>
        We do not share mobile opt-in data with third parties or affiliates
        for marketing or promotional purposes. See the{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold text-foreground">
        Connected data and inventory
      </h2>
      <p>
        You may upload files or connect systems (inventory, Procore, Drive,
        email, and similar). You keep ownership of that data. You grant Iris a
        limited license to host, display, and process it so the product can
        show it to your team and so Iris can draft or send messages you
        request. You are responsible for having the rights to share that data
        with us.
      </p>
      <p>
        Iris may use AI models to draft recaps, answers, and workflows. You
        should review outbound crew texts before they send. Do not rely on
        Iris as the only record for safety-critical or contractual decisions.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
      <p>
        You must provide a valid US mobile number and keep your account
        information accurate. You are responsible for activity under your
        company org, including invited PMs.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Fees</h2>
      <p>
        Paid plans, including the current commercial package, are described on
        the website or in an order. SMS carrier fees on the recipient’s plan
        are separate from Iris subscription fees.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
      <p>
        Do not use Iris to send spam, marketing blasts unrelated to your
        operations, unlawful content, or messages to people who have not
        consented. Do not use Iris to evade carrier or Twilio rules. We may
        suspend accounts that create compliance risk.
      </p>

      <h2 className="text-lg font-semibold text-foreground">
        Disclaimers and liability
      </h2>
      <p>
        Iris is provided “as is.” We do not warrant uninterrupted SMS
        delivery. To the fullest extent allowed by law, our liability for
        claims relating to the service is limited to the fees you paid us in
        the three months before the claim. We are not liable for jobsite
        delays, missed deliveries, or carrier filtering.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Changes</h2>
      <p>
        We may update these Terms. The updated date above will change. Material
        SMS-program changes will be posted on this page.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Contact</h2>
      <p>
        <a className="underline" href="mailto:privacy@talkwithiris.xyz">
          privacy@talkwithiris.xyz
        </a>{" "}
        ·{" "}
        <a className="underline" href="https://talkwithiris.xyz">
          https://talkwithiris.xyz
        </a>
      </p>
    </LegalLayout>
  );
}
