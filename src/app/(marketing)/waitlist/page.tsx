"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Users, Sparkles } from "lucide-react";

const TEAM_SIZES = [
  { value: "", label: "Select team size" },
  { value: "1-3", label: "1–3 users" },
  { value: "4-10", label: "4–10 users" },
  { value: "11-30", label: "11–30 users" },
  { value: "31-100", label: "31–100 users" },
  { value: "100+", label: "100+ users" },
];

const ROLES = [
  { value: "", label: "Select your role" },
  { value: "qs", label: "Quantity Surveyor" },
  { value: "commercial-manager", label: "Commercial Manager" },
  { value: "commercial-director", label: "Commercial Director" },
  { value: "project-manager", label: "Project Manager" },
  { value: "contracts-manager", label: "Contracts Manager" },
  { value: "finance-director", label: "Finance Director" },
  { value: "other", label: "Other" },
];

const CONTRACT_TYPES = [
  { value: "jct", label: "JCT (SBC, D&B, Minor Works)" },
  { value: "nec", label: "NEC3 / NEC4" },
  { value: "fidic", label: "FIDIC" },
  { value: "bespoke", label: "Bespoke / Informal" },
];

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    teamSize: "",
    contracts: [] as string[],
    challenges: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleContractToggle(val: string) {
    setForm((prev) => ({
      ...prev,
      contracts: prev.contracts.includes(val)
        ? prev.contracts.filter((c) => c !== val)
        : [...prev.contracts, val],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-8">
            <Users className="w-3.5 h-3.5 text-[#10B981]" />
            Join 400+ commercial professionals already signed up
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Join the MeasureDeck waitlist
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Get early access to the construction industry&apos;s most advanced commercial management platform. Free trial included — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            {["14-day free trial", "No credit card", "Full platform access", "Cancel anytime"].map(
              (t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                You&apos;re on the list!
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Thank you for signing up. We will be in touch shortly with your early access invitation and onboarding details.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B5EE8] text-white font-semibold text-sm hover:bg-[#2D4ED8] transition-colors"
                >
                  Book a Demo <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/features"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Explore Features
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-[#3B5EE8]" />
                <h2 className="text-xl font-bold text-slate-900">Commercial team profile</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Sarah Thompson"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Work email <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="sarah@buildco.co.uk"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="company"
                    type="text"
                    required
                    value={form.company}
                    onChange={handleChange}
                    placeholder="BuildCo UK Ltd"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Your role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      required
                      value={form.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors bg-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} disabled={!r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Team size <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="teamSize"
                      required
                      value={form.teamSize}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors bg-white"
                    >
                      {TEAM_SIZES.map((s) => (
                        <option key={s.value} value={s.value} disabled={!s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contract types you work with
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRACT_TYPES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleContractToggle(c.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          form.contracts.includes(c.value)
                            ? "bg-[#3B5EE8] border-[#3B5EE8] text-white"
                            : "bg-white border-slate-300 text-slate-700 hover:border-[#3B5EE8]/50"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Biggest commercial challenge (optional)
                  </label>
                  <textarea
                    name="challenges"
                    rows={3}
                    value={form.challenges}
                    onChange={handleChange}
                    placeholder="e.g. tracking change entitlement across multiple projects, getting a live CVR..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Join the waitlist — Free trial included
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-slate-400 text-center">
                  By joining, you agree to our{" "}
                  <a href="/privacy" className="underline hover:text-slate-600">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms" className="underline hover:text-slate-600">
                    Terms of Service
                  </a>
                  .
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { stat: "400+", label: "Commercial professionals signed up" },
              { stat: "£2.1B+", label: "Contract value under management in trials" },
              { stat: "14 days", label: "Free trial — no card required" },
            ].map((s) => (
              <div key={s.stat}>
                <p className="text-4xl font-bold text-[#3B5EE8] mb-2">{s.stat}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
