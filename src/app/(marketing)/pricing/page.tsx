"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, X, ArrowRight, ChevronDown } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: 79,
    annualPrice: 63,
    desc: "Core commercial tools for small teams getting started with structured commercial management.",
    features: [
      "Up to 5 users",
      "Unlimited projects",
      "Change & variation register",
      "Payment applications",
      "CVR module",
      "Basic reports & export",
      "10 GB document storage",
      "Email support",
      "14-day free trial",
    ],
    notIncluded: ["Final accounts", "AI Copilot", "BIM integration", "SSO / SAML", "White label"],
    cta: "Start Free Trial",
    href: "/waitlist",
    highlight: false,
    badge: null,
  },
  {
    name: "Professional",
    monthlyPrice: 149,
    annualPrice: 119,
    desc: "Full platform access for growing commercial teams who need every module and AI assistance.",
    features: [
      "Unlimited users",
      "Everything in Starter",
      "Final accounts module",
      "AI Copilot",
      "BIM V1.5 integration",
      "Evidence management",
      "Advanced reporting",
      "50 GB document storage",
      "Priority support (4hr SLA)",
      "Dedicated onboarding",
    ],
    notIncluded: ["SSO / SAML", "White label", "Custom integrations"],
    cta: "Start Free Trial",
    href: "/waitlist",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    desc: "Bespoke commercial management infrastructure for large contractors and consultancies.",
    features: [
      "Everything in Professional",
      "Unlimited storage",
      "White label branding",
      "SSO / SAML authentication",
      "Custom ERP integrations",
      "Dedicated Customer Success Manager",
      "99.9% uptime SLA",
      "On-premise deployment option",
      "Custom data retention policies",
      "Security review & DPA",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    href: "/contact",
    highlight: false,
    badge: null,
  },
];

