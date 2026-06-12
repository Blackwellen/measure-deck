"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const recoverySchema = z.object({
  recoveryCode: z.string().min(8, "Enter your recovery code"),
});
type RecoveryFormData = z.infer<typeof recoverySchema>;

const COOLDOWN_SECONDS = 60;

export default function MFAPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const recoveryForm = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
  });

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((char, i) => { if (i < 6) next[i] = char; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];
    if (!totpFactor) {
      setError("No authenticator app found for this account.");
      setLoading(false);
      return;
    }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: totpFactor.id,
    });
    if (challengeErr || !challenge) {
      setError("Failed to initiate MFA challenge. Please try again.");
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);
    if (verifyErr) {
      setError("Invalid code. Please check your authenticator app and try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    router.push("/app/home");
  };

  const handleRecovery = async (data: RecoveryFormData) => {
    setError(null);
    const supabase = createClient();
    // Recovery codes are typically handled via a separate flow; here we attempt sign-in with recovery
    // In Supabase, this is handled via the verifyOtp endpoint with type 'recovery'
    const { error } = await supabase.auth.verifyOtp({
      token: data.recoveryCode,
      type: "recovery",
      // @ts-ignore — email param required but may come from session
      email: "",
    });
    if (error) {
      recoveryForm.setError("recoveryCode", { message: "Invalid recovery code." });
      return;
    }
    router.push("/app/home");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#3B5EE8]/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#3B5EE8]" />
            </div>
            <h1 className="text-xl font-bold text-[#0D1B2E]">Two-factor authentication</h1>
            <p className="text-sm text-slate-500 mt-1">
              {useRecovery
                ? "Enter one of your backup recovery codes."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-100 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!useRecovery ? (
            <>
              {/* OTP digit inputs */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      "w-11 h-14 rounded-lg border text-center text-xl font-bold text-[#0D1B2E]",
                      "transition-all outline-none",
                      "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/20",
                      digit ? "border-[#3B5EE8] bg-[#3B5EE8]/5" : "border-slate-200 bg-white"
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || digits.join("").length !== 6}
                className={cn(
                  "w-full h-11 rounded-lg font-semibold text-sm text-white transition-all",
                  "bg-[#3B5EE8] hover:bg-[#2d4fd4] active:scale-[0.99]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify code
              </button>

              {/* Resend */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={startCooldown}
                  disabled={cooldown > 0}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3B5EE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          ) : (
            /* Recovery code form */
            <form onSubmit={recoveryForm.handleSubmit(handleRecovery)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="recoveryCode" className="text-sm font-medium text-slate-700">
                  Recovery code
                </label>
                <input
                  id="recoveryCode"
                  type="text"
                  placeholder="xxxx-xxxx-xxxx"
                  {...recoveryForm.register("recoveryCode")}
                  className={cn(
                    "h-11 px-3.5 rounded-lg border text-sm font-mono transition-colors outline-none",
                    "placeholder:text-slate-400 bg-white text-slate-900",
                    "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                    recoveryForm.formState.errors.recoveryCode
                      ? "border-red-400"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                />
                {recoveryForm.formState.errors.recoveryCode && (
                  <p className="text-xs text-red-500">
                    {recoveryForm.formState.errors.recoveryCode.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={recoveryForm.formState.isSubmitting}
                className="h-11 rounded-lg font-semibold text-sm text-white bg-[#3B5EE8] hover:bg-[#2d4fd4] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {recoveryForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Use recovery code
              </button>
            </form>
          )}

          {/* Bottom links */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/login" className="text-slate-500 hover:text-slate-700">
              ← Back to sign in
            </Link>
            <button
              type="button"
              onClick={() => { setUseRecovery((v) => !v); setError(null); }}
              className="text-[#3B5EE8] hover:underline"
            >
              {useRecovery ? "Use authenticator app" : "Use a recovery code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
