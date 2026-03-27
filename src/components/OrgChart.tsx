import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import orgData from "@/data/organograma.json";
import { OrgNode } from "./OrgNode";
import { PersonDetail } from "./PersonDetail";
import { DepartmentLegend } from "./DepartmentLegend";
import logoSrc from "@/assets/logo-bwild.png";

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  nivel: number;
  foto: string | null;
  funcoes: string[];
  superior: string | null;
  subordinados: string[];
}

export default function OrgChart() {
  const [selectedPerson, setSelectedPerson] = useState<Colaborador | null>(null);
  const [highlightDept, setHighlightDept] = useState<string | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const colaboradores = orgData.colaboradores as Colaborador[];
  const byId = useMemo(() => {
    const map = new Map<string, Colaborador>();
    colaboradores.forEach((c) => map.set(c.id, c));
    return map;
  }, [colaboradores]);

  const root = colaboradores.find((c) => c.nivel === 0)!;
  const departments = useMemo(
    () => [...new Set(colaboradores.map((c) => c.departamento))],
    [colaboradores]
  );

  const handleSelectPerson = useCallback((p: Colaborador) => {
    setSelectedPerson((prev) => (prev?.id === p.id ? null : p));
  }, []);

  // Compute full hierarchical path (ancestors + selected) for highlighting
  const highlightPath = useMemo(() => {
    if (!selectedPerson) return new Set<string>();
    const path = new Set<string>();
    let current: Colaborador | undefined = selectedPerson;
    while (current) {
      path.add(current.id);
      current = current.superior ? byId.get(current.superior) : undefined;
    }
    // Also add direct subordinates
    selectedPerson.subordinados.forEach((id) => path.add(id));
    return path;
  }, [selectedPerson, byId]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag on buttons/interactive elements
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(2, z + 0.15));
  const zoomOut = () => setZoom((z) => Math.max(0.3, z - 0.15));
  const resetView = () => { setZoom(0.85); setPan({ x: 0, y: 0 }); };

  return (
    <div
      className="h-screen font-body relative overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/images/bg-bwild.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }} />

      {/* Header */}
      <header className="relative z-30 px-6 py-3 flex-shrink-0" style={{ background: "rgba(10,30,60,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="Bwild" className="h-9 w-auto rounded-lg" />
            <div>
              <h1 className="font-display text-lg font-bold text-white tracking-tight leading-tight">
                {orgData.empresa}
              </h1>
              <p className="text-[11px] text-white/50 font-medium uppercase tracking-widest">
                Organograma
              </p>
            </div>
          </div>
          <DepartmentLegend
            departments={departments}
            highlightDept={highlightDept}
            onHover={setHighlightDept}
          />
        </div>
      </header>

      {/* Canvas area — pan & zoom */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-hidden select-none"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 flex items-start justify-center pt-12"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          <OrgNode
            person={root}
            byId={byId}
            onSelect={handleSelectPerson}
            selectedId={selectedPerson?.id || null}
            highlightDept={highlightDept}
            highlightPath={highlightPath}
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, action: zoomIn, label: "Zoom in" },
          { icon: ZoomOut, action: zoomOut, label: "Zoom out" },
          { icon: Maximize, action: resetView, label: "Reset" },
        ].map(({ icon: Icon, action, label }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
            }}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div
          className="text-center text-[10px] font-semibold mt-1 rounded-lg py-1"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedPerson && (
          <PersonDetail
            person={selectedPerson}
            byId={byId}
            onClose={() => setSelectedPerson(null)}
            onNavigate={handleSelectPerson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
