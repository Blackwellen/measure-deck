"use client";

import { useState } from "react";
import { Upload, History } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Terms", "Privacy", "Cookies", "Acceptable Use", "DPA", "Subprocessors", "AI Disclaimer", "Security"] as const;
type Tab = typeof TABS[number];

interface DocVersion {
  version: string;
  published: string;
  author: string;
}

const VERSION_HISTORY: Record<Tab, DocVersion[]> = {
  Terms: [
    { version: "1.2", published: "01 Mar 2026", author: "Legal Team" },
    { version: "1.1", published: "01 Sep 2025", author: "Legal Team" },
    { version: "1.0", published: "01 Jan 2025", author: "Founder" },
  ],
  Privacy: [
    { version: "2.0", published: "15 Apr 2026", author: "DPO" },
    { version: "1.0", published: "01 Jan 2025", author: "Founder" },
  ],
  Cookies: [
    { version: "1.1", published: "01 Feb 2026", author: "Legal Team" },
    { version: "1.0", published: "01 Jan 2025", author: "Founder" },
  ],
  "Acceptable Use": [
    { version: "1.0", published: "01 Jan 2025", author: "Founder" },
  ],
  DPA: [
    { version: "1.0", published: "01 Jan 2025", author: "DPO" },
  ],
  Subprocessors: [
    { version: "3.0", published: "10 Jun 2026", author: "DPO" },
    { version: "2.0", published: "01 Jan 2026", author: "DPO" },
  ],
  "AI Disclaimer": [
    { version: "1.0", published: "15 Apr 2026", author: "Legal Team" },
  ],
  Security: [
    { version: "1.1", published: "01 Mar 2026", author: "Security Team" },
    { version: "1.0", published: "01 Jan 2025", author: "Founder" },
  ],
};

const PLACEHOLDER_CONTENT: Record<Tab, string> = {
  Terms: "# Terms of Service\n\nLast updated: 1 March 2026\n\nThese Terms of Service govern your use of MeasureDeck...",
  Privacy: "# Privacy Policy\n\nLast updated: 15 April 2026\n\nMeasureDeck Ltd is committed to protecting your personal data...",
  Cookies: "# Cookie Policy\n\nLast updated: 1 February 2026\n\nWe use cookies to improve your experience on MeasureDeck...",
  "Acceptable Use": "# Acceptable Use Policy\n\nLast updated: 1 January 2025\n\nYou must not use MeasureDeck to...",
  DPA: "# Data Processing Agreement\n\nLast updated: 1 January 2025\n\nThis Data Processing Agreement ('DPA') forms part of the agreement...",
  Subprocessors: "# Subprocessors\n\nLast updated: 10 June 2026\n\n| Subprocessor | Purpose | Location |\n|---|---|---|\n| Supabase | Database & Auth | EU |\n| Stripe | Payments | US |\n| Resend | Transactional Email | US |\n| Cloudflare | CDN & Storage | Global |",
  "AI Disclaimer": "# AI Disclaimer\n\nLast updated: 15 April 2026\n\nMeasureDeck uses AI to assist with classification and analysis. AI outputs should be reviewed by a qualified professional...",
  Security: "# Security Policy\n\nLast updated: 1 March 2026\n\nMeasureDeck implements industry-standard security controls including...",
};

export default function AdminLegalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Terms");
  const [content, setContent] = useState<Record<Tab, string>>(PLACEHOLDER_CONTENT);

  const currentVersion = VERSION_HISTORY[activeTab][0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Legal Documents</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Manage and publish legal pages</p>
        </div>
      </div>

      <div className="tab-bar" style={{ marginTop: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24 }}>
          <div>
            {/* Current version card */}
            <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Current Version: </span>
                <span className="badge chip-success">v{currentVersion.version}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 12 }}>
                  Published {currentVersion.published} by {currentVersion.author}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm"><History size={14} /> History</button>
                <button className="btn btn-primary btn-sm" onClick={() => alert(`Publishing ${activeTab}…`)}>
                  <Upload size={14} /> Publish
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, background: "var(--surface-raised)" }}>
                Editing: {activeTab}
              </div>
              <textarea
                style={{
                  width: "100%", minHeight: 480, padding: 16, border: "none",
                  fontFamily: "monospace", fontSize: 13, resize: "vertical",
                  background: "var(--surface)", color: "var(--text)", outline: "none",
                  boxSizing: "border-box",
                }}
                value={content[activeTab]}
                onChange={(e) => setContent((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => alert(`Saved draft for ${activeTab}`)}>Save Draft</button>
              <button className="btn btn-secondary" onClick={() => setContent((prev) => ({ ...prev, [activeTab]: PLACEHOLDER_CONTENT[activeTab] }))}>
                Reset
              </button>
            </div>
          </div>

          {/* Version history sidebar */}
          <div style={{ width: 260 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
                Version History
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Version</th><th>Published</th><th>Author</th></tr>
                </thead>
                <tbody>
                  {VERSION_HISTORY[activeTab].map((v) => (
                    <tr key={v.version}>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>v{v.version}</td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.published}</td>
                      <td style={{ fontSize: 12 }}>{v.author}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
