"use client";

import { createClient } from "@/lib/supabase/client";
import { validatePortalToken, logPortalAccess } from "@/lib/portal/token-validator";
import type { PortalToken } from "@/lib/portal/token-validator";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ProjectData {
  id: string;
  name: string;
  address: string | null;
  contract_sum: number | null;
}

interface ApplicationData {
  id: string;
  application_number: number;
  period_ending: string | null;
  application_date: string | null;
  gross_valuation: number | null;
  retention_amount: number | null;
  net_certified: number | null;
  payment_due_date: string | null;
  status: string;
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

export default function PortalHomePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [portalToken, setPortalToken] = useState<PortalToken | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);

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
        setValidationError(
          result.error === "already_used"
            ? "This link has already been used."
            : "This link is invalid. Please contact your contractor for a new link."
        );
        setLoading(false);
        return;
      }

      setPortalToken(result.token);

      const { data: tokenRow } = await supabase
        .from("portal_access_tokens")
        .select("id")
        .eq("token", token)
        .single();
      const typedTokenRow = tokenRow as TokenRowId | null;

      const { data: proj } = await supabase
        .from("projects")
        .select("id, name, address, contract_sum")
        .eq("id", result.token.project_id)
        .single();

      if (!cancelled) setProject((proj as ProjectData | null) ?? null);

      if (result.token.application_id) {
        const { data: app } = await supabase
          .from("applications")
          .select(
            "id, application_number, period_ending, application_date, gross_valuation, retention_amount, net_certified, payment_due_date, status"
          )
          .eq("id", result.token.application_id)
          .single();

        if (!cancelled) setApplication((app as ApplicationData | null) ?? null);
      }

      if (typedTokenRow && !cancelled) {
        await logPortalAccess(
          supabase,
          typedTokenRow.id,
          result.token.workspace_id,
          "portal_home_viewed",
          { resource_type: "project", resource_id: result.token.project_id }
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
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>Verifying secure access…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (validationError) {
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
          <div style={{
            width: 56,
            height: 56,
            background: "#FEF2F2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            Link Invalid
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 15, color: "#475569", lineHeight: 1.6 }}>
            {validationError}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>
            Please contact your contractor to request a new secure link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>
          Welcome to {project?.name ?? "Your"} Client Portal
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#475569" }}>
          Read-only access to your application and project information.
        </p>
      </div>

      {project && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36,
              height: 36,
              background: "#EEF2FF",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B5EE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Project Information</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Project Name</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0F172A" }}>{project.name}</p>
            </div>
            {project.address && (
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Address</p>
                <p style={{ margin: 0, fontSize: 15, color: "#0F172A" }}>{project.address}</p>
              </div>
            )}
            {project.contract_sum !== null && (
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Contract Sum</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0F172A" }}>{formatCurrency(project.contract_sum)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {application && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36,
              height: 36,
              background: "#ECFDF5",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Available Documents</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: "#F8FAFC",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  Application #{application.application_number}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
                  Net Certified: {formatCurrency(application.net_certified)} · {formatDate(application.application_date)}
                </p>
              </div>
              <Link
                href={`/portal/${token}/application`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "#3B5EE8",
                  color: "#FFFFFF",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Application
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!application && portalToken && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Available Documents</h2>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#94A3B8" }}>
            No documents are currently attached to this portal link. Please contact your contractor.
          </p>
        </div>
      )}

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 20px",
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ margin: 0, fontSize: 13, color: "#1E40AF", lineHeight: 1.5 }}>
          This is a read-only portal. You cannot make changes through this portal.
          Your access link expires on {portalToken ? formatDate(portalToken.expires_at.toISOString()) : "—"}.
        </p>
      </div>
    </div>
  );
}
