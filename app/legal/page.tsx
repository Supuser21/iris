import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Legal — Iris",
  description:
    "Public links for Iris privacy, terms, and SMS program pages.",
};

const LINKS = [
  {
    href: "/privacy",
    url: "https://talkwithiris.xyz/privacy",
    name: "Privacy Policy",
    use: "Twilio PrivacyPolicyUrl. How we collect phone numbers and company data.",
  },
  {
    href: "/terms",
    url: "https://talkwithiris.xyz/terms",
    name: "Terms of Service",
    use: "Twilio TermsAndConditionsUrl. SaaS use, SMS program, STOP and HELP.",
  },
  {
    href: "/sms",
    url: "https://talkwithiris.xyz/sms",
    name: "SMS program",
    use: "Short SMS disclosure for campaign review: consent, frequency, STOP, HELP.",
  },
  {
    href: "/signup",
    url: "https://talkwithiris.xyz/signup",
    name: "Signup / opt-in",
    use: "Where users enter a US number and check the SMS consent box.",
  },
];

export default function LegalPage() {
  return (
    <LegalLayout title="Legal" updated="August 16, 2026">
      <p>
        Use these public pages when a carrier, Twilio, or a customer asks for
        a policy link. No login is required.
      </p>

      <div className="space-y-4">
        {LINKS.map((item) => (
          <section
            key={item.href}
            className="rounded-2xl border border-border bg-card px-5 py-4"
          >
            <h2 className="text-base font-semibold text-foreground">
              <Link href={item.href} className="hover:underline">
                {item.name}
              </Link>
            </h2>
            <p className="mt-2 text-muted">{item.use}</p>
            <p className="mt-3 break-all font-mono text-xs text-accent">
              {item.url}
            </p>
          </section>
        ))}
      </div>

      <h2 id="twilio" className="scroll-mt-8 text-lg font-semibold text-foreground">
        Twilio campaign fields
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>PrivacyPolicyUrl:</strong> https://talkwithiris.xyz/privacy
        </li>
        <li>
          <strong>TermsAndConditionsUrl:</strong> https://talkwithiris.xyz/terms
        </li>
        <li>
          <strong>Message flow / opt-in:</strong> Users opt in at
          https://talkwithiris.xyz/signup by entering a US mobile number and
          checking the SMS consent box, which links to the Privacy Policy and
          Terms. See https://talkwithiris.xyz/sms
        </li>
      </ul>
    </LegalLayout>
  );
}
