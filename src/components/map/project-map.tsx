"use client";

import { formatCurrency } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status?: string;
  color?: string;
  contractValue?: number;
  address?: string;
  ref?: string;
}

interface ProjectMapProps {
  points: MapPoint[];
  height?: number | string;
  zoom?: number;
  onSelect?: (id: string) => void;
  /** Single-point mode draws a focused marker and disables clustering fit */
  single?: boolean;
}

/* ─── Coloured pin factory (no external image assets needed) ───────── */

function makePin(color: string): L.DivIcon {
  return L.divIcon({
    className: "md-map-pin",
    html: `
      <div style="
        width:26px;height:26px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

/* ─── Auto-fit bounds to all points ─────────────────────────────────── */

function FitBounds({ points, single }: { points: MapPoint[]; single?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (single || points.length === 1) {
      map.setView([points[0].lat, points[0].lng], single ? 14 : 12);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [points, single, map]);
  return null;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function ProjectMap({ points, height = 480, zoom = 6, onSelect, single }: ProjectMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (points.length) return [points[0].lat, points[0].lng];
    return [54.0, -2.5]; // UK centre fallback
  }, [points]);

  return (
    <div style={{ height, width: "100%", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} single={single} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={makePin(p.color ?? "#3B5EE8")}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                {p.ref && (
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginBottom: 2 }}>
                    {p.ref}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                {p.address && (
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{p.address}</div>
                )}
                {typeof p.contractValue === "number" && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#3B5EE8", marginBottom: 6 }}>
                    {formatCurrency(p.contractValue)}
                  </div>
                )}
                {onSelect && (
                  <button
                    onClick={() => onSelect(p.id)}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "#fff", background: "#3B5EE8",
                      border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", width: "100%",
                    }}
                  >
                    Open project →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
