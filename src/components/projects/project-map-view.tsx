"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type SeedProject } from "@/lib/seed/projects";
import { formatCurrency } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

// ─── Status colours ───────────────────────────────────────────────────────────
const STATUS_PIN_COLOR: Record<string, string> = {
  active:     "#10B981",
  disputed:   "#EF4444",
  on_hold:    "#F59E0B",
  completed:  "#8B5CF6",
  archived:   "#94A3B8",
};

// ─── Map auto-fit helper ──────────────────────────────────────────────────────
function FlyToMarker({ lat, lng, active }: { lat: number; lng: number; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.flyTo([lat, lng], 13, { duration: 0.8 });
    }
  }, [active, lat, lng, map]);
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProjectMapViewProps {
  projects: SeedProject[];
  onProjectClick?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProjectMapView({ projects, onProjectClick }: ProjectMapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = projects.filter(p => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedProject = filtered.find(p => p.id === selectedId) ?? null;

  // KPI stats
  const totalMappedValue = filtered.reduce((s, p) => s + p.contractValue, 0);
  const atRiskCount = filtered.filter(p => p.status === "disputed" || p.status === "on_hold").length;
  const completedValue = filtered
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + p.contractValue, 0);

  function handlePinClick(id: string) {
    setSelectedId(prev => (prev === id ? null : id));
  }

  function handleRowClick(id: string) {
    setSelectedId(prev => (prev === id ? null : id));
  }

  const UK_CENTER: [number, number] = [53.5, -2.0];

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Mapped Value</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{formatCurrency(totalMappedValue)}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} projects</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">At-Risk Locations</div>
          <div className="kpi-value" style={{ fontSize: 20, color: atRiskCount > 0 ? "var(--danger)" : "var(--text-primary)" }}>
            {atRiskCount}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>disputed &amp; on hold</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Completed Value</div>
          <div className="kpi-value" style={{ fontSize: 20, color: "var(--violet)" }}>{formatCurrency(completedValue)}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.filter(p => p.status === "completed").length} completed
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="form-input h-8 text-sm pl-8"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-8 text-sm w-36"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        >
          <option value="all">All Regions</option>
          <option value="london">London</option>
          <option value="midlands">Midlands</option>
          <option value="north">North England</option>
          <option value="south">South England</option>
        </select>
        <select
          className="form-input h-8 text-sm w-36"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="disputed">Disputed</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {[
            { label: "Active", color: STATUS_PIN_COLOR.active },
            { label: "Disputed", color: STATUS_PIN_COLOR.disputed },
            { label: "On Hold", color: STATUS_PIN_COLOR.on_hold },
            { label: "Completed", color: STATUS_PIN_COLOR.completed },
          ].map(l => (
            <button
              key={l.label}
              onClick={() => setStatusFilter(prev => prev === l.label.toLowerCase().replace(" ", "_") ? "all" : l.label.toLowerCase().replace(" ", "_"))}
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity"
              style={{
                color: "var(--text-secondary)",
                opacity: statusFilter !== "all" && statusFilter !== l.label.toLowerCase().replace(" ", "_") ? 0.4 : 1,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ background: l.color }}
              />
              {l.label}
            </button>
          ))}
          {(search || statusFilter !== "all") && (
            <button
              className="text-xs font-medium"
              style={{ color: "var(--primary)" }}
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-4" style={{ minHeight: 480 }}>
        {/* Map */}
        <div
          className="flex-1 rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border)", minHeight: 480 }}
        >
          <MapContainer
            center={UK_CENTER}
            zoom={6}
            style={{ width: "100%", height: "100%", minHeight: 480 }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(p => (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={selectedId === p.id ? 14 : 10}
                pathOptions={{
                  color: STATUS_PIN_COLOR[p.status] ?? "#94A3B8",
                  fillColor: STATUS_PIN_COLOR[p.status] ?? "#94A3B8",
                  fillOpacity: selectedId === p.id ? 0.95 : 0.75,
                  weight: selectedId === p.id ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => handlePinClick(p.id) }}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold mb-0.5">{p.name}</p>
                    <p className="text-xs" style={{ color: "#475569" }}>{p.client}</p>
                    <p className="text-xs mt-1 font-bold">{formatCurrency(p.contractValue)}</p>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>{p.address}</p>
                    <button
                      className="mt-2 text-xs font-semibold"
                      style={{ color: "#3B5EE8" }}
                      onClick={() => onProjectClick?.(p.id)}
                    >
                      Open Project →
                    </button>
                  </div>
                </Popup>
                {selectedId === p.id && (
                  <FlyToMarker lat={p.lat} lng={p.lng} active />
                )}
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Right panel — project register table */}
        <div className="w-[400px] flex-shrink-0 card overflow-hidden flex flex-col">
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Project Register
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} projects
            </span>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(p.id)}
                    style={
                      selectedId === p.id
                        ? { background: "rgba(59,94,232,0.06)" }
                        : undefined
                    }
                  >
                    <td className="max-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-white font-bold"
                          style={{ background: p.logoColor, fontSize: 7 }}
                        >
                          {p.logoInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {p.name}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                            {p.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs font-semibold tabular-nums whitespace-nowrap">
                      {formatCurrency(p.contractValue)}
                    </td>
                    <td>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: `${STATUS_PIN_COLOR[p.status]}22`,
                          color: STATUS_PIN_COLOR[p.status],
                        }}
                      >
                        {p.status === "on_hold" ? "On Hold" :
                          p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={e => { e.stopPropagation(); onProjectClick?.(p.id); }}
                        title="Open project"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedProject && (
            <div
              className="border-t p-3 flex flex-col gap-1"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedProject.name}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {selectedProject.address} · {selectedProject.postcode}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {formatCurrency(selectedProject.contractValue)} · Margin {selectedProject.margin}%
              </p>
              <button
                className="btn btn-primary btn-sm text-xs mt-1"
                onClick={() => onProjectClick?.(selectedProject.id)}
              >
                Open Project <ExternalLink size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
