"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSentEmail(data.email);
    setSuccess(true);
  };

  return (
    <div className="flex min-h-screen">
      <div className="lg:w-[45%] xl:w-[40%] flex-shrink-0">
        <BrandPanel />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/measuredeck-logo-DB_Uf-KZ.png"
              alt="MeasureDeck"
              className="h-8 object-contain"
            />
          </div>

          {!success ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0D1B2E] tracking-tight">Reset your password</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your email address and we&apos;ll send you a reset link.
                </p>
              </div>

              {submitError && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...register("email")}
                    className={cn(
                      "h-11 px-3.5 rounded-lg border text-sm transition-colors outline-none",
                      "placeholder:text-slate-400 bg-white text-slate-900",
                      "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                      errors.email
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "h-11 rounded-lg font-semibold text-sm text-white transition-all",
                    "bg-[#3B5EE8] hover:bg-[#2d4fd4] active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send reset link
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Remember your password?{" "}
                <Link href="/login" className="text-[#3B5EE8] font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-8 h-8 text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D1B2E]">Check your email</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-slate-700">{sentEmail}</span>. The link
                expires in 1 hour.
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-[#3B5EE8] hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-[#3B5EE8] font-medium hover:underline"
              >
                Return to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
