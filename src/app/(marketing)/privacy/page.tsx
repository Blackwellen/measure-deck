export const metadata = {
  title: "Privacy Policy — MeasureDeck",
  description: "MeasureDeck Privacy Policy. UK GDPR-compliant privacy notice explaining how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="bg-[#0D1B2E] py-14">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: 1 June 2026 · UK GDPR Compliant</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="legal-content">

          <h2>1. Who We Are</h2>
          <p>
            MeasureDeck Ltd (&ldquo;MeasureDeck,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is the data controller for personal data processed in connection with the MeasureDeck platform and website. We are registered with the Information Commissioner&apos;s Office (ICO) in the United Kingdom.
          </p>
          <p>
            Our registered address is: MeasureDeck Ltd, 1 Commercial Street, London, EC1A 1AA. Our Data Protection Officer can be contacted at dpo@measuredeck.com.
          </p>
          <p>
            This Privacy Policy explains what personal data we collect, why we collect it, how we use it, your rights in relation to it, and how you can exercise those rights. This policy applies to personal data collected through our website (measuredeck.com) and through the MeasureDeck platform.
          </p>

          <h2>2. Data We Collect</h2>
          <h3>2.1 Information you provide directly</h3>
          <ul>
            <li><strong>Account registration data:</strong> name, email address, company name, job title, telephone number;</li>
            <li><strong>Payment information:</strong> billing address, VAT number (payment card details are processed by Stripe and not stored by MeasureDeck);</li>
            <li><strong>Profile information:</strong> profile photograph, professional qualifications, preferences;</li>
            <li><strong>Communications:</strong> messages, support requests, feedback, and correspondence you send to us;</li>
            <li><strong>Commercial and project data:</strong> project details, contract information, cost data, variation records, application data, and documents you upload to the platform (note: this data may include personal data of third parties such as supplier contacts or project personnel).</li>
          </ul>
          <h3>2.2 Information collected automatically</h3>
          <ul>
            <li><strong>Usage data:</strong> pages visited, features used, actions taken within the platform, session duration, and frequency of use;</li>
            <li><strong>Technical data:</strong> IP address, browser type and version, operating system, device type, time zone, and screen resolution;</li>
            <li><strong>Cookies and tracking technologies:</strong> as described in our <a href="/cookies">Cookie Policy</a>;</li>
            <li><strong>Log data:</strong> server logs including your IP address, access dates and times, and pages requested.</li>
          </ul>
          <h3>2.3 Information from third parties</h3>
          <ul>
            <li>Information from single sign-on (SSO) providers where you use SSO to access our Services;</li>
            <li>Information from analytics providers to help us understand how our website and platform are used;</li>
            <li>Information from payment processors (transaction status, not card details).</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We use your personal data for the following purposes:</p>
          <ul>
            <li><strong>Providing the Services:</strong> to create and manage your account, process your subscription, provide customer support, and deliver the commercial management tools you have subscribed to;</li>
            <li><strong>Account security:</strong> to verify your identity, detect and prevent fraud, and maintain the security of your account and the platform;</li>
            <li><strong>Communications:</strong> to send you service-related communications including account confirmations, billing notifications, security alerts, and product updates;</li>
            <li><strong>Marketing:</strong> with your consent, to send you information about MeasureDeck products, features, and events — you can withdraw consent at any time by unsubscribing;</li>
            <li><strong>Improving the Services:</strong> to analyse usage patterns, troubleshoot issues, and develop new features — we use aggregated, anonymised data for this purpose where possible;</li>
            <li><strong>Legal compliance:</strong> to comply with our legal and regulatory obligations, including data protection, tax, and anti-money laundering laws;</li>
            <li><strong>Legitimate interests:</strong> to protect our legal rights, manage our business, and carry out internal administrative activities.</li>
          </ul>

          <h2>4. Legal Basis for Processing</h2>
          <p>
            Under UK GDPR, we must have a lawful basis for processing your personal data. The lawful bases we rely on are:
          </p>
          <ul>
            <li><strong>Contract performance (Article 6(1)(b)):</strong> processing necessary to provide the Services under our contract with you, including account management, service delivery, and billing;</li>
            <li><strong>Legitimate interests (Article 6(1)(f)):</strong> processing necessary for our legitimate interests, including security, fraud prevention, improving our Services, and direct marketing to existing customers — we have conducted legitimate interest assessments (LIAs) and are satisfied our interests are not overridden by your rights;</li>
            <li><strong>Consent (Article 6(1)(a)):</strong> where we have asked for your explicit consent, including for marketing emails to prospects and for the use of non-essential cookies;</li>
            <li><strong>Legal obligation (Article 6(1)(c)):</strong> where processing is required by law, such as for tax or regulatory compliance.</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary for the purposes for which it was collected, subject to legal or regulatory requirements. Our retention periods are:
          </p>
          <ul>
            <li><strong>Account data:</strong> for the duration of your subscription plus 30 days following cancellation (after which it is deleted unless extended retention is agreed);</li>
            <li><strong>Billing and financial records:</strong> 7 years from the relevant transaction, in accordance with HMRC requirements;</li>
            <li><strong>Audit logs:</strong> 7 years from creation, to support dispute resolution and regulatory compliance;</li>
            <li><strong>Marketing contact data:</strong> until you withdraw consent or we determine the data is no longer current;</li>
            <li><strong>Support communications:</strong> 3 years from the date of the communication;</li>
            <li><strong>Website analytics:</strong> 26 months (anonymised aggregates retained indefinitely).</li>
          </ul>
          <p>
            When data is no longer required, it is securely deleted or anonymised in accordance with our data deletion procedures.
          </p>

          <h2>6. Your Rights Under UK GDPR</h2>
          <p>
            Under UK GDPR, you have the following rights in relation to your personal data. To exercise any of these rights, please contact us at dpo@measuredeck.com or via our <a href="/contact">contact page</a>. We will respond within one calendar month.
          </p>
          <h3>Article 15 — Right of Access</h3>
          <p>
            You have the right to obtain confirmation of whether we process personal data about you and, if so, to receive a copy of that data together with information about how it is processed (a &ldquo;Subject Access Request&rdquo; or SAR). The first copy is provided free of charge.
          </p>
          <h3>Article 16 — Right to Rectification</h3>
          <p>
            You have the right to have inaccurate personal data corrected and incomplete personal data completed. You can update most personal data directly within your account settings.
          </p>
          <h3>Article 17 — Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)</h3>
          <p>
            You have the right to request that we delete your personal data in certain circumstances, including where the data is no longer necessary for the purpose for which it was collected, you withdraw consent, or the processing was unlawful. This right is subject to exceptions including where we need to retain data to comply with a legal obligation.
          </p>
          <h3>Article 18 — Right to Restriction of Processing</h3>
          <p>
            You have the right to request that we restrict the processing of your personal data in certain circumstances, such as while a dispute about accuracy is resolved, or where you have objected to processing pending our consideration of your objection.
          </p>
          <h3>Article 20 — Right to Data Portability</h3>
          <p>
            Where processing is based on consent or contract and is carried out by automated means, you have the right to receive your personal data in a structured, commonly used, machine-readable format and to transmit it to another controller. MeasureDeck supports data export in CSV and PDF formats.
          </p>
          <h3>Article 21 — Right to Object</h3>
          <p>
            You have the right to object to processing based on legitimate interests or for direct marketing purposes. Where you object to direct marketing, we will stop processing your data for that purpose. Where you object to other legitimate interest processing, we will cease unless we can demonstrate compelling legitimate grounds.
          </p>
          <h3>Article 22 — Rights Related to Automated Decision-Making</h3>
          <p>
            MeasureDeck does not make decisions about you that produce legal effects or significantly affect you solely by automated means. The AI Copilot provides suggestions and drafts that always require human review.
          </p>
          <h3>Right to Lodge a Complaint</h3>
          <p>
            You have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) if you believe we have not handled your data correctly. The ICO can be contacted at ico.org.uk or by telephone on 0303 123 1113.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies on our website and platform. Our <a href="/cookies">Cookie Policy</a> provides full details of the types of cookies we use, their purposes, and how you can manage your preferences. In summary:
          </p>
          <ul>
            <li><strong>Essential cookies:</strong> required for the platform to function (no consent required);</li>
            <li><strong>Analytics cookies:</strong> help us understand how the platform is used (consent required);</li>
            <li><strong>Marketing cookies:</strong> used for targeted advertising (consent required).</li>
          </ul>

          <h2>8. Third Party Services and Sub-processors</h2>
          <p>
            We share personal data with trusted third-party service providers (&ldquo;sub-processors&rdquo;) to help us deliver the Services. All sub-processors are bound by contractual obligations to process data only on our instructions and to maintain appropriate security measures. Our current sub-processors are listed at <a href="/subprocessors">measuredeck.com/subprocessors</a> and include:
          </p>
          <ul>
            <li><strong>Supabase</strong> — database hosting (UK/EU);</li>
            <li><strong>Stripe</strong> — payment processing (UK/EU/USA);</li>
            <li><strong>OpenAI</strong> — AI processing for the Copilot feature (USA — subject to UK GDPR safeguards);</li>
            <li><strong>Resend</strong> — transactional email delivery (USA — subject to UK GDPR safeguards);</li>
            <li><strong>Cloudflare</strong> — CDN, DDoS protection, and document storage (EU/USA — subject to UK GDPR safeguards).</li>
          </ul>
          <p>
            We will notify you of any changes to our sub-processor list that affect personal data processing before those changes take effect.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your primary project data and account data is stored in the UK (AWS eu-west-2 via Supabase). Some of our sub-processors, including OpenAI and Resend, are based in the USA. Where we transfer personal data outside the UK, we ensure appropriate safeguards are in place, including:
          </p>
          <ul>
            <li>Standard Contractual Clauses (SCCs) adapted for UK international transfers (UK IDTA or equivalent);</li>
            <li>Adequacy decisions where applicable;</li>
            <li>Data minimisation — we transfer only the minimum data necessary for the sub-processor to perform its function.</li>
          </ul>

          <h2>10. Data Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss, or destruction. These measures include AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls, multi-factor authentication, regular penetration testing, and staff data protection training.
          </p>
          <p>
            In the event of a personal data breach, we will notify the ICO within 72 hours where required by law and will notify affected individuals where the breach is likely to result in a high risk to their rights and freedoms.
          </p>

          <h2>11. Children&apos;s Privacy</h2>
          <p>
            The Services are not directed at children under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by email or by displaying a prominent notice on the platform. The date at the top of this page indicates when the policy was last updated. We encourage you to review this policy periodically.
          </p>

          <h2>13. Contact — Data Protection Officer</h2>
          <p>
            For any questions, concerns, or requests regarding this Privacy Policy or your personal data:
          </p>
          <ul>
            <li><strong>Data Protection Officer:</strong> dpo@measuredeck.com</li>
            <li><strong>General enquiries:</strong> hello@measuredeck.com</li>
            <li><strong>Post:</strong> MeasureDeck Ltd, Data Protection Officer, 1 Commercial Street, London, EC1A 1AA</li>
          </ul>

        </div>
      </div>
    </div>
  );
}
