import MarketingLayout from "./(marketing)/layout";
import Link from "next/link";
import {
  GitBranch,
  FileText,
  BarChart3,
  ClipboardList,
  Camera,
  Sparkles,
  Shield,
  Lock,
  Server,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Building2,
} from "lucide-react";

// ── Hero mock UI ──────────────────────────────────────────────────────────────
function HeroMockUI() {
  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: "#111827" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-4 text-xs text-white/30 font-mono">MeasureDeck — Commercial Dashboard</span>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 p-4">
          {[
            { label: "Contract Sum", value: "£4.2M", color: "#3B5EE8" },
            { label: "Certified to Date", value: "£2.8M", color: "#10B981" },
            { label: "CVR Variance", value: "-£42K", color: "#F59E0B" },
            { label: "Outstanding", value: "£187K", color: "#EF4444" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-3"
              style={{ background: "#1F2937", borderTop: `2px solid ${kpi.color}` }}
            >
              <p className="text-xs text-white/40 mb-1">{kpi.label}</p>
              <p className="text-lg font-bold text-white" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        {/* Chart placeholder */}
        <div className="px-4 pb-4">
          <div className="rounded-xl p-4" style={{ background: "#1F2937" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/60">Cost vs Value — Monthly</p>
              <span className="text-xs text-white/30">Last 6 months</span>
            </div>
            <div className="flex items-end gap-2 h-20">
              {[60, 72, 65, 85, 78, 92].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: i === 5 ? "#3B5EE8" : "rgba(59,94,232,0.35)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                <span key={m} className="text-xs text-white/20 flex-1 text-center">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Recent events */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          {[
            { label: "Change #47 Approved", status: "success", value: "+£18,200" },
            { label: "App #12 Submitted", status: "info", value: "£340,000" },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: "#1F2937" }}
            >
              <span className="text-xs text-white/60">{row.label}</span>
              <span
                className="text-xs font-semibold"
                style={{ color: row.status === "success" ? "#10B981" : "#3B5EE8" }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(59,94,232,0.25) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Feature sections ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: "changes",
    icon: GitBranch,
    iconColor: "#3B5EE8",
    iconBg: "#EEF2FF",
    heading: "Change & Variation Control",
    body: "Every instruction, variation, and compensation event is captured, priced, and tracked in real time. No more chasing emails for approval status or losing sight of your entitlement.",
    bullets: [
      "Full audit trail from instruction to approved change",
      "Automated value tracking against contract sum",
      "Early warning and risk flagging",
    ],
  },
  {
    id: "applications",
    icon: FileText,
    iconColor: "#10B981",
    iconBg: "#ECFDF5",
    heading: "Payment Applications",
    body: "Build and submit payment applications with professional formatting and full supporting evidence attached. Certify, dispute, and track every interim payment through to final account.",
    bullets: [
      "Structured application builder with line-item breakdown",
      "Certificate comparison and dispute logging",
      "Late payment tracking with interest calculation",
    ],
  },
  {
    id: "cvr",
    icon: BarChart3,
    iconColor: "#F59E0B",
    iconBg: "#FFFBEB",
    heading: "Cost Value Reconciliation",
    body: "Your CVR is always live, never a weekend exercise. MeasureDeck pulls costs and value together automatically, surfacing variances before they become problems.",
    bullets: [
      "Live CVR updated as costs and applications move",
      "Subcontract vs direct labour breakdown",
      "Forecast to completion with trend indicators",
    ],
  },
  {
    id: "final-accounts",
    icon: ClipboardList,
    iconColor: "#6366F1",
    iconBg: "#EEF2FF",
    heading: "Final Accounts",
    body: "Close out projects cleanly with a structured final account process. Capture all agreed adjustments, retention releases, and dispute resolutions in one governed document.",
    bullets: [
      "Structured final account statement with version history",
      "Retention release schedule and tracking",
      "Sign-off workflow with digital acceptance",
    ],
  },
  {
    id: "evidence",
    icon: Camera,
    iconColor: "#06B6D4",
    iconBg: "#ECFEFF",
    heading: "Evidence Management",
    body: "Photographs, dayworks sheets, delivery tickets, and site records — all linked directly to the change events and applications they support, ready for any dispute.",
    bullets: [
      "Drag-and-drop evidence upload linked to events",
      "GPS-tagged photos with timestamp metadata",
      "Bundled evidence packs for applications and disputes",
    ],
  },
  {
    id: "ai-copilot",
    icon: Sparkles,
    iconColor: "#8B5CF6",
    iconBg: "#F5F3FF",
    heading: "AI Copilot",
    body: "Your commercial assistant that never sleeps. The AI Copilot helps you draft notices, check entitlements, identify risk patterns, and summarise project commercial health — always with you in control.",
    bullets: [
      "Draft contractual notices and correspondence",
      "Ask questions about your project commercial position",
      "Anomaly detection across costs, valuations, and claims",
    ],
    badge: "AI-Powered",
  },
];

// ── FAQ items ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Which contract forms does MeasureDeck support?",
    a: "MeasureDeck is designed around the most common UK construction contracts including JCT (SBC, D&B, Minor Works), NEC3 and NEC4, and FIDIC. The change event and compensation event workflows map directly to contract-specific processes.",
  },
  {
    q: "How does MeasureDeck handle multi-project commercial teams?",
    a: "Each workspace supports unlimited projects under a single subscription. Commercial directors can view portfolio-level KPIs, CVR summaries, and outstanding applications across all live projects from a single dashboard.",
  },
  {
    q: "Can subcontractors or supply chain partners access MeasureDeck?",
    a: "Yes. You can invite supply chain partners as external collaborators with restricted access. They can submit applications, upload evidence, and view agreed positions without seeing confidential internal data.",
  },
  {
    q: "Is our data kept in the UK?",
    a: "All primary data is hosted in UK data centres. We use Supabase with UK-region configuration. Our full sub-processor list is published at measuredeck.com/subprocessors and updated whenever we add a new provider.",
  },
  {
    q: "Can we migrate data from our existing spreadsheets?",
    a: "Yes. We provide an import wizard that accepts CSV and Excel templates for projects, cost codes, change registers, and application history. Our onboarding team supports migration for Professional and Enterprise accounts.",
  },
  {
    q: "What happens to our data if we cancel?",
    a: "You can export all your data in standard formats (CSV, PDF) at any time. After cancellation, your data is retained for 30 days in read-only mode and then securely deleted unless you request an extended retention period.",
  },
];

// ── Component: FAQ Item ────────────────────────────────────────────────────────
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

// ── Main page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <MarketingLayout>
      {/* ── HERO ── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
                Now in early access — join 400+ commercial teams
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
                Take Control of Your{" "}
                <span className="text-[#3B5EE8]">Commercial Position</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-lg">
                MeasureDeck gives construction QS and commercial teams a single platform to manage valuations, CVRs, final accounts, and cost reporting.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/waitlist"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold text-base transition-colors shadow-lg shadow-blue-900/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-colors"
                >
                  Watch Demo
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
                {["GDPR Compliant", "UK Data Hosting", "SOC2 In Progress", "256-bit Encryption"].map(
                  (t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
            <HeroMockUI />
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section className="py-10 bg-slate-900 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/30 mb-6">
            Trusted by commercial teams across UK construction
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
            {["Main Contractor", "Specialist Sub", "Tier-1 M&E", "Civil Works Co.", "Framework Partner", "QS Consultancy"].map(
              (name) => (
                <div
                  key={name}
                  className="px-5 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium"
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Commercial teams deserve better than spreadsheets
            </h2>
            <p className="text-lg text-slate-500">
              The UK construction industry loses billions every year to commercial disputes, late payments, and under-recovery. Spreadsheets are not the answer.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📁",
                heading: "Version control chaos",
                body: "CVR_FINAL_v3_JamesEdits_ACTUAL.xlsx — every team knows this story. Version conflicts mean your commercial picture is never trustworthy.",
              },
              {
                icon: "📧",
                heading: "Evidence buried in email",
                body: "When a dispute lands, you spend weeks excavating mailboxes for dayworks sheets, site photos, and instruction records. MeasureDeck keeps everything linked.",
              },
              {
                icon: "🔍",
                heading: "No live cost picture",
                body: "Your CVR is already out of date before you finish compiling it. Without real-time cost vs value visibility, you cannot manage commercial risk.",
              },
            ].map((card) => (
              <div
                key={card.heading}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
              >
                <span className="text-3xl mb-4 block">{card.icon}</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{card.heading}</h3>
                <p className="text-sm leading-7 text-slate-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Your commercial flow, end to end
            </h2>
            <p className="text-lg text-slate-500">
              From the first instruction to final account sign-off, MeasureDeck maps every step of your commercial process.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-0">
            {[
              { label: "Instruction", color: "#3B5EE8" },
              { label: "Change Event", color: "#6366F1" },
              { label: "Application", color: "#10B981" },
              { label: "Certification", color: "#F59E0B" },
              { label: "Payment", color: "#10B981" },
              { label: "CVR", color: "#3B5EE8" },
              { label: "Final Account", color: "#0D1B2E" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex items-center">
                <div
                  className="px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-md"
                  style={{ background: node.color }}
                >
                  {node.label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-300 mx-1 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (alternating) ── */}
      <div>
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          const isEven = i % 2 === 0;
          return (
            <section
              key={feat.id}
              id={feat.id}
              className={`py-20 ${isEven ? "bg-white" : "bg-slate-50"}`}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                  className={`grid lg:grid-cols-2 gap-16 items-center ${
                    !isEven ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  {/* Text */}
                  <div>
                    {feat.badge && (
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                        style={{
                          background: feat.iconBg,
                          color: feat.iconColor,
                        }}
                      >
                        {feat.badge}
                      </span>
                    )}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                      style={{ background: feat.iconBg }}
                    >
                      <Icon className="w-6 h-6" style={{ color: feat.iconColor }} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">{feat.heading}</h2>
                    <p className="text-base leading-7 text-slate-600 mb-6">{feat.body}</p>
                    <ul className="space-y-3">
                      {feat.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                          <CheckCircle2
                            className="w-5 h-5 shrink-0 mt-0.5"
                            style={{ color: feat.iconColor }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Visual placeholder */}
                  <div
                    className="rounded-2xl h-72 md:h-80 flex items-center justify-center border border-slate-200"
                    style={{
                      background: `linear-gradient(135deg, ${feat.iconBg} 0%, white 100%)`,
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                        style={{ background: feat.iconColor }}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">{feat.heading}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── SECURITY ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Enterprise security you can rely on
            </h2>
            <p className="text-lg text-slate-500">
              Commercial data is sensitive. We treat it that way.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "GDPR Compliant",
                body: "Full UK GDPR compliance. DPA templates, data subject rights, and documented lawful basis for all processing.",
                color: "#3B5EE8",
              },
              {
                icon: Server,
                title: "UK Data Hosting",
                body: "All primary data stored in UK data centres. No transatlantic transfers for your project data.",
                color: "#10B981",
              },
              {
                icon: Lock,
                title: "256-bit Encryption",
                body: "AES-256 encryption at rest and TLS 1.3 in transit for all data. Keys managed with HSM-backed infrastructure.",
                color: "#6366F1",
              },
              {
                icon: Building2,
                title: "Audit Trail",
                body: "Immutable audit log for every action. Know exactly who changed what, when — critical for dispute resolution.",
                color: "#F59E0B",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${card.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm leading-6 text-slate-500">{card.body}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/security"
              className="text-sm font-semibold text-[#3B5EE8] hover:underline inline-flex items-center gap-1"
            >
              View full security details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Transparent pricing for every team size
            </h2>
            <p className="text-lg text-slate-500">
              No hidden fees, no lock-in. Start free, scale when you&apos;re ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "£79",
                period: "/user/mo",
                desc: "For small commercial teams getting started",
                features: [
                  "Up to 5 users",
                  "Unlimited projects",
                  "Change register",
                  "Payment applications",
                  "CVR module",
                  "10 GB document storage",
                  "Email support",
                ],
                cta: "Start Free Trial",
                href: "/waitlist",
                highlight: false,
              },
              {
                name: "Professional",
                price: "£149",
                period: "/user/mo",
                desc: "For growing teams who need the full platform",
                features: [
                  "Unlimited users",
                  "All Starter features",
                  "Final accounts",
                  "AI Copilot",
                  "BIM V1.5 integration",
                  "Evidence management",
                  "50 GB document storage",
                  "Priority support",
                ],
                cta: "Start Free Trial",
                href: "/waitlist",
                highlight: true,
                badge: "Most Popular",
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For large organisations with bespoke needs",
                features: [
                  "Everything in Professional",
                  "White label option",
                  "SSO / SAML",
                  "Custom integrations",
                  "Dedicated CSM",
                  "99.9% SLA guarantee",
                  "On-premise option",
                ],
                cta: "Contact Sales",
                href: "/contact",
                highlight: false,
              },
            ].map((plan) => (
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
                  className={`text-sm font-semibold uppercase tracking-widest mb-2 ${
                    plan.highlight ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlight ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.highlight ? "text-blue-100" : "text-slate-400"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mb-6 ${
                    plan.highlight ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {plan.desc}
                </p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className="w-4 h-4 shrink-0"
                        style={{ color: plan.highlight ? "#93C5FD" : "#10B981" }}
                      />
                      <span className={plan.highlight ? "text-blue-50" : "text-slate-700"}>
                        {f}
                      </span>
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
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-[#3B5EE8] hover:underline inline-flex items-center gap-1"
            >
              Compare all features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-500">
              Answers to questions we hear from commercial teams.
            </p>
          </div>
          <div>
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to recover what you&apos;re owed?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
            Join hundreds of construction commercial teams already using MeasureDeck to take control of their projects.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold text-base transition-colors shadow-lg shadow-blue-900/40"
            >
              Start Free Trial — No card required
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
          <p className="mt-8 text-xs text-white/30">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
