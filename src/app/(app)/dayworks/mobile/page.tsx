"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { getFlag } from "@/lib/feature-flags";
import {
  calculateDayworkSheet,
  calculateLabourLine,
  calculateMaterialLine,
  calculatePlantLine,
  type DayworkLabourLine,
  type DayworkMaterialLine,
  type DayworkPlantLine,
} from "@/lib/daywork/pricing-engine";

const STORAGE_KEY = "md_daywork_draft";
const QUEUE_KEY = "md_daywork_queue";

const OPERATIVE_TYPES = [
  "Bricklayer",
  "Carpenter / Joiner",
  "Electrician",
  "Foreman",
  "General Operative",
  "Groundworker",
  "Labourer",
  "Painter & Decorator",
  "Pipe Fitter",
  "Plasterer",
  "Plumber",
  "Roofer",
  "Site Manager",
  "Steel Fixer",
  "Steeplejack",
  "Welder",
];

const UNIT_OPTIONS = ["day", "hour", "week", "item", "m", "m²", "m³", "nr", "t"];

interface Project {
  id: string;
  name: string;
}

interface PhotoPreview {
  file: File;
  preview: string;
  uploadedPath?: string;
}

function formatCurrency(n: number): string {
  return `£${n.toFixed(2)}`;
}

function generateSheetNumber(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `DW-${date}-${seq}`;
}

function SectionHeader({
  title,
  total,
  open,
  onToggle,
}: {
  title: string;
  total?: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 rounded-xl text-left"
      style={{ background: "var(--bg-muted)", minHeight: 56 }}
    >
      <span className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
        {title}
      </span>
      <div className="flex items-center gap-3">
        {total !== undefined && (
          <span className="font-mono font-bold text-[14px]" style={{ color: "var(--primary)" }}>
            {formatCurrency(total)}
          </span>
        )}
        {open ? (
          <ChevronUp size={18} style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />
        )}
      </div>
    </button>
  );
}

