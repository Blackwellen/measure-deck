import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import React from "react";
import { baseStyles } from "./base-template";

const styles = StyleSheet.create({
  docTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  docSubtitle: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
  },
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  col: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  colTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  colValue: {
    fontSize: 10,
    color: "#0f172a",
    fontWeight: 700,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  fieldLabel: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  fieldValue: {
    fontSize: 10,
    color: "#0f172a",
    flex: 2,
    textAlign: "right",
  },
  warningBox: {
    backgroundColor: "#dc2626",
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 9,
    color: "#fecaca",
    textAlign: "center",
  },
  groundsBox: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  groundsTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#991b1b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  groundsText: {
    fontSize: 9,
    color: "#7f1d1d",
    lineHeight: 1.5,
  },
  eotBox: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  eotTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#1e40af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  eotText: {
    fontSize: 9,
    color: "#1e3a8a",
    lineHeight: 1.5,
  },
  statutoryBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginTop: 12,
  },
  statutoryText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  immutableWarning: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateGB(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface SuspensionNoticeDocProps {
  documentId: string;
  workspaceName: string;
  suspendingParty: string;
  employerParty: string;
  applicationRef: string;
  amountOutstanding: number;
  daysOverdue: number;
  noticePeriodDays: number;
  suspensionEffectiveDate: string | Date;
  worksSuspended: string;
  issueDate: string | Date;
}

export function SuspensionNoticeDocument({
  documentId,
  workspaceName,
  suspendingParty,
  employerParty,
  applicationRef,
  amountOutstanding,
  daysOverdue,
  noticePeriodDays,
  suspensionEffectiveDate,
  worksSuspended,
  issueDate,
}: SuspensionNoticeDocProps) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header} fixed>
          <Text style={baseStyles.logo}>MeasureDeck</Text>
          <View>
            <Text style={baseStyles.headerMeta}>{workspaceName}</Text>
            <Text style={baseStyles.headerMeta}>{formatDateGB(new Date())}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>NOTICE OF SUSPENSION OF PERFORMANCE</Text>
        <Text style={styles.docSubtitle}>
          Under the Housing Grants, Construction and Regeneration Act 1996, Section 112
        </Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>FORMAL NOTICE OF SUSPENSION</Text>
          <Text style={styles.warningText}>
            This document constitutes a formal notice of suspension of performance pursuant to
            s.112 HGCRA 1996. Suspension takes effect {noticePeriodDays} days from issue.
          </Text>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Suspending Party (Contractor)</Text>
            <Text style={styles.colValue}>{suspendingParty}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Employer / Paying Party</Text>
            <Text style={styles.colValue}>{employerParty}</Text>
          </View>
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Notice Details</Text>
          {[
            { label: "Application Reference", value: applicationRef },
            { label: "Issue Date of this Notice", value: formatDateGB(issueDate) },
            { label: "Notice Period", value: `${noticePeriodDays} days` },
            { label: "Suspension Effective Date", value: formatDateGB(suspensionEffectiveDate) },
            { label: "Amount Outstanding", value: formatGBP(amountOutstanding) },
            { label: "Days Overdue", value: `${daysOverdue} calendar days` },
          ].map((row) => (
            <View key={row.label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{row.label}</Text>
              <Text style={styles.fieldValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.groundsBox}>
          <Text style={styles.groundsTitle}>
            Grounds for Suspension (s.112(1) HGCRA 1996)
          </Text>
          <Text style={styles.groundsText}>
            The Employer has failed to pay the notified sum of {formatGBP(amountOutstanding)} by
            the final date for payment in accordance with the contract and the Housing Grants,
            Construction and Regeneration Act 1996 (as amended). The amount remains outstanding
            for {daysOverdue} calendar days beyond the final date for payment.
          </Text>
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Scope of Works to be Suspended</Text>
          <Text style={{ fontSize: 9, color: "#1e293b", lineHeight: 1.6 }}>{worksSuspended}</Text>
        </View>

        <View style={styles.eotBox}>
          <Text style={styles.eotTitle}>Extension of Time Entitlement (s.112(4) HGCRA 1996)</Text>
          <Text style={styles.eotText}>
            Pursuant to Section 112(4) of the Housing Grants, Construction and Regeneration Act
            1996, the Contractor is entitled to a reasonable extension of time for completion of
            the works equivalent to the period of suspension. The Contractor reserves all rights
            to claim such extension and any resultant loss and expense arising from the period of
            suspension.
          </Text>
        </View>

        <View style={styles.statutoryBox}>
          <Text style={styles.statutoryText}>
            This notice is issued pursuant to Section 112 of the Housing Grants, Construction and
            Regeneration Act 1996 (as amended). The right to suspend is a statutory right and
            does not require contractual provision. The Contractor will recommence performance
            promptly upon payment of the outstanding amount, plus any reasonable costs of
            suspension and reinstatement, and will provide adequate notice of reinstatement in
            accordance with s.112(3A).
          </Text>
        </View>

        <Text style={styles.immutableWarning}>
          Document ID: {documentId} — Cannot be altered after issue
        </Text>

        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by MeasureDeck | Document ID: {documentId}
          </Text>
          <Text style={baseStyles.footerText}>
            SUSPENSION NOTICE — HGCRA 1996 s.112 | Cannot be altered after issue
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default SuspensionNoticeDocument;
