import Link from "next/link";
import {
  GitBranch,
  FileText,
  BarChart3,
  ClipboardList,
  Camera,
  Sparkles,
  FolderOpen,
  Users,
  CheckSquare,
  Calendar,
  Layers,
  FileBarChart,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: FolderOpen,
    title: "Projects",
    desc: "Centralised project register with contract data, programme milestones, and commercial health at a glance.",
    color: "#3B5EE8",
    bg: "#EEF2FF",
  },
  {
    icon: GitBranch,
    title: "Changes & Variations",
    desc: "Capture every instruction, variation order, and compensation event. Track approval status and agreed value in real time.",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  {
    icon: FileText,
    title: "Payment Applications",
    desc: "Build, submit, and track interim payment applications. Compare certifications and log disputes with supporting evidence.",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: BarChart3,
    title: "Cost Value Reconciliation",
    desc: "Live CVR always open. Real-time cost vs value tracking with variance analysis and forecast-to-complete.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: ClipboardList,
    title: "Final Accounts",
    desc: "Structured final account process with version history, retention release schedule, and digital sign-off workflow.",
    color: "#6366F1",
    bg: "#F5F3FF",
  },
  {
    icon: Camera,
    title: "Evidence Management",
    desc: "GPS-tagged photos, dayworks sheets, delivery tickets — all linked to the events and applications they support.",
    color: "#06B6D4",
    bg: "#ECFEFF",
  },
  {
    icon: FileBarChart,
    title: "Reports",
    desc: "Commercial progress reports, CVR summaries, cash flow forecasts, and executive dashboards — exportable to PDF.",
    color: "#3B5EE8",
    bg: "#EEF2FF",
  },
  {
    icon: Users,
    title: "Suppliers & Contacts",
    desc: "Full supply chain register with contact details, order history, and subcontract commercial position by package.",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: CheckSquare,
    title: "Tasks",
    desc: "Action items, commercial reminders, and team assignments linked directly to projects and commercial events.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: Calendar,
    title: "Schedule",
    desc: "Programme integration with commercial milestones, application due dates, and certification deadlines.",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    icon: Layers,
    title: "Drawings & BIM",
    desc: "BIM V1.5 model viewer with drawing register, revision tracking, and document issue management.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    icon: Sparkles,
    title: "AI Copilot",
    desc: "Draft notices, check entitlements, surface risks, and get answers about your commercial position — instantly.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
];

const DETAILED_FEATURES = [
  {
    icon: GitBranch,
    iconColor: "#3B5EE8",
    iconBg: "#EEF2FF",
    heading: "Change & Variation Control",
    sub: "Stop losing entitlement to poor change management",
    body: "Every pound of variation entitlement starts with a properly logged instruction. MeasureDeck captures every change event — whether it is a formal architect's instruction, an RFI response with cost implications, or a verbal instruction subsequently confirmed in writing — and tracks it through pricing, submission, and agreement.",
    bullets: [
      "Instruction log with contract reference and instruction number",
      "Priced variation with direct and subcontract cost breakdown",
      "Submission tracker showing submitted, under negotiation, and agreed values",
      "Early warning register for NEC/FIDIC contracts",
      "Automated entitlement alerts when response deadlines approach",
      "Comparison of instructed vs agreed value for recovery analysis",
    ],
  },
  {
    icon: FileText,
    iconColor: "#10B981",
    iconBg: "#ECFDF5",
    heading: "Payment Applications",
    sub: "Professional applications every time, on time",
    body: "A late or poorly constructed payment application hands leverage to the paying party. MeasureDeck gives your team a structured application builder that produces professional, compliant applications every time — with all supporting evidence bundled and attached.",
    bullets: [
      "Line-item breakdown by work section and cost code",
      "Rolling application history with cumulative totals",
      "Certificate comparison with shortfall analysis",
      "Dispute log with contractual timeline tracking",
      "Late payment interest calculator",
      "SMSG-compliant notice generation",
    ],
  },
  {
    icon: BarChart3,
    iconColor: "#F59E0B",
    iconBg: "#FFFBEB",
    heading: "Cost Value Reconciliation",
    sub: "Your CVR is live, not a weekend job",
    body: "The monthly CVR should be a 10-minute review, not a two-day scramble. MeasureDeck pulls together costs posted against cost codes, values from certified applications, and projected final costs to give you a CVR that updates in real time as the project moves.",
    bullets: [
      "Live cost vs value by project section and work package",
      "Subcontract, labour, plant, and materials breakdown",
      "Forecast final cost and forecast final value",
      "Margin analysis with movement from last period",
      "Multi-project portfolio CVR for commercial directors",
      "Export to PDF for board reporting",
    ],
  },
  {
    icon: Sparkles,
    iconColor: "#8B5CF6",
    iconBg: "#F5F3FF",
    heading: "AI Copilot",
    sub: "Your commercial assistant, available 24/7",
    body: "The AI Copilot is embedded throughout MeasureDeck, ready to help your team draft correspondence, check contractual entitlement, identify risk patterns, and summarise commercial position. All outputs require human review — the AI augments your team, it does not replace professional judgement.",
    bullets: [
      "Draft contractual notices (early warning, compensation events, extensions of time)",
      "Answer questions about your project commercial position",
      "Identify anomalies in cost posting and application submissions",
      "Summarise change register status and outstanding entitlement",
      "Generate executive summary narratives for CVR reports",
      "Flag contract terms relevant to current commercial events",
    ],
    badge: "AI-Powered",
  },
];

// Comparison table
type CompareVal = boolean | "partial";
interface CompareRow { feature: string; spreadsheet: CompareVal; generic: CompareVal; md: CompareVal; }
const COMPARE_ROWS: CompareRow[] = [
  { feature: "Change register with audit trail", spreadsheet: false, generic: "partial", md: true },
  { feature: "Payment application builder", spreadsheet: false, generic: false, md: true },
  { feature: "Live CVR", spreadsheet: false, generic: false, md: true },
  { feature: "Final account workflow", spreadsheet: false, generic: false, md: true },
  { feature: "Evidence linked to events", spreadsheet: false, generic: false, md: true },
  { feature: "Dispute log and timeline", spreadsheet: false, generic: false, md: true },
  { feature: "AI-assisted drafting", spreadsheet: false, generic: false, md: true },
  { feature: "Multi-user with permissions", spreadsheet: false, generic: "partial", md: true },
  { feature: "GDPR-compliant data handling", spreadsheet: false, generic: "partial", md: true },
  { feature: "UK contract form support", spreadsheet: false, generic: false, md: true },
  { feature: "Mobile evidence capture", spreadsheet: false, generic: false, md: true },
  { feature: "Export to PDF reports", spreadsheet: "partial", generic: "partial", md: true },
];

function CompareCell({ val }: { val: boolean | "partial" }) {
  if (val === true)
    return <CheckCircle2 className="w-5 h-5 text-[#10B981] mx-auto" />;
  if (val === "partial")
    return <span className="text-xs text-amber-500 font-semibold">Partial</span>;
  return <X className="w-5 h-5 text-slate-300 mx-auto" />;
}

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            12 commercial modules in one platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Everything your commercial team needs —{" "}
            <span className="text-[#3B5EE8]">in one place</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            From the first instruction to final account sign-off, MeasureDeck covers every commercial process that construction QS and commercial teams rely on.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">All modules at a glance</h2>
            <p className="text-lg text-slate-500">
              Each module is purpose-built for construction commercial management — not adapted from a generic project management tool.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: card.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm leading-6 text-slate-500">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed feature sections */}
      {DETAILED_FEATURES.map((feat, i) => {
        const Icon = feat.icon;
        const isEven = i % 2 === 0;
        return (
          <section key={feat.heading} className={`py-20 ${isEven ? "bg-slate-50" : "bg-white"}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div
                className={`grid lg:grid-cols-2 gap-16 items-center ${
                  !isEven ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  {feat.badge && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                      style={{ background: feat.iconBg, color: feat.iconColor }}
                    >
                      {feat.badge}
                    </span>
                  )}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: feat.iconBg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feat.iconColor }} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{feat.heading}</h2>
                  <p className="text-base font-medium text-slate-500 mb-4">{feat.sub}</p>
                  <p className="text-base leading-7 text-slate-600 mb-6">{feat.body}</p>
                  <ul className="space-y-2.5">
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
                <div
                  className="rounded-2xl h-80 flex items-center justify-center border border-slate-200"
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

      {/* Comparison table */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How MeasureDeck compares
            </h2>
            <p className="text-lg text-slate-500">
              Spreadsheets and generic PM tools were not built for construction commercial management.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-4 text-slate-700 font-semibold w-1/2">Capability</th>
                  <th className="text-center px-4 py-4 text-slate-500 font-medium">Spreadsheets</th>
                  <th className="text-center px-4 py-4 text-slate-500 font-medium">Generic PM Tool</th>
                  <th className="text-center px-4 py-4 font-bold text-[#3B5EE8]">MeasureDeck</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-slate-100 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}
                  >
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{row.feature}</td>
                    <td className="px-4 py-3.5 text-center">
                      <CompareCell val={row.spreadsheet} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CompareCell val={row.generic} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CompareCell val={row.md} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0D1B2E]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to see the full platform?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Book a 30-minute demo and we will walk you through every module with real construction project data.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
            >
              Book a Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
