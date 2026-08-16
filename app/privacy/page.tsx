import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — Iris",
  description:
    "How Iris collects, uses, and protects phone numbers, SMS consent, and company data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 16, 2026">
      <p>
        This Privacy Policy describes how Iris, the service operated at{" "}
        <a className="underline" href="https://talkwithiris.xyz">
          talkwithiris.xyz
        </a>{" "}
        (“Iris,” “we,” “us”), collects and uses information. Iris is a SaaS
        product for construction and operations teams. It includes a web
        workspace and SMS from a dedicated US phone number provided through
        Twilio.
      </p>

      <h2 className="text-lg font-semibold text-foreground">
        Information we collect
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Mobile numbers and SMS consent.</strong> When you sign up,
          invite a teammate, or add crew, we collect US mobile numbers so Iris
          can send one-time passcodes, account messages, job updates, follow-up
          texts, and alerts about connected company data.
        </li>
        <li>
          <strong>Account and company data.</strong> Names, company profile,
          jobs, crew roles, notes, documents, meeting transcripts, workflows,
          and messages you send to Iris.
        </li>
        <li>
          <strong>Connected systems.</strong> If you connect inventory, job
          software, email, Drive, Procore, or similar sources, we store the
          data you authorize so you can view it in Iris and so Iris can draft
          or send texts about it.
        </li>
        <li>
          <strong>Usage data.</strong> Log data needed to operate the service,
          including SMS delivery status and inbound replies.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-foreground">How we use SMS</h2>
      <p>
        Iris sends SMS from a Twilio phone number. Message types include
        one-time verification codes, onboarding, morning briefs, job recaps,
        crew follow-up, teammate invites, and notifications about jobs or
        connected data such as inventory. Message frequency varies. Message
        and data rates may apply.
      </p>
      <p>
        Reply <strong>STOP</strong> to opt out of Iris texts. Reply{" "}
        <strong>START</strong> to opt back in. Reply <strong>HELP</strong> for
        help. We also honor carrier-standard opt-out keywords.
      </p>

      <h2 className="text-lg font-semibold text-foreground">
        Mobile information is not shared for marketing
      </h2>
      <p>
        <strong>
          No mobile information will be shared with third parties or affiliates
          for marketing or promotional purposes.
        </strong>{" "}
        We do not sell, rent, or transfer SMS opt-in data, consent, or mobile
        phone numbers to third parties, affiliates, lead generators, or other
        organizations for their marketing. Consent to receive Iris texts is
        collected for Iris only and is not transferable to another sender.
      </p>
      <p>
        We use service providers to operate Iris, including Twilio (SMS
        delivery), Neon (database hosting), and model providers that process
        prompts you send to Iris. These providers process data only to provide
        the service to us. They are not given your number to market their own
        products.
      </p>

      <h2 className="text-lg font-semibold text-foreground">
        Company and inventory data
      </h2>
      <p>
        Job files, crew lists, inventory, and other connected records stay
        scoped to your company org. We use that data to show it in the
        workspace, answer questions in chat, and send SMS you request or
        configure. We do not use another company’s data to serve yours.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Retention</h2>
      <p>
        We keep account, job, and message records while your company uses Iris
        and for a reasonable period afterward to operate the service, meet
        legal requirements, and resolve disputes. You may ask us to delete
        your account and associated mobile number.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Your choices</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Reply STOP on SMS to unsubscribe from Iris texts.</li>
        <li>Crew and users can also be marked opted out in the product.</li>
        <li>
          You can request access or deletion by contacting{" "}
          <a className="underline" href="mailto:privacy@talkwithiris.xyz">
            privacy@talkwithiris.xyz
          </a>
          .
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-foreground">Children</h2>
      <p>
        Iris is a business service. It is not directed to children under 13,
        and we do not knowingly collect information from them.
      </p>

      <h2 className="text-lg font-semibold text-foreground">Contact</h2>
      <p>
        Privacy questions:{" "}
        <a className="underline" href="mailto:privacy@talkwithiris.xyz">
          privacy@talkwithiris.xyz
        </a>
        . Website:{" "}
        <a className="underline" href="https://talkwithiris.xyz">
          https://talkwithiris.xyz
        </a>
        .
      </p>
    </LegalLayout>
  );
}
