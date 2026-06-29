import type { ReactNode } from "react";

export const metadata = {
  title: "MeasureDeck Client Portal",
  description: "Secure document access for MeasureDeck clients",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F8FAFC", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            background: "#3B5EE8",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>
            MeasureDeck
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#FFFFFF",
            background: "#3B5EE8",
            borderRadius: 4,
            padding: "2px 8px",
            letterSpacing: "0.5px",
          }}>
            CLIENT PORTAL
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 12, color: "#475569" }}>Secure Access</span>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        padding: "16px 24px",
        textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
          Powered by MeasureDeck | Secure Document Access
        </p>
      </footer>
    </div>
  );
}
