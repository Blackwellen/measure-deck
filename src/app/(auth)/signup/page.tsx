"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  companyName: z.string().min(2, "Enter your company name"),
  role: z.string().min(1, "Select your role"),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to continue" }) }),
});
type SignupFormData = z.infer<typeof signupSchema>;

const roles = [
  { value: "qs_commercial_manager", label: "QS / Commercial Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "director_commercial_director", label: "Director / Commercial Director" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#EF4444" };
  if (score === 2) return { score: 2, label: "Fair", color: "#F59E0B" };
  if (score === 3) return { score: 3, label: "Good", color: "#3B82F6" };
  return { score: 4, label: "Strong", color: "#10B981" };
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch("password") ?? "";
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: SignupFormData) => {
    setSubmitError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: {
          full_name: data.fullName,
          company_name: data.companyName,
          role: data.role,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setSubmitError("An account with this email already exists. Try signing in instead.");
      } else {
        setSubmitError(error.message);
      }
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0D1B2E]">Check your inbox</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            We&apos;ve sent a confirmation link to your email address. Click it to activate your
            account and get started with MeasureDeck.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-[#3B5EE8] font-medium hover:underline"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="lg:w-[45%] xl:w-[40%] flex-shrink-0">
        <BrandPanel />
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-12 bg-white overflow-y-auto">
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0D1B2E] tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Get started free — no credit card required.
            </p>
          </div>

          {submitError && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="James Anderson"
                {...register("fullName")}
                className={cn(
                  "h-11 px-3.5 rounded-lg border text-sm transition-colors outline-none",
                  "placeholder:text-slate-400 bg-white text-slate-900",
                  "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                  errors.fullName
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Work email
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
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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
              {/* Strength bar */}
              {passwordValue && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            i <= strength.score ? strength.color : "#E2E8F0",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Company name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Construction Ltd"
                {...register("companyName")}
                className={cn(
                  "h-11 px-3.5 rounded-lg border text-sm transition-colors outline-none",
                  "placeholder:text-slate-400 bg-white text-slate-900",
                  "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                  errors.companyName
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                Your role
              </label>
              <select
                id="role"
                {...register("role")}
                className={cn(
                  "h-11 px-3.5 rounded-lg border text-sm transition-colors outline-none appearance-none bg-white",
                  "text-slate-900 focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
                  errors.role
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
              >
                <option value="">Select your role…</option>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                {...register("terms")}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#3B5EE8]"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 select-none cursor-pointer leading-relaxed">
                I agree to MeasureDeck&apos;s{" "}
                <Link href="/terms" className="text-[#3B5EE8] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#3B5EE8] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && <p className="-mt-3 text-xs text-red-500">{errors.terms.message}</p>}

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
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#3B5EE8] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
