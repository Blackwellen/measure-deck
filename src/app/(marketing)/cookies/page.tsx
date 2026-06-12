export const metadata = {
  title: "Cookie Policy — MeasureDeck",
  description: "MeasureDeck Cookie Policy. Full information on the cookies we use and how to manage your preferences.",
};

export default function CookiesPage() {
  return (
    <div className="bg-white">
      <div className="bg-[#0D1B2E] py-14">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Cookie Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: 1 June 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="legal-content">

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website or use a web application. They are widely used to make websites work efficiently, to remember your preferences, and to provide information to the website owners about how their site is being used.
          </p>
          <p>
            Similar technologies include web beacons (small transparent image files), local storage, and session storage. In this Cookie Policy, we use the term &ldquo;cookies&rdquo; to refer to all such technologies.
          </p>
          <p>
            Cookies can be &ldquo;persistent&rdquo; (they remain on your device until deleted or until they expire) or &ldquo;session&rdquo; cookies (they are deleted when you close your browser). Cookies can also be &ldquo;first-party&rdquo; (set by the website you are visiting) or &ldquo;third-party&rdquo; (set by a different domain, typically a service provider we use).
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>
            MeasureDeck uses cookies on our website (measuredeck.com) and within the MeasureDeck platform for the following purposes:
          </p>

          <h3>2.1 Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the platform and website to function. They cannot be disabled in our systems, and they do not require your consent under UK PECR. They include:
          </p>
          <ul>
            <li><strong>Authentication cookies:</strong> to keep you logged in during a session and remember your authentication status. Without these cookies, you would need to log in on every page.</li>
            <li><strong>Session cookies:</strong> to maintain your session state across the platform, including form state, navigation state, and in-progress work.</li>
            <li><strong>Security cookies:</strong> to protect against cross-site request forgery (CSRF) and other security threats.</li>
            <li><strong>Load balancing cookies:</strong> to distribute traffic across our servers efficiently.</li>
            <li><strong>Cookie consent record:</strong> to record your cookie preferences so we can honour them.</li>
          </ul>
          <p><em>Legal basis: Essential cookies are set on the basis of our legitimate interest in providing a functioning and secure service (UK PECR Regulation 6(4) — strictly necessary exemption).</em></p>

          <h3>2.2 Functionality Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalisation. They remember choices you make and help us provide a better experience. They include:
          </p>
          <ul>
            <li><strong>Preferences cookies:</strong> to remember your language preferences, dashboard layout choices, and display preferences (e.g. dark/light mode).</li>
            <li><strong>Recently viewed:</strong> to remember which projects, changes, or applications you have recently accessed for quick navigation.</li>
            <li><strong>Feature flags:</strong> to remember which beta features you have opted into.</li>
          </ul>
          <p><em>Legal basis: These cookies require your consent unless strictly necessary for a function you have explicitly requested.</em></p>

          <h3>2.3 Analytics Cookies</h3>
          <p>
            These cookies help us understand how users interact with our website and platform, enabling us to improve usability and performance. They collect information in aggregated, anonymised form. We use:
          </p>
          <ul>
            <li><strong>PostHog / internal analytics:</strong> to track page views, feature usage, session duration, user journeys, and error rates within the platform. This helps us identify friction points and prioritise product improvements.</li>
            <li><strong>Website analytics:</strong> to understand traffic sources, page performance, and conversion funnels on the marketing website.</li>
          </ul>
          <p>
            Analytics data is processed in accordance with our Privacy Policy. We do not use analytics cookies to identify individual users or share analytics data with third parties for advertising purposes.
          </p>
          <p><em>Legal basis: Your consent (required under UK PECR).</em></p>

          <h3>2.4 Marketing and Advertising Cookies</h3>
          <p>
            These cookies are used to serve you relevant advertising on third-party platforms and to measure the effectiveness of our marketing campaigns. We may use:
          </p>
          <ul>
            <li><strong>LinkedIn Insight Tag:</strong> to measure conversions from LinkedIn campaigns and to enable LinkedIn retargeting.</li>
            <li><strong>Google Ads conversion tracking:</strong> to measure conversions from Google advertising campaigns.</li>
          </ul>
          <p>
            These cookies track your online activity across websites to help us show relevant ads. We do not use marketing cookies within the logged-in platform environment.
          </p>
          <p><em>Legal basis: Your consent (required under UK PECR).</em></p>

          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies on our website and platform are set by third parties whose services we use. These third parties have their own cookie and privacy policies, which we encourage you to review:
          </p>
          <ul>
            <li><strong>Stripe</strong> (payment processing) — uses cookies to prevent fraud and ensure payment security. Stripe&apos;s privacy policy is available at stripe.com/gb/privacy.</li>
            <li><strong>Intercom / support chat</strong> — if enabled, uses cookies to manage customer support conversations and track support widget usage.</li>
            <li><strong>LinkedIn</strong> — if marketing cookies are accepted, LinkedIn may set cookies for campaign tracking and retargeting.</li>
            <li><strong>Google</strong> — if marketing cookies are accepted, Google may set cookies for advertising measurement and conversion tracking.</li>
          </ul>

          <h2>4. Your Cookie Choices</h2>
          <h3>4.1 Cookie Consent Banner</h3>
          <p>
            When you first visit our website, you will be presented with a cookie consent banner. You can choose to accept all cookies, reject non-essential cookies, or customise your preferences. Your choices are remembered via a consent cookie.
          </p>
          <h3>4.2 Withdrawing Consent</h3>
          <p>
            You can withdraw or change your cookie consent at any time by clicking the &ldquo;Cookie Settings&rdquo; link in the footer of our website. Note that withdrawing consent may affect functionality of the website or platform.
          </p>
          <h3>4.3 Browser Controls</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul>
            <li>Delete existing cookies from your browser;</li>
            <li>Block all cookies (note: this will affect the functionality of many websites);</li>
            <li>Block third-party cookies;</li>
            <li>Allow cookies from specific sites.</li>
          </ul>
          <p>
            Browser settings vary. Refer to your browser&apos;s help documentation for instructions:
          </p>
          <ul>
            <li>Google Chrome: chrome://settings/cookies</li>
            <li>Mozilla Firefox: about:preferences#privacy</li>
            <li>Microsoft Edge: edge://settings/privacy</li>
            <li>Safari: Settings &gt; Privacy</li>
          </ul>
          <h3>4.4 Do Not Track</h3>
          <p>
            Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT) setting. We acknowledge DNT signals and, where technically feasible, will not set analytics or marketing cookies for users with DNT enabled.
          </p>

          <h2>5. Cookie Table</h2>
          <p>
            The following table sets out the key cookies in use on the MeasureDeck platform and website:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">Cookie Name</th>
                  <th className="text-left px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">Category</th>
                  <th className="text-left px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">Purpose</th>
                  <th className="text-left px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["sb-auth-token", "Strictly Necessary", "Supabase authentication session", "Session"],
                  ["csrf_token", "Strictly Necessary", "Cross-site request forgery protection", "Session"],
                  ["cookie_consent", "Strictly Necessary", "Records your cookie preferences", "1 year"],
                  ["user_prefs", "Functionality", "Stores your dashboard and display preferences", "1 year"],
                  ["ph_session", "Analytics", "PostHog session tracking", "Session"],
                  ["ph_device", "Analytics", "PostHog device identification (anonymised)", "1 year"],
                  ["li_fat_id", "Marketing", "LinkedIn campaign conversion tracking", "30 days"],
                  ["_gcl_au", "Marketing", "Google Ads conversion measurement", "90 days"],
                ].map(([name, cat, purpose, duration]) => (
                  <tr key={name} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-800">{name}</td>
                    <td className="px-4 py-3 text-slate-600">{cat}</td>
                    <td className="px-4 py-3 text-slate-600">{purpose}</td>
                    <td className="px-4 py-3 text-slate-600">{duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our use of cookies or changes in applicable law. The date at the top of this page shows when the policy was last updated. We encourage you to review this policy periodically.
          </p>

          <h2>7. Contact</h2>
          <p>
            If you have questions about our use of cookies, please contact us at privacy@measuredeck.com or via our <a href="/contact">contact page</a>.
          </p>

        </div>
      </div>
    </div>
  );
}
