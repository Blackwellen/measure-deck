"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Calendar, Clock, Video } from "lucide-react";

const TEAM_SIZES = [
  { value: "", label: "Select team size" },
  { value: "1-5", label: "1–5 users" },
  { value: "6-20", label: "6–20 users" },
  { value: "21-50", label: "21–50 users" },
  { value: "51-200", label: "51–200 users" },
  { value: "200+", label: "200+ users" },
];

const ROLES = [
  { value: "", label: "Select your role" },
  { value: "qs", label: "Quantity Surveyor" },
  { value: "commercial-manager", label: "Commercial Manager" },
  { value: "commercial-director", label: "Commercial Director" },
  { value: "project-manager", label: "Project Manager" },
  { value: "contracts-manager", label: "Contracts Manager" },
  { value: "other", label: "Other" },
];

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    teamSize: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Book a MeasureDeck demo
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            A 30-minute live walkthrough of the full platform with real construction project data — tailored to your team&apos;s role and workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
            {[
              { icon: Clock, text: "30 minutes" },
              { icon: Video, text: "Live walkthrough via video call" },
              { icon: Calendar, text: "Flexible scheduling" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#10B981]" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form + what to expect */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* What to expect */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What to expect</h2>
              <div className="space-y-5 mb-8">
                {[
                  {
                    step: "01",
                    heading: "Discovery",
                    body: "We start by understanding your team, the contract types you work on, and your current commercial challenges.",
                  },
                  {
                    step: "02",
                    heading: "Platform walkthrough",
                    body: "Live demo of the modules most relevant to your role — changes, applications, CVR, final accounts, and AI Copilot.",
                  },
                  {
                    step: "03",
                    heading: "Q&A",
                    body: "Open Q&A time to ask anything about integrations, data migration, pricing, or contract-specific workflows.",
                  },
                  {
                    step: "04",
                    heading: "Next steps",
                    body: "If it looks like a good fit, we will set you up with a free trial and connect you with your dedicated onboarding contact.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3B5EE8] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 mb-1">
                        {item.heading}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#EEF2FF] border border-[#3B5EE8]/20 p-5">
                <p className="text-sm font-semibold text-[#3B5EE8] mb-2">
                  Prefer to start straight away?
                </p>
                <p className="text-sm text-slate-600 mb-3">
                  You can sign up for a free 14-day trial without booking a demo — full platform access, no credit card required.
                </p>
                <a
                  href="/waitlist"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B5EE8] hover:underline"
                >
                  Start free trial <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Demo request received!</h3>
                  <p className="text-slate-500 max-w-sm mb-6">
                    We will confirm your demo booking within one business day and send you a calendar invite with a video call link.
                  </p>
                  <p className="text-sm text-slate-400">
                    Questions in the meantime?{" "}
                    <a href="mailto:hello@measuredeck.com" className="text-[#3B5EE8] underline">
                      hello@measuredeck.com
                    </a>
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Request your demo</h2>
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
                          placeholder="Alex Williams"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10"
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
                          placeholder="alex@contractor.co.uk"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="company"
                        type="text"
                        required
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Your company name"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Your role
                        </label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 bg-white"
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
                          Team size
                        </label>
                        <select
                          name="teamSize"
                          value={form.teamSize}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 bg-white"
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        What would you like to see? (optional)
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="e.g. CVR and final accounts workflow for NEC contracts..."
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-6 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Request Demo <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-xs text-slate-400 text-center">
                      By submitting this form you agree to our{" "}
                      <a href="/privacy" className="underline hover:text-slate-600">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
