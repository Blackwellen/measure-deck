"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const ENQUIRY_TYPES = [
  { value: "", label: "Select enquiry type" },
  { value: "demo", label: "Book a Demo" },
  { value: "sales", label: "Sales Enquiry" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
  { value: "security", label: "Security / DPA" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    enquiryType: "",
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in touch</h1>
          <p className="text-xl text-slate-300">
            Whether you have a question about the platform, need a demo, or want to discuss your commercial team&apos;s specific requirements — we are here to help.
          </p>
        </div>
      </section>

      {/* Split layout */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left: contact info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>
              <div className="space-y-6 mb-10">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: "hello@measuredeck.com",
                    href: "mailto:hello@measuredeck.com",
                    color: "#3B5EE8",
                  },
                  {
                    icon: Mail,
                    label: "Security",
                    value: "security@measuredeck.com",
                    href: "mailto:security@measuredeck.com",
                    color: "#EF4444",
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: "+44 (0)20 0000 0000",
                    href: "tel:+442000000000",
                    color: "#10B981",
                  },
                  {
                    icon: MapPin,
                    label: "Address",
                    value: "MeasureDeck Ltd, 1 Commercial Street, London, EC1A 1AA",
                    href: null,
                    color: "#6366F1",
                  },
                  {
                    icon: Clock,
                    label: "Support Hours",
                    value: "Mon–Fri, 08:00–18:00 GMT",
                    href: null,
                    color: "#F59E0B",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm text-slate-800 font-medium hover:text-[#3B5EE8] transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-800 font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick links */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-700 mb-4">Quick links</p>
                <div className="space-y-2">
                  {[
                    { label: "Book a 30-min Demo", href: "/demo" },
                    { label: "Start Free Trial", href: "/waitlist" },
                    { label: "View Security Details", href: "/security" },
                    { label: "Data Processing Addendum", href: "/data-processing-addendum" },
                  ].map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors group"
                    >
                      <span className="text-sm text-slate-700 group-hover:text-[#3B5EE8] transition-colors">
                        {l.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3B5EE8] transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Message sent!</h3>
                  <p className="text-slate-500 max-w-sm">
                    Thank you for getting in touch. A member of the MeasureDeck team will respond within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>

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
                        placeholder="James Mitchell"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email address <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="james@contractor.co.uk"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Company
                      </label>
                      <input
                        name="company"
                        type="text"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Apex Construction Ltd"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Role
                      </label>
                      <input
                        name="role"
                        type="text"
                        value={form.role}
                        onChange={handleChange}
                        placeholder="Senior QS"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Enquiry type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="enquiryType"
                      required
                      value={form.enquiryType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors bg-white"
                    >
                      {ENQUIRY_TYPES.map((o) => (
                        <option key={o.value} value={o.value} disabled={!o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your team, your current challenges, or what you need from MeasureDeck..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/10 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-[#3B5EE8] hover:bg-[#2D4ED8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Send Message <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    By submitting this form you agree to our{" "}
                    <a href="/privacy" className="underline hover:text-slate-600">
                      Privacy Policy
                    </a>
                    . We will never share your data with third parties for marketing.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
