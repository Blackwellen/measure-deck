"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
type LoginFormData = z.infer<typeof loginSchema>;

const mfaSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});
type MFAFormData = z.infer<typeof mfaSchema>;

type AuthError = "invalid_credentials" | "account_suspended" | "email_not_verified" | "mfa_required" | "generic";

const errorMessages: Record<AuthError, string> = {
  invalid_credentials: "Incorrect email or password. Please try again.",
  account_suspended: "Your account has been suspended. Contact support at support@measuredeck.com.",
  email_not_verified: "Please verify your email before signing in. Check your inbox for the confirmation link.",
  mfa_required: "Two-factor authentication is required for your account.",
  generic: "Something went wrong. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/app/home";

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const mfaForm = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (!error) {
      router.push(redirectTo);
      return;
    }

    const msg = error.message.toLowerCase();
    if (msg.includes("mfa") || msg.includes("aal")) {
      setSavedEmail(data.email);
      setMfaStep(true);
      return;
    }
    if (msg.includes("email not confirmed") || msg.includes("not verified")) {
      setAuthError("email_not_verified");
    } else if (msg.includes("suspended") || msg.includes("banned")) {
      setAuthError("account_suspended");
    } else if (msg.includes("invalid") || msg.includes("credentials")) {
      setAuthError("invalid_credentials");
    } else {
      setAuthError("generic");
    }
  };

  const onMFASubmit = async (data: MFAFormData) => {
    setMfaLoading(true);
    const supabase = createClient();
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: "totp" });

    if (challengeError || !challengeData) {
      setAuthError("generic");
      setMfaLoading(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: "totp",
      challengeId: challengeData.id,
      code: data.otp,
    });

    setMfaLoading(false);
    if (error) {
      mfaForm.setError("otp", { message: "Invalid code. Try again." });
      return;
    }
    router.push(redirectTo);
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

          {!mfaStep ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0D1B2E] tracking-tight">
                  Sign in to MeasureDeck
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Welcome back — enter your credentials to continue.
                </p>
              </div>

              {authError && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{errorMessages[authError]}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                {/* Email */}
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

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#3B5EE8] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register("password")}
                      className={cn(
                        "h-11 w-full px-3.5 pr-11 rounded-lg border text-sm transition-colors outline-none",
                        "placeholder:text-slate-400 bg-white text-slate-900",
                        "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                        errors.password
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register("rememberMe")}
                    className="w-4 h-4 rounded border-slate-300 text-[#3B5EE8] accent-[#3B5EE8]"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-slate-600 select-none cursor-pointer">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit */}
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
                  Sign in
                </button>

                {/* SSO divider */}
                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* SSO button */}
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-lg border border-slate-200 text-sm font-medium text-slate-700",
                    "hover:bg-slate-50 hover:border-slate-300 transition-colors",
                    "flex items-center justify-center gap-2.5"
                  )}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <rect width="11" height="11" x="1" y="1" rx="1.5" fill="#F35325" />
                    <rect width="11" height="11" x="13" y="1" rx="1.5" fill="#81BC06" />
                    <rect width="11" height="11" x="1" y="13" rx="1.5" fill="#05A6F0" />
                    <rect width="11" height="11" x="13" y="13" rx="1.5" fill="#FFBA08" />
                  </svg>
                  Continue with Microsoft SSO
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#3B5EE8] font-medium hover:underline">
                  Create account
                </Link>
              </p>
            </>
          ) : (
            /* MFA Step */
            <>
              <div className="mb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#3B5EE8]/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#3B5EE8]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0D1B2E]">Two-factor authentication</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <form
                onSubmit={mfaForm.handleSubmit(onMFASubmit)}
                className="flex flex-col gap-5"
                noValidate
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="otp" className="text-sm font-medium text-slate-700">
                    Authentication code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    {...mfaForm.register("otp")}
                    className={cn(
                      "h-12 px-4 rounded-lg border text-xl tracking-[0.4em] text-center font-mono transition-colors outline-none",
                      "placeholder:text-slate-300 bg-white text-slate-900",
                      "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                      mfaForm.formState.errors.otp
                        ? "border-red-400"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  />
                  {mfaForm.formState.errors.otp && (
                    <p className="text-xs text-red-500">{mfaForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="h-11 rounded-lg font-semibold text-sm text-white bg-[#3B5EE8] hover:bg-[#2d4fd4] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {mfaLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setMfaStep(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ← Back to login
                  </button>
                  <Link href="/mfa" className="text-[#3B5EE8] hover:underline">
                    Use a recovery code
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
