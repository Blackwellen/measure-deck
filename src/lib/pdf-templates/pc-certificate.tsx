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
  titleBlock: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
  },
  certNumber: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 6,
    textAlign: "center",
  },
  certifyBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
  },
  certifyText: {
    fontSize: 11,
    color: "#0f172a",
    lineHeight: 1.6,
    textAlign: "center",
  },
  certifyDate: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    marginTop: 8,
  },
  statutoryBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 4,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statutoryText: {
    fontSize: 9,
    color: "#1e40af",
    textAlign: "center",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  signatureBlock: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    marginTop: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    marginBottom: 4,
    height: 24,
  },
  defectsBox: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  immutableNotice: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
});

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface PCCertificateData {
  projectName: string;
  projectAddress: string;
  contractNumber: string;
  certificateNumber: string;
  pcDate: Date;
  contractAdministratorName: string;
  contractAdministratorCompany: string;
  issuedDate: Date;
  dlpStartDate: Date;
  dlpEndDate: Date;
  dlpMonths: number;
  outstandingDefects: boolean;
  outstandingDefectsDetail?: string;
  documentId: string;
  workspaceName: string;
}

export function PCCertificateDocument({
  data,
}: {
  data: PCCertificateData;
}) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header} fixed>
          <Text style={baseStyles.logo}>MeasureDeck</Text>
          <View>
            <Text style={baseStyles.headerMeta}>{data.workspaceName}</Text>
            <Text style={baseStyles.headerMeta}>
              {formatDate(data.issuedDate)}
            </Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.mainTitle}>
            CERTIFICATE OF PRACTICAL COMPLETION
          </Text>
          <Text style={styles.subtitle}>
            Issued under the terms of the contract
          </Text>
          <Text style={styles.certNumber}>
            Certificate No: {data.certificateNumber}
          </Text>
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Project Details</Text>
          <View style={baseStyles.row}>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Project Name</Text>
              <Text style={baseStyles.value}>{data.projectName}</Text>
            </View>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Contract Number</Text>
              <Text style={baseStyles.value}>{data.contractNumber}</Text>
            </View>
          </View>
          <View style={[baseStyles.row, { marginTop: 8 }]}>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Project Address</Text>
              <Text style={baseStyles.value}>{data.projectAddress}</Text>
            </View>
          </View>
        </View>

        <View style={baseStyles.divider} />

        <View style={styles.certifyBox}>
          <Text style={styles.certifyText}>
            I hereby certify that Practical Completion of the Works described
            in the above contract was achieved on:
          </Text>
          <Text style={styles.certifyDate}>{formatDate(data.pcDate)}</Text>
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>
            Defects Liability Period
          </Text>
          <View style={baseStyles.row}>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>DLP Commencement</Text>
              <Text style={baseStyles.value}>{formatDate(data.dlpStartDate)}</Text>
            </View>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>DLP Duration</Text>
              <Text style={baseStyles.value}>{data.dlpMonths} months</Text>
            </View>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>DLP Expiry</Text>
              <Text style={baseStyles.value}>{formatDate(data.dlpEndDate)}</Text>
            </View>
          </View>
          <Text
            style={[baseStyles.value, { marginTop: 8, fontSize: 9, color: "#64748b" }]}
          >
            The Defects Liability Period commences on the date of Practical
            Completion and expires on the date shown above, after which the
            Contractor shall have made good all defects notified during the DLP.
          </Text>
        </View>

        {data.outstandingDefects && (
          <View style={styles.defectsBox}>
            <Text
              style={[baseStyles.label, { color: "#92400e", marginBottom: 4 }]}
            >
              Outstanding Defects Noted at Practical Completion
            </Text>
            <Text style={[baseStyles.value, { fontSize: 9, color: "#78350f" }]}>
              {data.outstandingDefectsDetail ||
                "Defects outstanding at the date of this certificate to be remedied within the Defects Liability Period."}
            </Text>
          </View>
        )}

        <View style={styles.statutoryBox}>
          <Text style={styles.statutoryText}>
            This certificate triggers the commencement of the Defects Liability
            Period. The issue of this certificate does not relieve the Contractor
            of any obligations under the contract in respect of latent defects or
            outstanding works.
          </Text>
        </View>

        <View style={[baseStyles.section, styles.signatureBlock]}>
          <Text style={baseStyles.sectionTitle}>
            Contract Administrator
          </Text>
          <View style={baseStyles.row}>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Name</Text>
              <Text style={baseStyles.value}>
                {data.contractAdministratorName}
              </Text>
            </View>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Company</Text>
              <Text style={baseStyles.value}>
                {data.contractAdministratorCompany}
              </Text>
            </View>
            <View style={baseStyles.cell}>
              <Text style={baseStyles.label}>Date of Issue</Text>
              <Text style={baseStyles.value}>{formatDate(data.issuedDate)}</Text>
            </View>
          </View>
          <View style={[baseStyles.row, { marginTop: 16 }]}>
            <View style={baseStyles.cell}>
              <Text style={[baseStyles.label, { marginBottom: 8 }]}>
                Signature
              </Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Document ID: {data.documentId} | Generated by MeasureDeck
          </Text>
          <Text style={baseStyles.footerText}>
            Cannot be altered after issue
          </Text>
        </View>
      </Page>
    </Document>
  );
}
