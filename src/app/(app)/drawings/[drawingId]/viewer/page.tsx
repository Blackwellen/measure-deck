"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ZoomIn, ZoomOut, Maximize2, RotateCw, Download, X, ChevronLeft,
  AlertTriangle, FileX, Loader2,
} from "lucide-react";

// Supported types
const SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/svg+xml"] as const;
type SupportedType = typeof SUPPORTED_TYPES[number];

interface DrawingMeta {
  id: string;
  filename: string;
  type: string;
  size_bytes: number;
  signed_url: string;
}

// Seed drawing — in production this would be fetched via server action or API
const SEED_DRAWING: DrawingMeta = {
  id: "df-001",
  filename: "Site-Layout-Plan-Rev-A.pdf",
  type: "application/pdf",
  size_bytes: 8494080, // ~8.1 MB
  signed_url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf",
};

const SIZE_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

function formatBytes(b: number) {
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function isSupportedType(type: string): type is SupportedType {
  return (SUPPORTED_TYPES as readonly string[]).includes(type);
}

export default function DrawingViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [drawing, setDrawing] = useState<DrawingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [sizeWarningDismissed, setSizeWarningDismissed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Simulate fetch
    const timer = setTimeout(() => {
      const d = SEED_DRAWING;
      setDrawing(d);
      setLoading(false);
      if (d.size_bytes > SIZE_LIMIT_BYTES) {
        setShowSizeWarning(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [params.drawingId]);

  const handleZoomIn = () => setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))));
  const handleFitPage = () => setZoom(1);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // LOADING
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading drawing…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ERROR
  if (error || !drawing) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <FileX size={48} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Failed to Load Drawing</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>{error ?? "Drawing not found"}</p>
          <button className="btn btn-secondary" onClick={() => router.back()}>
            <ChevronLeft size={14} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isSupported = isSupportedType(drawing.type);
  const isDwg = drawing.filename.toLowerCase().endsWith(".dwg");
  const isImage = drawing.type.startsWith("image/");
  const isPdf = drawing.type === "application/pdf";

  // SIZE WARNING DIALOG
  if (showSizeWarning && !sizeWarningDismissed) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 32, maxWidth: 480, width: "90%", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <AlertTriangle size={40} style={{ color: "#F59E0B", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Large File Warning</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
            This file is <strong>{formatBytes(drawing.size_bytes)}</strong> — larger than 50 MB.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
            Loading may be slow or cause performance issues on some devices. Do you want to continue?
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setShowSizeWarning(false); setSizeWarningDismissed(true); }}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UNSUPPORTED FILE TYPE
  if (!isSupported && !isDwg) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "#111", color: "#fff", textAlign: "center", padding: 40 }}>
        <FileX size={48} style={{ marginBottom: 16, color: "#F59E0B" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Unsupported File Type</h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 20 }}>
          {drawing.filename} ({drawing.type}) cannot be previewed in the browser.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => alert("Downloading…")}>
            <Download size={14} /> Download to View
          </button>
          <button className="btn btn-secondary" style={{ color: "#fff", borderColor: "#444" }} onClick={() => router.back()}>
            <ChevronLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  // DWG — download only
  if (isDwg) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "#111", color: "#fff", textAlign: "center", padding: 40 }}>
        <AlertTriangle size={48} style={{ marginBottom: 16, color: "#F59E0B" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>DWG Preview Not Supported</h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>
          {drawing.filename}
        </p>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 20 }}>
          DWG files cannot be previewed in the browser. Download the file to view it in AutoCAD or a compatible viewer.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => alert("Downloading…")}>
            <Download size={14} /> Download to View
          </button>
          <button className="btn btn-secondary" style={{ color: "#fff", borderColor: "#444" }} onClick={() => router.back()}>
            <ChevronLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  // VIEWER
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#111", color: "#fff", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
        background: "#1a1a1a", borderBottom: "1px solid #333", flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "4px 8px", borderRadius: 6, marginRight: 8 }}
          title="Close viewer"
        >
          <X size={16} />
        </button>

        <div style={{ flex: 1, fontSize: 13, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {drawing.filename}
          <span style={{ marginLeft: 8, fontSize: 11, color: "#666" }}>({formatBytes(drawing.size_bytes)})</span>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button
            onClick={handleZoomOut}
            style={{ background: "#2a2a2a", border: "1px solid #333", color: "#ccc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span style={{ fontSize: 12, color: "#888", minWidth: 48, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            style={{ background: "#2a2a2a", border: "1px solid #333", color: "#ccc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={handleFitPage}
            style={{ background: "#2a2a2a", border: "1px solid #333", color: "#ccc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: 4 }}
            title="Fit page"
          >
            <Maximize2 size={16} />
          </button>

          {isImage && (
            <button
              onClick={handleRotate}
              style={{ background: "#2a2a2a", border: "1px solid #333", color: "#ccc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
          )}

          <button
            onClick={() => alert("Downloading…")}
            style={{ background: "#2a2a2a", border: "1px solid #333", color: "#ccc", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: 4 }}
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Viewer area */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: isImage ? "flex-start" : "stretch", justifyContent: "center" }}>
        {isPdf && (
          <iframe
            src={`${drawing.signed_url}#toolbar=0`}
            style={{ width: "100%", height: "100%", border: "none", transform: `scale(${zoom})`, transformOrigin: "top center" }}
            title={drawing.filename}
          />
        )}

        {isImage && (
          <div style={{ padding: 20, display: "inline-block" }}>
            <img
              ref={imgRef}
              src={drawing.signed_url}
              alt={drawing.filename}
              style={{
                maxWidth: "100%",
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center top",
                transition: "transform 0.2s",
                display: "block",
              }}
              onError={() => setError("Failed to load image")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
