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
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 1,
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
  amountBox: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 9,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#ffffff",
  },
  reasonsBox: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#991b1b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reasonsText: {
    fontSize: 9,
    color: "#7f1d1d",
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

export interface PayLessNoticeDocProps {
  documentId: string;
  workspaceName: string;
  issuingParty: string;
  receivingParty: string;
  applicationRef: string;
  applicationDate: string | Date;
  notifiedSum: number;
  withheldAmount: number;
  withholdingReasons: string;
  amountToPay: number;
  issueDate: string | Date;
}

export function PayLessNoticeDocument({
  documentId,
  workspaceName,
  issuingParty,
  receivingParty,
  applicationRef,
  applicationDate,
  notifiedSum,
  withheldAmount,
  withholdingReasons,
  amountToPay,
  issueDate,
}: PayLessNoticeDocProps) {
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

        <Text style={styles.docTitle}>PAY LESS NOTICE</Text>
        <Text style={styles.docSubtitle}>
          Under the Housing Grants, Construction and Regeneration Act 1996, Section 111(3)
        </Text>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Issuing Party</Text>
            <Text style={styles.colValue}>{issuingParty}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Receiving Party</Text>
            <Text style={styles.colValue}>{receivingParty}</Text>
          </View>
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Application Details</Text>
          {[
            { label: "Application Reference", value: applicationRef },
            { label: "Application Date", value: formatDateGB(applicationDate) },
            { label: "Issue Date of this Notice", value: formatDateGB(issueDate) },
          ].map((row) => (
            <View key={row.label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{row.label}</Text>
              <Text style={styles.fieldValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Payment Assessment</Text>
          {[
            { label: "Notified Sum (Certified Amount)", value: formatGBP(notifiedSum) },
            { label: "Amount Withheld", value: `(${formatGBP(withheldAmount)})` },
          ].map((row) => (
            <View key={row.label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{row.label}</Text>
              <Text style={styles.fieldValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reasonsBox}>
          <Text style={styles.reasonsTitle}>Grounds for Withholding (Itemised)</Text>
          <Text style={styles.reasonsText}>{withholdingReasons}</Text>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>{formatGBP(amountToPay)}</Text>
        </View>

        <View style={styles.statutoryBox}>
          <Text style={styles.statutoryText}>
            This notice is issued pursuant to Section 111 of the Housing Grants, Construction and
            Regeneration Act 1996 (as amended by the Local Democracy, Economic Development and
            Construction Act 2009). The paying party hereby gives notice that it intends to pay
            less than the notified sum stated in the payment notice or default payment notice for
            the reasons set out above. This notice must be issued no later than the prescribed
            period before the final date for payment.
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
            PAY LESS NOTICE — HGCRA 1996 s.111 | Cannot be altered after issue
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default PayLessNoticeDocument;
