"use client";

import { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
  const [appName, setAppName] = useState("MeasureDeck");
  const [supportEmail, setSupportEmail] = useState("support@measuredeck.app");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementBanner, setAnnouncementBanner] = useState("");
  const [rateLimitPerMin, setRateLimitPerMin] = useState("60");
  const [rateLimitPerHour, setRateLimitPerHour] = useState("1000");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Platform Settings</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Global platform configuration
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <Save size={14} /> Save Settings
        </button>
      </div>

      <div className="page-content">
        {saved && (
          <div style={{ padding: "10px 14px", background: "var(--success-bg)", color: "var(--success-text)", borderRadius: "var(--radius)", fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            Settings saved successfully.
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }} onClick={() => setSaved(false)}>×</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* General */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>General</h3>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">App Name</label>
              <input className="form-input" value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Support Email</label>
              <input className="form-input" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Announcement Banner</label>
              <input
                className="form-input"
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                placeholder="Leave blank to hide banner…"
              />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Shown to all logged-in users at the top of the app.
              </p>
            </div>
          </div>

          {/* Maintenance & Availability */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Availability</h3>

            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: maintenanceMode ? "#FEF2F2" : "var(--surface-raised)", borderRadius: "var(--radius)", border: `1px solid ${maintenanceMode ? "#FCA5A5" : "var(--border)"}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: maintenanceMode ? "#EF4444" : undefined }}>Maintenance Mode</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {maintenanceMode ? "Platform is in maintenance mode — users see maintenance page" : "Platform is live and accepting users"}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  style={{
                    width: 44, height: 24, borderRadius: 999,
                    background: maintenanceMode ? "#EF4444" : "var(--border)",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: maintenanceMode ? 22 : 2,
                    width: 20, height: 20, borderRadius: 9999, background: "#fff",
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
              </label>
            </div>

            {maintenanceMode && (
              <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#FEF2F2", borderRadius: "var(--radius)", marginBottom: 16, fontSize: 13, color: "#EF4444" }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Maintenance mode is active. All users except platform admins will see the maintenance page.</span>
              </div>
            )}
          </div>

          {/* Rate Limits */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Rate Limits</h3>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">API Requests per Minute (per user)</label>
              <input className="form-input" type="number" value={rateLimitPerMin} onChange={(e) => setRateLimitPerMin(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">API Requests per Hour (per user)</label>
              <input className="form-input" type="number" value={rateLimitPerHour} onChange={(e) => setRateLimitPerHour(e.target.value)} />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ padding: 24, border: "1px solid #FCA5A5" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#EF4444" }}>Danger Zone</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              These actions are irreversible. Proceed with caution.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-danger btn-sm" onClick={() => confirm("Purge all demo data? This cannot be undone.") && alert("Demo data purged")}>
                Purge Demo Data
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => confirm("Reset all feature flags to defaults?") && alert("Feature flags reset")}>
                Reset Feature Flags
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={14} /> Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
