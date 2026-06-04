"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
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
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      {step === "phone" ? (
        <>
          <label className="block text-sm text-muted">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button className="w-full" onClick={sendOtp} disabled={loading || !phone}>
            Send code
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Enter the code we sent to {phone}
            {devCode && (
              <span className="mt-2 block font-mono text-accent">
                Dev code: {devCode}
              </span>
            )}
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button className="w-full" onClick={verify} disabled={loading || !code}>
            Verify & start
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted hover:text-foreground"
            onClick={() => setStep("phone")}
          >
            Change number
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