export default function DayworkMobilePage() {
  const router = useRouter();

  const [flagEnabled] = useState(() => getFlag("mobile_dayworks"));

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sheetNumber] = useState(() => generateSheetNumber());
  const [description, setDescription] = useState("");
  const [agreedOnSite, setAgreedOnSite] = useState(false);
  const [foremanName, setForemanName] = useState("");

  const [labourLines, setLabourLines] = useState<Omit<DayworkLabourLine, "total">[]>([]);
  const [plantLines, setPlantLines] = useState<Omit<DayworkPlantLine, "total">[]>([]);
  const [materialLines, setMaterialLines] = useState<Omit<DayworkMaterialLine, "total">[]>([]);

  const [overheadPercent, setOverheadPercent] = useState(15);
  const [profitPercent, setProfitPercent] = useState(10);

  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const [sectOpen, setSectOpen] = useState({
    labour: true,
    plant: false,
    materials: false,
    totals: true,
    evidence: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSig, setHasSig] = useState(false);

  const calcLabour = labourLines.map(calculateLabourLine);
  const calcPlant = plantLines.map(calculatePlantLine);
  const calcMaterial = materialLines.map(calculateMaterialLine);

  const sheet = calculateDayworkSheet({
    labour_lines: calcLabour,
    plant_lines: calcPlant,
    material_lines: calcMaterial,
    overhead_percent: overheadPercent,
    profit_percent: profitPercent,
  });

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    async function loadProjects() {
      try {
        const supabase = createClient();
        const wsId = await getWorkspaceId(supabase);
        const { data } = await supabase
          .from("projects")
          .select("id, name")
          .eq("workspace_id", wsId)
          .order("name");
        setProjects((data ?? []) as Project[]);
      } catch {
        setProjects([]);
      }
    }
    void loadProjects();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          projectId?: string;
          date?: string;
          description?: string;
          agreedOnSite?: boolean;
          foremanName?: string;
          labourLines?: typeof labourLines;
          plantLines?: typeof plantLines;
          materialLines?: typeof materialLines;
          overheadPercent?: number;
          profitPercent?: number;
        };
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.date) setDate(parsed.date);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.agreedOnSite !== undefined) setAgreedOnSite(parsed.agreedOnSite);
        if (parsed.foremanName) setForemanName(parsed.foremanName);
        if (parsed.labourLines) setLabourLines(parsed.labourLines);
        if (parsed.plantLines) setPlantLines(parsed.plantLines);
        if (parsed.materialLines) setMaterialLines(parsed.materialLines);
        if (parsed.overheadPercent) setOverheadPercent(parsed.overheadPercent);
        if (parsed.profitPercent) setProfitPercent(parsed.profitPercent);
      }
    } catch {
    }
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projectId,
          date,
          description,
          agreedOnSite,
          foremanName,
          labourLines,
          plantLines,
          materialLines,
          overheadPercent,
          profitPercent,
        })
      );
      toast.success("Draft saved");
    } catch {
      toast.error("Could not save draft");
    }
  }, [
    projectId, date, description, agreedOnSite, foremanName,
    labourLines, plantLines, materialLines, overheadPercent, profitPercent,
  ]);

  useEffect(() => {
    if (!isOnline) return;
    async function retryQueue() {
      try {
        const raw = localStorage.getItem(QUEUE_KEY);
        if (!raw) return;
        const items = JSON.parse(raw) as unknown[];
        if (!Array.isArray(items) || items.length === 0) return;
        const supabase = createClient();
        const wsId = await getWorkspaceId(supabase);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        for (const item of items) {
          await supabase.from("daywork_sheets").insert({ ...(item as object), workspace_id: wsId });
        }
        localStorage.removeItem(QUEUE_KEY);
        toast.success(`${items.length} offline daywork(s) synced`);
      } catch {
      }
    }
    void retryQueue();
  }, [isOnline]);

  function addLabourLine() {
    setLabourLines(prev => [
      ...prev,
      { operativeType: "General Operative", hours: 8, day_rate: 200, overtime_hours: 0, overtime_multiplier: 1.5 },
    ]);
  }

  function removeLabourLine(i: number) {
    setLabourLines(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateLabourLine(i: number, patch: Partial<Omit<DayworkLabourLine, "total">>) {
    setLabourLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function addPlantLine() {
    setPlantLines(prev => [
      ...prev,
      { description: "", quantity: 1, unit: "day", rate: 0 },
    ]);
  }

  function removePlantLine(i: number) {
    setPlantLines(prev => prev.filter((_, idx) => idx !== i));
  }

  function updatePlantLine(i: number, patch: Partial<Omit<DayworkPlantLine, "total">>) {
    setPlantLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function addMaterialLine() {
    setMaterialLines(prev => [
      ...prev,
      { description: "", quantity: 1, unit: "nr", unit_rate: 0, uplift_percent: 15 },
    ]);
  }

  function removeMaterialLine(i: number) {
    setMaterialLines(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateMaterialLine(i: number, patch: Partial<Omit<DayworkMaterialLine, "total">>) {
    setMaterialLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos: PhotoPreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }

  function removePhoto(i: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  const getCanvasPos = useCallback((e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  function startDraw(e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  }

  function draw(e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const pos = getCanvasPos(e);
    if (!pos || !lastPosRef.current) return;
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPosRef.current = pos;
    setHasSig(true);
  }

  function endDraw(e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  async function handleSubmit() {
    if (!projectId) { toast.error("Please select a project"); return; }
    if (!description.trim()) { toast.error("Please enter a description of works"); return; }
    if (labourLines.length === 0) { toast.error("Please add at least one labour line"); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const wsId = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      const uploadedPhotoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop() ?? "jpg";
        const path = `dayworks/${wsId}/${sheetNumber}/${Date.now()}.${ext}`;
        const { url } = await uploadFile(supabase, {
          bucket: "project-media",
          path,
          file: photo.file,
        });
        uploadedPhotoUrls.push(url);
      }

      let signatureUrl: string | null = null;
      if (hasSig && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const sigFile = new File([blob], "signature.png", { type: "image/png" });
        const sigPath = `dayworks/${wsId}/${sheetNumber}/signature.png`;
        const { url } = await uploadFile(supabase, {
          bucket: "project-media",
          path: sigPath,
          file: sigFile,
        });
        signatureUrl = url;
      }

      const record = {
        workspace_id: wsId,
        project_id: projectId,
        sheet_number: sheetNumber,
        date,
        description,
        agreed_on_site: agreedOnSite,
        foreman_name: foremanName || null,
        labour_lines: calcLabour,
        plant_lines: calcPlant,
        material_lines: calcMaterial,
        overhead_percent: overheadPercent,
        profit_percent: profitPercent,
        labour_total: sheet.labour_total,
        plant_total: sheet.plant_total,
        material_total: sheet.material_total,
        subtotal: sheet.subtotal,
        overhead_amount: sheet.overhead_amount,
        profit_amount: sheet.profit_amount,
        grand_total: sheet.grand_total,
        photo_urls: uploadedPhotoUrls,
        signature_url: signatureUrl,
        status: "submitted",
        submitted_by: user.id,
      };

      const { error } = await supabase.from("daywork_sheets").insert(record);
      if (error) throw new Error(error.message);

      await createAuditEvent(supabase, {
        workspace_id: wsId,
        user_id: user.id,
        action: "daywork_submitted",
        resource_type: "daywork_sheet",
        resource_id: sheetNumber,
        new_values: { sheet_number: sheetNumber, project_id: projectId, grand_total: sheet.grand_total },
      });

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Daywork sheet submitted");
      router.push("/app/dayworks");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const isNetworkErr = msg.toLowerCase().includes("network") || !navigator.onLine;
      if (isNetworkErr) {
        try {
          const raw = localStorage.getItem(QUEUE_KEY);
          const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
          queue.push({
            project_id: projectId,
            sheet_number: sheetNumber,
            date,
            description,
            agreed_on_site: agreedOnSite,
            foreman_name: foremanName || null,
            labour_lines: calcLabour,
            plant_lines: calcPlant,
            material_lines: calcMaterial,
            overhead_percent: overheadPercent,
            profit_percent: profitPercent,
            labour_total: sheet.labour_total,
            plant_total: sheet.plant_total,
            material_total: sheet.material_total,
            subtotal: sheet.subtotal,
            overhead_amount: sheet.overhead_amount,
            profit_amount: sheet.profit_amount,
            grand_total: sheet.grand_total,
            status: "submitted",
          });
          localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          toast.info("Offline — saved locally, will sync when connected");
        } catch {
          toast.error("Failed to queue offline");
        }
      } else {
        toast.error(`Submission failed: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!flagEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <Camera size={48} style={{ color: "var(--text-muted)" }} className="opacity-40" />
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Mobile Dayworks not enabled
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This feature requires the Mobile Dayworks add-on.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-32 pt-4">
      {!isOnline && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
        >
          <WifiOff size={16} />
          You are offline. Your work will be saved locally.
        </div>
      )}
      {isOnline && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: "var(--success-bg)", color: "var(--success)" }}
        >
          <Wifi size={16} />
          Online
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Daywork Sheet
        </h1>
        <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
          {sheetNumber}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Header Information
          </h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Project *
            </label>
            <select
              className="form-input h-12 text-base"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
            >
              <option value="">Select project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Date *
            </label>
            <input
              type="date"
              className="form-input h-12 text-base"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Description of Works *
            </label>
            <textarea
              className="form-input text-base"
              rows={4}
              placeholder="Describe the work carried out…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Agreed on site?
            </span>
            <button
              type="button"
              onClick={() => setAgreedOnSite(v => !v)}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{ background: agreedOnSite ? "var(--primary)" : "var(--bg-muted)" }}
              role="switch"
              aria-checked={agreedOnSite}
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: agreedOnSite ? "translateX(24px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <SectionHeader
            title="Labour"
            total={sheet.labour_total}
            open={sectOpen.labour}
            onToggle={() => setSectOpen(s => ({ ...s, labour: !s.labour }))}
          />
          {sectOpen.labour && (
            <div className="p-4 flex flex-col gap-4">
              {calcLabour.map((line, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                      Line {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLabourLine(i)}
                      className="p-1.5 rounded-lg"
                      style={{ color: "var(--danger)" }}
                      aria-label="Remove line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-muted)" }}>Operative Type</label>
                    <select
                      className="form-input h-11 text-sm"
                      value={labourLines[i].operativeType}
                      onChange={e => updateLabourLine(i, { operativeType: e.target.value })}
                    >
                      {OPERATIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="form-input h-11 text-sm"
                        value={labourLines[i].hours}
                        onChange={e => updateLabourLine(i, { hours: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Day Rate (£)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="form-input h-11 text-sm"
                        value={labourLines[i].day_rate}
                        onChange={e => updateLabourLine(i, { day_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>OT Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="form-input h-11 text-sm"
                        value={labourLines[i].overtime_hours ?? 0}
                        onChange={e => updateLabourLine(i, { overtime_hours: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>OT Multiplier</label>
                      <input
                        type="number"
                        min={1}
                        step={0.25}
                        className="form-input h-11 text-sm"
                        value={labourLines[i].overtime_multiplier ?? 1.5}
                        onChange={e => updateLabourLine(i, { overtime_multiplier: parseFloat(e.target.value) || 1.5 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Line Total</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: "var(--primary)" }}>
                      {formatCurrency(line.total)}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addLabourLine}
                className="btn btn-secondary w-full h-12 text-base font-semibold"
              >
                <Plus size={18} />
                Add Labour Line
              </button>

              {calcLabour.length > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Labour Total
                  </span>
                  <span className="font-mono font-bold text-[15px]" style={{ color: "var(--primary)" }}>
                    {formatCurrency(sheet.labour_total)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <SectionHeader
            title="Plant"
            total={sheet.plant_total}
            open={sectOpen.plant}
            onToggle={() => setSectOpen(s => ({ ...s, plant: !s.plant }))}
          />
          {sectOpen.plant && (
            <div className="p-4 flex flex-col gap-4">
              {calcPlant.map((line, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                      Plant {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePlantLine(i)}
                      className="p-1.5 rounded-lg"
                      style={{ color: "var(--danger)" }}
                      aria-label="Remove plant line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-muted)" }}>Description</label>
                    <input
                      type="text"
                      className="form-input h-11 text-sm"
                      placeholder="e.g. 3t Dumper"
                      value={plantLines[i].description}
                      onChange={e => updatePlantLine(i, { description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Qty</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="form-input h-11 text-sm"
                        value={plantLines[i].quantity}
                        onChange={e => updatePlantLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Unit</label>
                      <select
                        className="form-input h-11 text-sm"
                        value={plantLines[i].unit}
                        onChange={e => updatePlantLine(i, { unit: e.target.value })}
                      >
                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Rate (£)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="form-input h-11 text-sm"
                        value={plantLines[i].rate}
                        onChange={e => updatePlantLine(i, { rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Line Total</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: "var(--primary)" }}>
                      {formatCurrency(line.total)}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPlantLine}
                className="btn btn-secondary w-full h-12 text-base font-semibold"
              >
                <Plus size={18} />
                Add Plant Line
              </button>

              {calcPlant.length > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Plant Total
                  </span>
                  <span className="font-mono font-bold text-[15px]" style={{ color: "var(--primary)" }}>
                    {formatCurrency(sheet.plant_total)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <SectionHeader
            title="Materials"
            total={sheet.material_total}
            open={sectOpen.materials}
            onToggle={() => setSectOpen(s => ({ ...s, materials: !s.materials }))}
          />
          {sectOpen.materials && (
            <div className="p-4 flex flex-col gap-4">
              {calcMaterial.map((line, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                      Material {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMaterialLine(i)}
                      className="p-1.5 rounded-lg"
                      style={{ color: "var(--danger)" }}
                      aria-label="Remove material line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-muted)" }}>Description</label>
                    <input
                      type="text"
                      className="form-input h-11 text-sm"
                      placeholder="e.g. Ready Mix Concrete C20"
                      value={materialLines[i].description}
                      onChange={e => updateMaterialLine(i, { description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Qty</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="form-input h-11 text-sm"
                        value={materialLines[i].quantity}
                        onChange={e => updateMaterialLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Unit</label>
                      <select
                        className="form-input h-11 text-sm"
                        value={materialLines[i].unit}
                        onChange={e => updateMaterialLine(i, { unit: e.target.value })}
                      >
                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Unit Rate (£)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="form-input h-11 text-sm"
                        value={materialLines[i].unit_rate}
                        onChange={e => updateMaterialLine(i, { unit_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>Uplift %</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="form-input h-11 text-sm"
                        value={materialLines[i].uplift_percent}
                        onChange={e => updateMaterialLine(i, { uplift_percent: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Line Total (incl. uplift)</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: "var(--primary)" }}>
                      {formatCurrency(line.total)}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMaterialLine}
                className="btn btn-secondary w-full h-12 text-base font-semibold"
              >
                <Plus size={18} />
                Add Material Line
              </button>

              {calcMaterial.length > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Materials Total
                  </span>
                  <span className="font-mono font-bold text-[15px]" style={{ color: "var(--primary)" }}>
                    {formatCurrency(sheet.material_total)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <SectionHeader
            title="Totals"
            open={sectOpen.totals}
            onToggle={() => setSectOpen(s => ({ ...s, totals: !s.totals }))}
          />
          {sectOpen.totals && (
            <div className="p-4 flex flex-col gap-3">
              <TotalRow label="Labour" value={sheet.labour_total} />
              <TotalRow label="Plant" value={sheet.plant_total} />
              <TotalRow label="Materials" value={sheet.material_total} />
              <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <TotalRow label="Subtotal" value={sheet.subtotal} bold />
              </div>

              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Overhead %
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOverheadPercent(v => Math.max(0, v - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-mono font-bold">{overheadPercent}%</span>
                  <button
                    type="button"
                    onClick={() => setOverheadPercent(v => v + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <TotalRow label={`Overhead (${overheadPercent}%)`} value={sheet.overhead_amount} />

              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Profit %
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProfitPercent(v => Math.max(0, v - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-mono font-bold">{profitPercent}%</span>
                  <button
                    type="button"
                    onClick={() => setProfitPercent(v => v + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <TotalRow label={`Profit (${profitPercent}%)`} value={sheet.profit_amount} />

              <div
                className="flex justify-between items-center pt-3 px-3 py-3 rounded-xl mt-1"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <span className="font-bold text-[16px]">Grand Total</span>
                <span className="font-mono font-bold text-[20px]">
                  {formatCurrency(sheet.grand_total)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <SectionHeader
            title="Evidence & Signature"
            open={sectOpen.evidence}
            onToggle={() => setSectOpen(s => ({ ...s, evidence: !s.evidence }))}
          />
          {sectOpen.evidence && (
            <div className="p-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Site Photos
                </label>
                <label
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer"
                  style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
                >
                  <Camera size={28} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Tap to take photo or choose file
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                        <img
                          src={p.preview}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ background: "rgba(239,68,68,0.9)" }}
                          aria-label="Remove photo"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Foreman / Agent Signature
                  </label>
                  {hasSig && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs font-medium"
                      style={{ color: "var(--danger)" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: "var(--border)", background: "#fff" }}
                >
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    className="w-full touch-none"
                    style={{ cursor: "crosshair", display: "block" }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                </div>
                {!hasSig && (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Sign above with finger or stylus
                  </p>
                )}
              </div>

              {agreedOnSite && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Agreed by (name)
                  </label>
                  <input
                    type="text"
                    className="form-input h-12 text-base"
                    placeholder="Foreman / Agent name"
                    value={foremanName}
                    onChange={e => setForemanName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex flex-col gap-3 z-10" style={{ background: "var(--bg-base)" }}>
        <div className="flex gap-3 max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={saveDraft}
            className="btn btn-secondary flex-1 h-12 text-base font-semibold"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary flex-1 h-12 text-base font-semibold"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Submit Daywork"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span
        className={bold ? "font-semibold text-[14px]" : "text-sm"}
        style={{ color: bold ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className={bold ? "font-mono font-bold text-[15px]" : "font-mono text-sm"}
        style={{ color: bold ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
