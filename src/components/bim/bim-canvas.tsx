"use client";

import dynamic from "next/dynamic";
import type { BimElement, ViewerMode } from "./bim-viewer";

/* react-three-fiber needs the DOM/WebGL — load client-only. */
const BimViewer = dynamic(() => import("./bim-viewer"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{ height: 460, borderRadius: "var(--radius)", background: "linear-gradient(180deg,#eef2f7 0%,#dfe6ef 100%)" }}
    >
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading 3D model…</span>
    </div>
  ),
});

export { buildElements } from "./bim-viewer";
export type { BimElement, ViewerMode };
export default BimViewer;
