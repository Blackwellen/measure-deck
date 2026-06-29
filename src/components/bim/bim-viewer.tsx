"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ─── Model spec ─────────────────────────────────────────────────────── */

export type ViewerMode = "model" | "discipline" | "4d" | "5d";
export type Discipline = "structural" | "architectural" | "mep";

export interface BimElement {
  id: string;
  label: string;
  discipline: Discipline;
  floor: number;
  seq: number;
  budget: number;
  actual: number;
}

const FLOORS = 8;
const FLOOR_H = 1.15;
const FOOTPRINT_X = 6;
const FOOTPRINT_Z = 4;
const MAX_SEQ = FLOORS * 4;

const DISCIPLINE_COLOR: Record<Discipline, number> = {
  structural: 0x64748b,
  architectural: 0x3b82f6,
  mep: 0xf59e0b,
};

export function buildElements(): BimElement[] {
  const els: BimElement[] = [];
  let seq = 0;
  for (let f = 0; f < FLOORS; f++) {
    els.push({ id: `SLB-L${f}`, label: `Floor Slab — Level ${f}`, discipline: "structural", floor: f, seq: seq++, budget: 145000, actual: f < 5 ? 147500 - f * 1200 : 0 });
    els.push({ id: `STR-L${f}`, label: `Structural Frame — Level ${f}`, discipline: "structural", floor: f, seq: seq++, budget: 295000, actual: f < 5 ? 281300 + f * 900 : 0 });
    els.push({ id: `ARC-L${f}`, label: `External Walls — Level ${f}`, discipline: "architectural", floor: f, seq: seq++, budget: 210000, actual: f < 4 ? 205000 + f * 1500 : 0 });
    els.push({ id: `MEP-L${f}`, label: `MEP First Fix — Level ${f}`, discipline: "mep", floor: f, seq: seq++, budget: 92000, actual: f < 3 ? 90500 : 0 });
  }
  return els;
}

/* Geometry for one element. */
function geometryFor(el: BimElement): { geo: THREE.BoxGeometry; y: number; transparent: boolean; opacity: number; wireframe: boolean } {
  const baseY = el.floor * FLOOR_H;
  if (el.discipline === "structural" && el.id.startsWith("SLB"))
    return { geo: new THREE.BoxGeometry(FOOTPRINT_X, 0.16, FOOTPRINT_Z), y: baseY, transparent: false, opacity: 1, wireframe: false };
  if (el.discipline === "structural")
    return { geo: new THREE.BoxGeometry(FOOTPRINT_X - 0.4, FLOOR_H - 0.2, FOOTPRINT_Z - 0.4), y: baseY + FLOOR_H / 2, transparent: true, opacity: 0.35, wireframe: true };
  if (el.discipline === "architectural")
    return { geo: new THREE.BoxGeometry(FOOTPRINT_X + 0.05, FLOOR_H - 0.25, FOOTPRINT_Z + 0.05), y: baseY + FLOOR_H / 2, transparent: true, opacity: 0.5, wireframe: false };
  // mep
  return { geo: new THREE.BoxGeometry(FOOTPRINT_X - 1.2, 0.25, FOOTPRINT_Z - 1.2), y: baseY + 0.35, transparent: false, opacity: 1, wireframe: false };
}

function colorFor(el: BimElement, mode: ViewerMode): number {
  if (mode === "5d") {
    if (el.actual === 0) return 0xcbd5e1;
    return el.actual - el.budget > 0 ? 0xef4444 : 0x10b981;
  }
  return DISCIPLINE_COLOR[el.discipline];
}

/* ─── Component ───────────────────────────────────────────────────────── */

interface BimViewerProps {
  elements: BimElement[];
  mode?: ViewerMode;
  progress?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}

export default function BimViewer({
  elements, mode = "model", progress = 1, selectedId = null, onSelect, height = 460,
}: BimViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const onSelectRef = useRef(onSelect);

  /* Keep the latest onSelect without re-running scene setup. */
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  /* One-time scene setup. */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9eef5);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(12, 9, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(10, 18, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-8, 6, -6);
    scene.add(fill);

    // Ground grid
    const grid = new THREE.GridHelper(30, 30, 0x94a3b8, 0xcbd5e1);
    grid.position.y = -FLOORS * FLOOR_H / 2 - 0.05;
    scene.add(grid);

    // Building group
    const group = new THREE.Group();
    group.position.y = -FLOORS * FLOOR_H / 2;
    scene.add(group);

    const meshes = meshesRef.current;
    meshes.clear();
    for (const el of elements) {
      const { geo, y, transparent, opacity, wireframe } = geometryFor(el);
      const mat = new THREE.MeshStandardMaterial({
        color: colorFor(el, mode),
        transparent, opacity, wireframe,
        metalness: 0.1, roughness: 0.7,
        emissive: new THREE.Color(0x000000),
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, 0);
      mesh.userData.id = el.id;
      group.add(mesh);
      meshes.set(el.id, mesh);
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.minDistance = 6;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0, 0);

    // Raycast picking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0, downY = 0;
    const handleDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; };
    const handleUp = (e: PointerEvent) => {
      if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) return; // was a drag
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(group.children, false);
      if (hits.length) {
        const id = hits[0].object.userData.id as string;
        onSelectRef.current?.(id);
      }
    };
    renderer.domElement.addEventListener("pointerdown", handleDown);
    renderer.domElement.addEventListener("pointerup", handleUp);

    // Animation loop
    let raf = 0;
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", handleDown);
      renderer.domElement.removeEventListener("pointerup", handleUp);
      controls.dispose();
      renderer.dispose();
      meshes.forEach((m) => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
      meshes.clear();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* React to mode / selection changes — recolour without rebuilding the scene. */
  useEffect(() => {
    const els = new Map(elements.map((e) => [e.id, e]));
    meshesRef.current.forEach((mesh, id) => {
      const el = els.get(id);
      if (!el) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (selectedId === id) {
        mat.color.set(0x7c3aed);
        mat.emissive.set(0x7c3aed);
        mat.emissiveIntensity = 0.45;
      } else {
        mat.color.set(colorFor(el, mode));
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [mode, selectedId, elements]);

  /* React to 4D progress — show/hide by construction sequence. */
  useEffect(() => {
    const builtTo = mode === "4d" ? Math.round(progress * MAX_SEQ) : MAX_SEQ;
    const els = new Map(elements.map((e) => [e.id, e]));
    meshesRef.current.forEach((mesh, id) => {
      const el = els.get(id);
      if (!el) return;
      mesh.visible = el.seq < builtTo;
    });
  }, [mode, progress, elements]);

  return <div ref={mountRef} style={{ height, width: "100%", borderRadius: "var(--radius)", overflow: "hidden" }} />;
}
