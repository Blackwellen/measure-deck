import Link from "next/link";
import { ArrowRight, CheckCircle2, DollarSign, Users, BarChart2, Gift } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    heading: "Sign up",
    body: "Apply for the MeasureDeck affiliate programme. We review applications within 2 business days and provide you with a unique referral link and tracking dashboard.",
  },
  {
    step: "02",
    heading: "Refer",
    body: "Share your referral link with construction professionals — QS teams, commercial managers, main contractors, and specialist subcontractors — through your network, content, or events.",
  },
  {
    step: "03",
    heading: "Earn",
    body: "When a referral signs up and converts to a paid plan, you earn a commission. Commissions are tracked in real time, and payouts are processed monthly via bank transfer.",
  },
  {
    step: "04",
    heading: "Grow",
    body: "Build a recurring income stream. As long as your referrals remain customers, you earn a percentage of their monthly subscription — month after month.",
  },
];

const COMMISSION_TIERS = [
  {
    name: "Starter Partner",
    conversions: "0–4 conversions/month",
    rate: "20%",
    period: "First 3 months",
    desc: "Ideal for individuals and content creators just starting out.",
    color: "#3B5EE8",
    bg: "#EEF2FF",
  },
  {
    name: "Growth Partner",
    conversions: "5–19 conversions/month",
    rate: "25%",
    period: "First 6 months",
    desc: "For established networks with consistent referral volume.",
    color: "#10B981",
    bg: "#ECFDF5",
    highlight: true,
  },
  {
    name: "Elite Partner",
    conversions: "20+ conversions/month",
    rate: "30%",
    period: "Lifetime recurring",
    desc: "Top-tier partners with dedicated support and co-marketing.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
];

const IDEAL_PARTNERS = [
  "Construction industry consultants and advisors",
  "QS and commercial management training providers",
  "Industry bloggers, podcasters, and content creators",
  "Construction technology resellers and integrators",
  "Professional bodies and trade associations",
  "Construction recruitment agencies and networks",
];

export default function AffiliatePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-8">
            <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
            Earn up to 30% recurring commission
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Partner with MeasureDeck and earn recurring income
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Refer construction teams to MeasureDeck and earn a percentage of their subscription — for as long as they remain customers. No cap, no complex conditions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?enquiryType=partnership"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
            >
              Apply to Join <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { stat: "20–30%", label: "Commission on every referral" },
              { stat: "Recurring", label: "Monthly commission for the life of the subscription" },
              { stat: "30-day", label: "Cookie window for attribution" },
            ].map((s) => (
              <div key={s.stat}>
                <p className="text-3xl font-bold text-[#3B5EE8] mb-2">{s.stat}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How the programme works</h2>
            <p className="text-lg text-slate-500">
              From sign-up to your first payout in four simple steps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 rounded-full bg-[#3B5EE8] text-white text-sm font-bold flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{item.heading}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission tiers */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Commission tiers</h2>
            <p className="text-lg text-slate-500">
              As your referral volume grows, your commission rate increases.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {COMMISSION_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 ${
                  tier.highlight
                    ? "border-[#10B981] shadow-xl shadow-green-100"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {tier.highlight && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#10B981] text-white mb-4">
                    Most Popular
                  </span>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: tier.bg }}
                >
                  <BarChart2 className="w-5 h-5" style={{ color: tier.color }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{tier.conversions}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold" style={{ color: tier.color }}>
                    {tier.rate}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">commission</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-3">{tier.period}</p>
                <p className="text-sm text-slate-500">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Who is the programme for?</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Our affiliate programme is designed for individuals and organisations with an established presence in the construction industry who can authentically recommend MeasureDeck to commercial teams.
              </p>
              <ul className="space-y-3">
                {IDEAL_PARTNERS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#10B981]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: Gift,
                  title: "Affiliate resources",
                  body: "Marketing assets, demo videos, case studies, and a dedicated landing page template to help you convert referrals.",
                  color: "#3B5EE8",
                },
                {
                  icon: BarChart2,
                  title: "Real-time dashboard",
                  body: "Track clicks, sign-ups, conversions, and earnings in real time through your affiliate dashboard.",
                  color: "#10B981",
                },
                {
                  icon: Users,
                  title: "Dedicated partner manager",
                  body: "Growth and Elite partners are assigned a dedicated partner manager to help maximise your referral success.",
                  color: "#8B5CF6",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 shadow-sm"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* T&Cs note */}
      <section className="py-8 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            All affiliate partnerships are governed by the{" "}
            <Link href="/affiliate-terms" className="underline hover:text-slate-600">
              Affiliate Programme Terms
            </Link>
            . Commission rates are subject to change with 30 days notice. Payouts are processed monthly for balances over £50.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0D1B2E]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start earning?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Apply today. Our team reviews all applications within 2 business days.
          </p>
          <Link
            href="/contact?enquiryType=partnership"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
          >
            Apply to the Affiliate Programme <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
