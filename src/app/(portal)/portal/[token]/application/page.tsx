"use client";

import { createClient } from "@/lib/supabase/client";
import { validatePortalToken, logPortalAccess } from "@/lib/portal/token-validator";
import type { PortalToken } from "@/lib/portal/token-validator";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ApplicationDetail {
  id: string;
  application_number: number;
  period_ending: string | null;
  application_date: string | null;
  gross_valuation: number | null;
  retention_amount: number | null;
  net_certified: number | null;
  payment_due_date: string | null;
  status: string;
  pln_issued: boolean | null;
  pln_amount: number | null;
  pln_issued_date: string | null;
  pln_reason: string | null;
  final_date_for_payment: string | null;
  pdf_path: string | null;
  certificate_pdf_path: string | null;
}

interface TokenRowId {
  id: string;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function TimelineStep({
  label,
  date,
  index,
  total,
}: {
  label: string;
  date: string | null;
  index: number;
  total: number;
}) {
  const isLast = index === total - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#3B5EE8",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
      }}>
        {index + 1}
      </div>
      {!isLast && (
        <div style={{
          position: "absolute",
          height: 2,
          background: "#BFDBFE",
          top: 15,
          left: `calc(${(index + 0.5) * (100 / total)}% + 16px)`,
          right: `calc(${(total - index - 1.5) * (100 / total)}% + 16px)`,
        }} />
      )}
      <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
        {formatDate(date)}
      </p>
    </div>
  );
}

export default function PortalApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [portalToken, setPortalToken] = useState<PortalToken | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const result = await validatePortalToken(supabase, token);

      if (cancelled) return;

      if (!result.valid || !result.token) {
        if (result.error === "expired") {
          router.replace(`/portal/${token}/expired`);
          return;
        }
        setValidationError("This link has expired or is invalid. Please contact your contractor for a new link.");
        setLoading(false);
        return;
      }

      setPortalToken(result.token);

      if (!result.token.application_id) {
        setValidationError("No application is linked to this portal access.");
        setLoading(false);
        return;
      }

      const { data: tokenRow } = await supabase
        .from("portal_access_tokens")
        .select("id")
        .eq("token", token)
        .single();
      const typedTokenRow = tokenRow as TokenRowId | null;

      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", result.token.project_id)
        .single();

      if (!cancelled && proj) setProjectName((proj as { name: string }).name);

      const { data: app } = await supabase
        .from("applications")
        .select(
          "id, application_number, period_ending, application_date, gross_valuation, retention_amount, net_certified, payment_due_date, status, pln_issued, pln_amount, pln_issued_date, pln_reason, final_date_for_payment, pdf_path, certificate_pdf_path"
        )
        .eq("id", result.token.application_id)
        .single();

      if (!cancelled) setApplication((app as ApplicationDetail | null) ?? null);

      if (typedTokenRow && !cancelled) {
        await logPortalAccess(
          supabase,
          typedTokenRow.id,
          result.token.workspace_id,
          "application_viewed",
          { resource_type: "application", resource_id: result.token.application_id }
        );
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [token, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid #E2E8F0",
            borderTopColor: "#3B5EE8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>Loading application…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (validationError || !application) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{
          maxWidth: 480,
          width: "100%",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: "48px 40px",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)",
        }}>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            Application Not Found
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 15, color: "#475569" }}>
            {validationError ?? "The application could not be loaded. Please contact your contractor."}
          </p>
          <Link href={`/portal/${token}`} style={{ color: "#3B5EE8", fontSize: 14, textDecoration: "none" }}>
            ← Back to portal home
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    { label: "Application Date", date: application.application_date },
    { label: "Payment Due Date", date: application.payment_due_date },
    { label: "Final Date for Payment", date: application.final_date_for_payment },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/portal/${token}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 16 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to portal
        </Link>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px" }}>
          Application #{application.application_number}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#94A3B8" }}>
          {projectName} · {formatDate(application.application_date)}
        </p>
      </div>

      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Valuation Summary</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Gross Valuation</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{formatCurrency(application.gross_valuation)}</p>
          </div>
          <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Retention</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#EF4444" }}>
              {application.retention_amount !== null ? `(${formatCurrency(application.retention_amount)})` : "—"}
            </p>
          </div>
          <div style={{
            padding: "16px",
            background: "#ECFDF5",
            borderRadius: 8,
            border: "1px solid #A7F3D0",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.8px" }}>Net Certified</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#065F46" }}>{formatCurrency(application.net_certified)}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Application Number</p>
            <p style={{ margin: 0, fontSize: 14, color: "#0F172A" }}>#{application.application_number}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Period Ending</p>
            <p style={{ margin: 0, fontSize: 14, color: "#0F172A" }}>{formatDate(application.period_ending)}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Application Date</p>
            <p style={{ margin: 0, fontSize: 14, color: "#0F172A" }}>{formatDate(application.application_date)}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Payment Due Date</p>
            <p style={{ margin: 0, fontSize: 14, color: "#0F172A" }}>{formatDate(application.payment_due_date)}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Status</p>
            <p style={{ margin: 0, fontSize: 14, color: "#0F172A", textTransform: "capitalize" }}>{application.status.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>

      {application.pln_issued && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#991B1B" }}>Pay Less Notice Issued</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.7px" }}>PLN Amount</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#991B1B" }}>{formatCurrency(application.pln_amount)}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.7px" }}>Date Issued</p>
              <p style={{ margin: 0, fontSize: 14, color: "#7F1D1D" }}>{formatDate(application.pln_issued_date)}</p>
            </div>
            {application.pln_reason && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.7px" }}>Reason</p>
                <p style={{ margin: 0, fontSize: 14, color: "#7F1D1D" }}>{application.pln_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(application.pdf_path || application.certificate_pdf_path) && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Documents</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {application.pdf_path && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#F8FAFC",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>Application PDF</span>
                </div>
                <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Contact contractor to download</span>
              </div>
            )}
            {application.certificate_pdf_path && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#F8FAFC",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <polyline points="16 13 12 17 8 13" />
                    <line x1="12" y1="12" x2="12" y2="17" />
                  </svg>
                  <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>Payment Certificate</span>
                </div>
                <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Contact contractor to download</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32,
            height: 32,
            background: "#EEF2FF",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B5EE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0F172A" }}>HGCRA Payment Timeline</h2>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{
            position: "absolute",
            top: 15,
            left: "calc(100% / 6)",
            right: "calc(100% / 6)",
            height: 2,
            background: "#BFDBFE",
          }} />
          {timelineSteps.map((step, idx) => (
            <TimelineStep
              key={step.label}
              label={step.label}
              date={step.date}
              index={idx}
              total={timelineSteps.length}
            />
          ))}
        </div>

        <div style={{
          marginTop: 20,
          padding: "12px 16px",
          background: "#F8FAFC",
          borderRadius: 8,
          border: "1px solid #E2E8F0",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            This application was prepared under the <strong>Housing Grants, Construction and Regeneration Act 1996 (HGCRA)</strong> and the Scheme for Construction Contracts. Payment timelines are governed by these statutory provisions.
          </p>
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 18px",
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
          This is a read-only view. All data is provided for information purposes only.
          Access expires {portalToken ? formatDate(portalToken.expires_at.toISOString()) : "—"}.
        </p>
      </div>
    </div>
  );
}
