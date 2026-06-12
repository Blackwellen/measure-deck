export const metadata = {
  title: "AI Disclaimer — MeasureDeck",
  description: "MeasureDeck AI Disclaimer. Understand the limitations of AI-generated outputs and the requirement for human review.",
};

export default function AIDisclaimerPage() {
  return (
    <div className="bg-white">
      <div className="bg-[#0D1B2E] py-14">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Disclaimer</h1>
          <p className="text-slate-400 text-sm">Last updated: 1 June 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="legal-content">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <p className="text-sm font-semibold text-amber-800 mb-2">Important Notice</p>
            <p className="text-sm text-amber-700">
              All outputs produced by the MeasureDeck AI Copilot are drafts and suggestions only. They must be reviewed, validated, and approved by a qualified professional before use in any commercial, contractual, or legal context. AI outputs do not constitute legal advice, commercial advice, or professional opinion.
            </p>
          </div>

          <h2>1. About the MeasureDeck AI Copilot</h2>
          <p>
            The MeasureDeck AI Copilot is an artificial intelligence-powered assistant integrated into the MeasureDeck commercial management platform. It is designed to help construction quantity surveyors, commercial managers, and related professionals with tasks including:
          </p>
          <ul>
            <li>Drafting contractual notices, compensation event notifications, early warnings, and correspondence;</li>
            <li>Answering questions about commercial position, entitlement, and project data;</li>
            <li>Summarising change register status and outstanding entitlement;</li>
            <li>Identifying patterns or anomalies in cost, valuation, and application data;</li>
            <li>Generating narrative summaries for CVR reports and executive briefings.</li>
          </ul>
          <p>
            The AI Copilot is powered by large language model (LLM) technology provided by OpenAI. The specific models used may change over time as we update our AI infrastructure. All AI processing is subject to our <a href="/privacy">Privacy Policy</a> and our <a href="/data-processing-addendum">Data Processing Addendum</a>.
          </p>

          <h2>2. Limitations of AI-Generated Outputs</h2>
          <h3>2.1 Not Legal or Professional Advice</h3>
          <p>
            MeasureDeck is not a law firm, solicitors practice, or regulated professional services firm. The AI Copilot does not provide legal advice, commercial advice, quantity surveying services, or any other regulated professional advice. No output from the AI Copilot should be treated as a substitute for qualified professional advice.
          </p>
          <p>
            If you need advice on contractual entitlement, dispute resolution, adjudication, arbitration, or any other legally significant commercial matter, you should consult a qualified solicitor, barrister, or accredited construction law specialist.
          </p>
          <h3>2.2 Hallucinations and Inaccuracies</h3>
          <p>
            Large language models can generate content that is factually incorrect, misleading, or &ldquo;hallucinated&rdquo; (i.e., invented or fabricated, including the fabrication of case law, contract clauses, dates, figures, or procedural requirements). This is an inherent limitation of the underlying technology, and it affects all LLM-based AI systems regardless of how they are configured.
          </p>
          <p>
            You must independently verify any factual assertions, contract references, or procedural statements contained in AI Copilot outputs. Do not rely on AI-generated drafts for notices, claims, or correspondence without first checking that they are accurate and appropriate for your specific contract and circumstances.
          </p>
          <h3>2.3 Contract-Specific Limitations</h3>
          <p>
            Construction contracts vary significantly in their terms, conditions, and procedural requirements. JCT, NEC, FIDIC, and bespoke contracts each have different mechanisms for changes, compensation events, extensions of time, and payment. The AI Copilot may not have current or complete knowledge of:
          </p>
          <ul>
            <li>Your specific contract terms, conditions, and bespoke amendments;</li>
            <li>The most recent editions or updates to standard form contracts;</li>
            <li>Jurisdiction-specific variations or requirements;</li>
            <li>Your project-specific agreed procedures, contract data, or contract particulars.</li>
          </ul>
          <p>
            You are responsible for ensuring that any notice, application, or correspondence generated with AI assistance complies with your specific contract requirements.
          </p>
          <h3>2.4 Data Currency</h3>
          <p>
            AI Copilot responses are based on the information available at the time of the query, including the context provided in your prompt. The AI Copilot cannot independently verify that the project data you have entered into MeasureDeck is accurate, complete, or current. Outputs are only as good as the data on which they are based.
          </p>
          <h3>2.5 No Adjudicator, Expert, or Witness Role</h3>
          <p>
            AI Copilot outputs should never be presented as independent expert opinion, adjudicator&apos;s decision, witness statement, or independent assessment in any dispute, litigation, adjudication, or arbitration context. They are internal drafting tools only.
          </p>

          <h2>3. Human Review Requirement</h2>
          <p>
            MeasureDeck requires human review of all AI Copilot outputs before they are used in any external communication, submission, or commercial decision. This is not optional guidance — it is a condition of your use of the AI Copilot.
          </p>
          <p>
            Human review means that a competent professional with the relevant knowledge, qualifications, and contractual awareness must:
          </p>
          <ul>
            <li>Read the AI-generated draft in full;</li>
            <li>Verify that it is factually accurate and complete for the context;</li>
            <li>Check that it complies with the specific contract terms and procedures applicable to your project;</li>
            <li>Apply their professional judgement to assess whether the content is appropriate and serves your commercial interests;</li>
            <li>Make any necessary amendments before issuing or relying on the document.</li>
          </ul>
          <p>
            MeasureDeck is not responsible for any loss, damage, delay, or adverse outcome arising from the use of AI Copilot outputs that have not been subject to appropriate human review.
          </p>

          <h2>4. Automated Decision-Making</h2>
          <p>
            MeasureDeck does not use the AI Copilot, or any other AI system, to make decisions that have legal effects on you or that significantly affect you in an automated manner without human involvement. All recommendations, assessments, and suggestions produced by the AI Copilot are advisory in nature and require human decision-making before action is taken.
          </p>
          <p>
            In particular, the AI Copilot does not autonomously submit applications, issue notices, create change events, or take any action within the platform. All actions require explicit user instruction.
          </p>

          <h2>5. Data Privacy and the AI Copilot</h2>
          <p>
            Data submitted to the AI Copilot is processed by OpenAI in accordance with our <a href="/data-processing-addendum">Data Processing Addendum</a> with OpenAI. Key privacy protections include:
          </p>
          <ul>
            <li>MeasureDeck operates under an enterprise agreement with OpenAI under which OpenAI does not use customer data to train or improve its models;</li>
            <li>Data submitted to the AI Copilot is processed in-context only and is not retained by OpenAI beyond the immediate API call;</li>
            <li>You should exercise caution when including personal data of third parties (e.g. individual names, contact details) in AI Copilot prompts — use anonymised references where possible;</li>
            <li>We recommend not including highly sensitive commercial data (e.g. full contract values, detailed financial positions) in AI Copilot prompts unless necessary for the task;</li>
            <li>AI Copilot usage is logged in your MeasureDeck audit trail for security and compliance purposes.</li>
          </ul>

          <h2>6. AI Output Labelling</h2>
          <p>
            Within the MeasureDeck platform, all content generated by the AI Copilot is clearly labelled with an AI indicator badge. This labelling is maintained when content is copied into other fields within the platform. You must not remove or conceal AI-origin labelling when sharing or submitting documents to third parties in any context where the origin of the content is material.
          </p>

          <h2>7. Scope of AI Use Within MeasureDeck</h2>
          <p>
            AI features in MeasureDeck are currently limited to the AI Copilot module. MeasureDeck does not use AI to automatically price variations, assess entitlement, or make commercial decisions without user input. Any expansion of AI capabilities will be disclosed through our in-app communications and, where appropriate, an updated version of this disclaimer.
          </p>

          <h2>8. Feedback on AI Outputs</h2>
          <p>
            We actively encourage users to provide feedback on AI Copilot outputs — particularly where outputs are inaccurate, misleading, or inappropriate for construction commercial contexts. Feedback helps us improve our prompting, filtering, and quality assurance processes.
          </p>
          <p>
            You can provide feedback directly within the AI Copilot interface, or contact us at ai-feedback@measuredeck.com.
          </p>

          <h2>9. Changes to This Disclaimer</h2>
          <p>
            We may update this AI Disclaimer as our AI features evolve or as guidance on AI use in professional contexts develops. Material updates will be communicated by email and by in-app notice.
          </p>

          <h2>10. Contact</h2>
          <p>
            For questions about our AI features, responsible AI use, or this disclaimer:
          </p>
          <ul>
            <li><strong>General:</strong> hello@measuredeck.com</li>
            <li><strong>AI feedback:</strong> ai-feedback@measuredeck.com</li>
            <li><strong>Data protection (AI Copilot):</strong> dpo@measuredeck.com</li>
          </ul>

        </div>
      </div>
    </div>
  );
}
