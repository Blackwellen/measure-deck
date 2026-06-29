"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./project-map";

/* Leaflet touches `window`, so the actual map is loaded client-only. */
const ProjectMap = dynamic(() => import("./project-map"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{ height: 480, background: "var(--bg-subtle)", borderRadius: "var(--radius)" }}
    >
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading map…</span>
    </div>
  ),
});

export type { MapPoint };
export default ProjectMap;
