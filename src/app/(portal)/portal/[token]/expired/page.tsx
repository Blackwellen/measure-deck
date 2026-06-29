export default function ExpiredPage() {
  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: 520,
        width: "100%",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "56px 48px",
        textAlign: "center",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          width: 64,
          height: 64,
          background: "#FFF7ED",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 style={{
          margin: "0 0 12px",
          fontSize: 24,
          fontWeight: 700,
          color: "#0F172A",
          letterSpacing: "-0.3px",
        }}>
          This link has expired
        </h1>

        <p style={{
          margin: "0 0 8px",
          fontSize: 15,
          color: "#475569",
          lineHeight: 1.6,
        }}>
          Links are valid for 7 days from the date they were issued.
        </p>

        <p style={{
          margin: "0 0 32px",
          fontSize: 15,
          color: "#475569",
          lineHeight: 1.6,
        }}>
          Please contact your contractor to request a new secure access link.
        </p>

        <div style={{
          padding: "16px 20px",
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
        }}>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: "#94A3B8",
            lineHeight: 1.5,
          }}>
            For security reasons, expired links cannot be reactivated. A new link must be issued by your contractor through MeasureDeck.
          </p>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 22,
              height: 22,
              background: "#3B5EE8",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>MeasureDeck</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
            Secure Document Access for Construction Teams
          </p>
        </div>
      </div>
    </div>
  );
}
