"use client";

// ─── Compass SVG icon ─────────────────────────────────────────────────────────

function CompassIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="27" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="28" cy="28" r="3" fill="#94A3B8" />
      {/* North needle (red) */}
      <polygon points="28,10 25,28 31,28" fill="#EF4444" opacity="0.85" />
      {/* South needle (muted) */}
      <polygon points="28,46 25,28 31,28" fill="#CBD5E1" />
      {/* Cardinal labels */}
      <text x="28" y="8"  textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">N</text>
      <text x="28" y="52" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94A3B8">S</text>
      <text x="50" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94A3B8">E</text>
      <text x="6"  y="31" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94A3B8">W</text>
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DeliverySiteMapPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-[18px] font-700" style={{ color: "var(--text-primary)" }}>Site Map</h2>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          Upload and view the interactive site layout for this project
        </p>
      </div>

      {/* Placeholder card */}
      <div
        className="card flex flex-col items-center justify-center gap-5 py-24"
        style={{ background: "var(--bg-muted)", border: "2px dashed var(--border)" }}
      >
        <CompassIcon />
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-[15px] font-600" style={{ color: "var(--text-primary)" }}>
            No site map uploaded yet
          </p>
          <p className="text-[13px] max-w-xs" style={{ color: "var(--text-muted)" }}>
            Upload a site layout to view and annotate an interactive map for this project.
          </p>
        </div>
        <button className="btn btn-primary">Upload Map</button>
      </div>
    </div>
  );
}
