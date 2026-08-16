import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold">
          Iris
        </Link>
        <h1 className="mt-8 text-2xl font-semibold">Get started</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your US mobile number (10 digits is fine — no +1 needed). Iris is
          a web workspace plus SMS from our Twilio number.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
