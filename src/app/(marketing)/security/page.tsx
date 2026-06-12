import Link from "next/link";
import {
  Shield,
  Lock,
  Server,
  Eye,
  UserCheck,
  FileSearch,
  CheckCircle2,
  ArrowRight,
  Mail,
} from "lucide-react";

const SECURITY_SECTIONS = [
  {
    icon: Lock,
    color: "#3B5EE8",
    bg: "#EEF2FF",
    heading: "Encryption",
    body: "All data stored in MeasureDeck is encrypted at rest using AES-256 encryption. All data in transit is protected using TLS 1.3. Encryption keys are managed using hardware security modules (HSMs) with key rotation policies. Backups are encrypted before storage and tested quarterly.",
    points: [
      "AES-256 encryption at rest for all project data, documents, and evidence",
      "TLS 1.3 enforced for all data in transit — no fallback to weaker protocols",
      "HSM-backed key management with automated annual rotation",
      "Encrypted database backups with point-in-time recovery",
    ],
  },
  {
    icon: Server,
    color: "#10B981",
    bg: "#ECFDF5",
    heading: "Data Hosting & Residency",
    body: "Your commercial project data stays in the United Kingdom. We use UK-region Supabase PostgreSQL instances hosted in AWS eu-west-2 (London). Document storage is provisioned in Cloudflare R2 with UK region selection. We do not transfer primary project data outside the UK without your explicit consent.",
    points: [
      "Primary database: AWS eu-west-2 (London) via Supabase",
      "Document and evidence storage: Cloudflare R2 with EU-west region",
      "No cross-border transfer of primary project data",
      "Data residency confirmations available for Enterprise accounts",
    ],
  },
  {
    icon: UserCheck,
    color: "#6366F1",
    bg: "#EEF2FF",
    heading: "Access Control",
    body: "MeasureDeck uses role-based access control (RBAC) throughout. Every user is assigned a role — Owner, Admin, Commercial Manager, or Viewer — and each role has tightly defined permissions. External collaborators (supply chain partners) receive a restricted external role with access limited to their specific work packages.",
    points: [
      "Role-based access control with four built-in roles",
      "Row-level security enforced at database level — users cannot access data outside their workspace",
      "Multi-factor authentication (MFA) supported and recommended",
      "SSO / SAML 2.0 available for Enterprise accounts",
      "Session management with configurable timeout policies",
    ],
  },
  {
    icon: Eye,
    color: "#F59E0B",
    bg: "#FFFBEB",
    heading: "Audit Logging",
    body: "Every action in MeasureDeck — view, create, edit, delete, export — is recorded in an immutable audit log. The audit log is a critical tool for dispute resolution, compliance review, and security investigations. Logs are retained for a minimum of 7 years and are tamper-proof.",
    points: [
      "Immutable audit trail for every create, edit, delete, and export action",
      "Logs include user identity, timestamp, IP address, and action detail",
      "7-year minimum retention for compliance and dispute purposes",
      "Audit log export available for GDPR data subject access requests",
      "Real-time alerts for suspicious activity patterns",
    ],
  },
  {
    icon: Shield,
    color: "#EF4444",
    bg: "#FEF2F2",
    heading: "Application Security",
    body: "Our development process incorporates security at every stage. We conduct regular penetration testing, dependency audits, and code reviews. Our infrastructure is managed using infrastructure-as-code with automated security scanning in the CI/CD pipeline.",
    points: [
      "Annual third-party penetration testing with remediation tracking",
      "Automated SAST and dependency vulnerability scanning in CI/CD",
      "OWASP Top 10 addressed in development guidelines",
      "Responsible disclosure programme — security@measuredeck.com",
      "SOC 2 Type II certification in progress",
    ],
  },
  {
    icon: FileSearch,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    heading: "Compliance & Certifications",
    body: "MeasureDeck is built for compliance with UK data protection law. We maintain a full Record of Processing Activities (ROPA), have documented Data Processing Agreements with all sub-processors, and implement Privacy by Design across all product development.",
    points: [
      "UK GDPR and Data Protection Act 2018 compliant",
      "ICO registration maintained",
      "Data Processing Agreements (DPAs) available for all customers",
      "Sub-processor list published and updated — measuredeck.com/subprocessors",
      "Privacy Impact Assessments (PIAs) conducted for new features",
    ],
  },
];

const CERTIFICATIONS = [
  {
    name: "UK GDPR Compliant",
    status: "Active",
    color: "#10B981",
    desc: "Full compliance with UK GDPR and the Data Protection Act 2018.",
  },
  {
    name: "ICO Registered",
    status: "Active",
    color: "#10B981",
    desc: "Registered with the Information Commissioner's Office as a data controller.",
  },
  {
    name: "SOC 2 Type II",
    status: "In Progress",
    color: "#F59E0B",
    desc: "SOC 2 Type II audit in progress. Expected completion Q3 2026.",
  },
  {
    name: "ISO 27001",
    status: "Planned",
    color: "#6366F1",
    desc: "ISO 27001 certification planned as part of our 2026 security roadmap.",
  },
  {
    name: "Cyber Essentials",
    status: "Active",
    color: "#10B981",
    desc: "NCSC Cyber Essentials certification held and renewed annually.",
  },
  {
    name: "256-bit Encryption",
    status: "Active",
    color: "#10B981",
    desc: "AES-256 at rest, TLS 1.3 in transit, HSM-backed key management.",
  },
];

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#0D1B2E] to-[#1a2f50]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#3B5EE8]/20 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-8 h-8 text-[#3B5EE8]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Enterprise-grade security for{" "}
            <span className="text-[#3B5EE8]">construction commercial data</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Your contract values, CVR data, and commercial position are among your most sensitive assets. We protect them with the same rigour you apply to your project delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
            {["UK Data Hosting", "AES-256 Encryption", "UK GDPR Compliant", "ICO Registered", "Cyber Essentials"].map(
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

      {/* Security sections */}
      {SECURITY_SECTIONS.map((sec, i) => {
        const Icon = sec.icon;
        const isEven = i % 2 === 0;
        return (
          <section key={sec.heading} className={`py-16 ${isEven ? "bg-white" : "bg-slate-50"}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div
                className={`grid lg:grid-cols-2 gap-16 items-center ${
                  !isEven ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: sec.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: sec.color }} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{sec.heading}</h2>
                  <p className="text-base leading-7 text-slate-600 mb-6">{sec.body}</p>
                  <ul className="space-y-2.5">
                    {sec.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2
                          className="w-5 h-5 shrink-0 mt-0.5"
                          style={{ color: sec.color }}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="rounded-2xl h-64 flex items-center justify-center border border-slate-200"
                  style={{ background: `linear-gradient(135deg, ${sec.bg} 0%, white 100%)` }}
                >
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                      style={{ background: sec.color }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{sec.heading}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Certifications */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Certifications & Compliance</h2>
            <p className="text-lg text-slate-500">
              Our security posture is independently validated and transparently disclosed.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.name}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-slate-900">{cert.name}</h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${cert.color}15`,
                      color: cert.color,
                    }}
                  >
                    {cert.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-processors */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Sub-processor Transparency</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We maintain a complete, up-to-date list of every sub-processor we use. You can review this list at any time and will be notified of any changes.
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/subprocessors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              View sub-processor list <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0D1B2E]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="w-10 h-10 text-[#3B5EE8] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Contact our security team
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            For security questionnaires, penetration test reports, DPA requests, or to report a vulnerability — our security team responds within one business day.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:security@measuredeck.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold transition-colors"
            >
              security@measuredeck.com <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/data-processing-addendum"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              View DPA
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