// All features for the full comparison table
const COMPARISON_SECTIONS = [
  {
    section: "Core Commercial",
    rows: [
      { feature: "Unlimited projects", starter: true, pro: true, enterprise: true },
      { feature: "Change & variation register", starter: true, pro: true, enterprise: true },
      { feature: "Payment applications", starter: true, pro: true, enterprise: true },
      { feature: "CVR module", starter: true, pro: true, enterprise: true },
      { feature: "Final accounts", starter: false, pro: true, enterprise: true },
      { feature: "Retention tracking", starter: true, pro: true, enterprise: true },
      { feature: "Early warning register", starter: false, pro: true, enterprise: true },
    ],
  },
  {
    section: "Evidence & Documents",
    rows: [
      { feature: "Document storage", starter: "10 GB", pro: "50 GB", enterprise: "Unlimited" },
      { feature: "Evidence management (GPS photo)", starter: false, pro: true, enterprise: true },
      { feature: "Drawings register", starter: false, pro: true, enterprise: true },
      { feature: "BIM V1.5 viewer", starter: false, pro: true, enterprise: true },
      { feature: "Evidence bundles for disputes", starter: false, pro: true, enterprise: true },
    ],
  },
  {
    section: "Reporting",
    rows: [
      { feature: "Standard reports & PDF export", starter: true, pro: true, enterprise: true },
      { feature: "Advanced reports & dashboards", starter: false, pro: true, enterprise: true },
      { feature: "Portfolio CVR (multi-project)", starter: false, pro: true, enterprise: true },
      { feature: "Executive summary cards", starter: false, pro: true, enterprise: true },
      { feature: "Custom report builder", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    section: "AI & Automation",
    rows: [
      { feature: "AI Copilot — Q&A on project data", starter: false, pro: true, enterprise: true },
      { feature: "AI notice drafting", starter: false, pro: true, enterprise: true },
      { feature: "Anomaly detection", starter: false, pro: true, enterprise: true },
      { feature: "Automated reminders & alerts", starter: true, pro: true, enterprise: true },
    ],
  },
  {
    section: "Team & Security",
    rows: [
      { feature: "Users", starter: "Up to 5", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Role-based permissions", starter: true, pro: true, enterprise: true },
      { feature: "External collaborator access", starter: false, pro: true, enterprise: true },
      { feature: "Audit log", starter: true, pro: true, enterprise: true },
      { feature: "MFA / Two-factor auth", starter: true, pro: true, enterprise: true },
      { feature: "SSO / SAML", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    section: "Support & Enterprise",
    rows: [
      { feature: "Email support", starter: true, pro: true, enterprise: true },
      { feature: "Priority support (4hr SLA)", starter: false, pro: true, enterprise: true },
      { feature: "Dedicated Customer Success Manager", starter: false, pro: false, enterprise: true },
      { feature: "Onboarding & data migration", starter: false, pro: true, enterprise: true },
      { feature: "Custom integrations (ERP / finance)", starter: false, pro: false, enterprise: true },
      { feature: "White label branding", starter: false, pro: false, enterprise: true },
      { feature: "99.9% uptime SLA", starter: false, pro: false, enterprise: true },
    ],
  },
];

const PRICING_FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. All Starter and Professional plans begin with a 14-day free trial — no credit card required. You get full access to all features in your plan for the duration of the trial.",
  },
  {
    q: "How does per-user pricing work?",
    a: "You are billed per active user on your workspace. You can add or remove users at any time and your next invoice will reflect the current user count. External collaborators (supply chain partners with restricted access) are not counted as billable users.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately with pro-rated billing. Downgrades take effect at the start of the next billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) via Stripe. Enterprise customers can request invoice-based billing with NET-30 terms.",
  },
  {
    q: "What does the annual discount apply to?",
    a: "The 20% annual discount applies to the per-user monthly rate. Starter drops from £79 to £63/user/month, and Professional from £149 to £119/user/month, when billed annually.",
  },
  {
    q: "What happens at the end of my trial?",
    a: "At the end of your 14-day trial, you will be asked to add a payment method to continue. You will never be charged without explicitly entering billing details. Your data is retained for 30 days after trial expiry.",
  },
];

function CellVal({ val }: { val: boolean | string }) {
  if (val === true) return <CheckCircle2 className="w-5 h-5 text-[#10B981] mx-auto" />;
  if (val === false) return <X className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-xs font-medium text-slate-600">{val}</span>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-200 py-5">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="text-base font-semibold text-slate-900 pr-6">{q}</span>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-4 text-sm leading-7 text-slate-600">{a}</p>
    </details>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-300 mb-10">
            No hidden fees, no lock-in contracts. Start free, grow when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !annual ? "bg-white text-slate-900 shadow" : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                annual ? "bg-white text-slate-900 shadow" : "text-white/70 hover:text-white"
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded bg-[#10B981] text-white text-xs font-bold">
                20% off
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col relative ${
                  plan.highlight
                    ? "border-[#3B5EE8] bg-[#3B5EE8] text-white shadow-xl shadow-blue-200"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#10B981] text-white text-xs font-bold shadow">
                    {plan.badge}
                  </span>
                )}

                <p
                  className={`text-sm font-semibold uppercase tracking-widest mb-3 ${
                    plan.highlight ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {plan.name}
                </p>

                <div className="mb-2">
                  {plan.monthlyPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-4xl font-bold ${
                          plan.highlight ? "text-white" : "text-slate-900"
                        }`}
                      >
                        £{annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span
                        className={`text-sm ${plan.highlight ? "text-blue-100" : "text-slate-400"}`}
                      >
                        /user/mo
                      </span>
                      {annual && (
                        <span
                          className={`text-sm line-through ${
                            plan.highlight ? "text-blue-200" : "text-slate-400"
                          }`}
                        >
                          £{plan.monthlyPrice}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`text-4xl font-bold ${
                        plan.highlight ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Custom
                    </span>
                  )}
                  {annual && plan.monthlyPrice && (
                    <p
                      className={`text-xs mt-1 ${plan.highlight ? "text-blue-100" : "text-slate-400"}`}
                    >
                      Billed annually (20% saving)
                    </p>
                  )}
                </div>

                <p
                  className={`text-sm mb-6 leading-relaxed ${
                    plan.highlight ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {plan.desc}
                </p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: plan.highlight ? "#93C5FD" : "#10B981" }}
                      />
                      <span className={plan.highlight ? "text-blue-50" : "text-slate-700"}>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className={plan.highlight ? "text-blue-50" : "text-slate-500"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-[#3B5EE8] hover:bg-blue-50"
                      : "bg-[#3B5EE8] text-white hover:bg-[#2D4ED8]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            All plans include 14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Full comparison table */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Full feature comparison</h2>
            <p className="text-lg text-slate-500">
              See exactly what is included in each plan.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
              <div className="px-6 py-4 text-sm font-semibold text-slate-700">Feature</div>
              <div className="px-4 py-4 text-center text-sm font-medium text-slate-500">Starter</div>
              <div className="px-4 py-4 text-center text-sm font-bold text-[#3B5EE8]">Professional</div>
              <div className="px-4 py-4 text-center text-sm font-medium text-slate-500">Enterprise</div>
            </div>
            {COMPARISON_SECTIONS.map((section) => (
              <div key={section.section}>
                <div className="px-6 py-3 bg-slate-50 border-y border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {section.section}
                  </p>
                </div>
                {section.rows.map((row, i) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-4 border-b border-slate-100 ${
                      i % 2 === 0 ? "" : "bg-slate-50/40"
                    }`}
                  >
                    <div className="px-6 py-3.5 text-sm text-slate-700 font-medium">{row.feature}</div>
                    <div className="px-4 py-3.5 flex items-center justify-center">
                      <CellVal val={row.starter} />
                    </div>
                    <div className="px-4 py-3.5 flex items-center justify-center">
                      <CellVal val={row.pro} />
                    </div>
                    <div className="px-4 py-3.5 flex items-center justify-center">
                      <CellVal val={row.enterprise} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pricing FAQs</h2>
          </div>
          {PRICING_FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0D1B2E]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still deciding? Talk to our team.
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            We can walk you through the right plan for your team size and workflow — no sales pressure, just honest advice.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
            >
              Book a Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
