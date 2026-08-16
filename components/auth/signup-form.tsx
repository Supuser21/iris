"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay, isValidUsPhone } from "@/lib/phone";

export function SignupForm() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  async function sendOtp() {
    setError("");
    if (!isValidUsPhone(phoneInput)) {
      setError("Enter your 10-digit US number (e.g. 4155550123)");
      return;
    }
    if (!smsConsent) {
      setError("Confirm you agree to receive SMS from Iris");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.phone) setPhoneE164(data.phone);
      if (data.devCode) setDevCode(data.devCode);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneE164 || phoneInput.trim(),
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      if (!data.onboardingComplete && data.smsOnboardingSent) {
        alert(
          "You're in! Check your phone — Iris just texted you. Reply with your name to finish setup."
        );
      } else if (!data.onboardingComplete) {
        alert(
          "You're in! We couldn't send the setup text — finish setup in chat or try signup again."
        );
      }
      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  const displayPhone = phoneE164
    ? formatPhoneDisplay(phoneE164)
    : phoneInput.trim()
      ? formatPhoneDisplay(phoneInput)
      : "";

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      {step === "phone" ? (
        <>
          <label className="block text-sm text-muted" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="4155550123"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <p className="text-xs text-muted">
            US numbers only — enter 10 digits, with or without spaces or dashes.
          </p>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to receive SMS from Iris, including a one-time code, account
              messages, job updates, and alerts about connected company data.
              Message frequency varies. Message and data rates may apply. Reply
              STOP to opt out, HELP for help.{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms
              </a>
              .
            </span>
          </label>
          <Button
            className="w-full"
            onClick={sendOtp}
            disabled={loading || !phoneInput.trim() || !smsConsent}
          >
            Send code
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Enter the code we sent to {displayPhone}
            {devCode && (
              <span className="mt-2 block font-mono text-accent">
                Dev code: {devCode}
              </span>
            )}
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button className="w-full" onClick={verify} disabled={loading || !code}>
            Verify & start
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted hover:text-foreground"
            onClick={() => {
              setStep("phone");
              setPhoneE164("");
              setDevCode(null);
              setCode("");
            }}
          >
            Change number
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
