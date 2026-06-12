export const metadata = {
  title: "Sub-processors — MeasureDeck",
  description: "MeasureDeck sub-processor list. Full transparency on all third-party services used to process customer data.",
};

const SUBPROCESSORS = [
  {
    name: "Supabase",
    purpose: "Database hosting and authentication",
    category: "Infrastructure",
    location: "UK / EU (AWS eu-west-2, London)",
    website: "https://supabase.com",
    dataProcessed: "All customer account data, project data, commercial records, audit logs",
    mechanism: "UK IDTA",
    notes: "Primary database and authentication provider. All data stored in the UK (AWS eu-west-2).",
  },
  {
    name: "Stripe",
    purpose: "Payment processing and billing",
    category: "Payments",
    location: "UK / EU / USA",
    website: "https://stripe.com",
    dataProcessed: "Billing name, email, billing address, subscription details. Payment card data held exclusively by Stripe.",
    mechanism: "UK Adequacy / UK IDTA",
    notes: "Stripe is certified under multiple security standards including PCI DSS Level 1. MeasureDeck does not store card details.",
  },
  {
    name: "OpenAI",
    purpose: "AI processing for the AI Copilot feature",
    category: "AI / Machine Learning",
    location: "USA",
    website: "https://openai.com",
    dataProcessed: "Prompts and project context data submitted to the AI Copilot. Data is processed in-context and is not used to train OpenAI models under our enterprise agreement.",
    mechanism: "UK IDTA / SCCs",
    notes: "Only data explicitly submitted to the AI Copilot is processed by OpenAI. Users can opt out of the AI Copilot entirely. We have a data processing agreement with OpenAI prohibiting training on customer data.",
  },
  {
    name: "Resend",
    purpose: "Transactional email delivery",
    category: "Email",
    location: "USA",
    website: "https://resend.com",
    dataProcessed: "Recipient email addresses, email content (e.g. account confirmations, billing notices, security alerts)",
    mechanism: "UK IDTA / SCCs",
    notes: "Used for system-generated transactional emails only. Marketing emails are managed separately.",
  },
  {
    name: "Cloudflare",
    purpose: "CDN, DDoS protection, DNS, and document storage",
    category: "Infrastructure / Storage",
    location: "EU / USA (R2 storage EU region)",
    website: "https://cloudflare.com",
    dataProcessed: "Document and evidence files uploaded by customers. IP addresses for DDoS and bot protection.",
    mechanism: "UK IDTA / SCCs",
    notes: "Document and evidence storage uses Cloudflare R2 with EU-region configuration. Cloudflare edge nodes process IP addresses globally for DDoS protection.",
  },
];

export default function SubprocessorsPage() {
  return (
    <div className="bg-white">
      <div className="bg-[#0D1B2E] py-14">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Sub-processor List</h1>
          <p className="text-slate-400 text-sm">Last updated: 1 June 2026 · Version 1.2</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="legal-content mb-12">
          <p>
            MeasureDeck Ltd is committed to transparency regarding the third-party services we use to process customer data. This page lists all current sub-processors — organisations that process personal data on our behalf — in accordance with our obligations under UK GDPR Article 28 and our <a href="/data-processing-addendum">Data Processing Addendum</a>.
          </p>
          <p>
            We will provide at least 30 days&apos; advance notice of any additions or changes to this list, giving customers the opportunity to object to such changes. Notification of changes is sent to the email address associated with your workspace owner account and is also communicated via the in-app notification system.
          </p>
          <p>
            To object to a sub-processor change or to request further information about any sub-processor, please contact dpo@measuredeck.com.
          </p>
        </div>

        <div className="space-y-6">
          {SUBPROCESSORS.map((sp) => (
            <div
              key={sp.name}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-900 m-0">{sp.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#3B5EE8]">
                    {sp.category}
                  </span>
                </div>
                <a
                  href={sp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3B5EE8] hover:underline font-medium no-underline"
                >
                  {sp.website.replace("https://", "")} ↗
                </a>
              </div>
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Purpose</p>
                  <p className="text-sm text-slate-700">{sp.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Location</p>
                  <p className="text-sm text-slate-700">{sp.location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Transfer Mechanism</p>
                  <p className="text-sm text-slate-700">{sp.mechanism}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Data Processed</p>
                  <p className="text-sm text-slate-700">{sp.dataProcessed}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{sp.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Change Notifications</h2>
          <p className="text-sm text-slate-600 mb-4">
            We will provide at least 30 days&apos; advance notice before adding, replacing, or materially changing a sub-processor. Notification is provided via:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Email to the workspace Owner email address</li>
            <li>In-app notification banner within the MeasureDeck platform</li>
            <li>Update to this page with version increment</li>
          </ul>
          <p className="text-sm text-slate-600 mt-4">
            If you wish to object to a sub-processor change, please contact{" "}
            <a href="mailto:dpo@measuredeck.com" className="text-[#3B5EE8] hover:underline">
              dpo@measuredeck.com
            </a>{" "}
            within the notice period.
          </p>
        </div>

        <div className="mt-8 legal-content">
          <h2>Contractual Safeguards</h2>
          <p>
            MeasureDeck has executed Data Processing Agreements with all sub-processors that include:
          </p>
          <ul>
            <li>Obligations to process data only on MeasureDeck&apos;s instructions;</li>
            <li>Confidentiality obligations binding all personnel with access to customer data;</li>
            <li>Security requirements at least as stringent as those in our DPA;</li>
            <li>Obligations to assist MeasureDeck in fulfilling its obligations to customers under UK GDPR;</li>
            <li>Deletion or return of data at termination;</li>
            <li>Audit rights for MeasureDeck.</li>
          </ul>
          <p>
            For international transfers (USA-based sub-processors), we rely on the UK IDTA (International Data Transfer Addendum) incorporating EU Standard Contractual Clauses (Module 2, controller-to-processor) as the appropriate safeguard under Article 46 UK GDPR.
          </p>
        </div>
      </div>
    </div>
  );
}
