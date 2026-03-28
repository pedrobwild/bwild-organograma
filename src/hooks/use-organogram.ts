import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Colaborador } from "@/types/organogram";
import { buildByIdMap, getHighlightPath } from "@/lib/organogram";
import orgData from "@/data/organograma.json";

export function useOrganogram() {
  const [selectedPerson, setSelectedPerson] = useState<Colaborador | null>(null);
  const [highlightDept, setHighlightDept] = useState<string | null>(null);

  const colaboradores = orgData.colaboradores as Colaborador[];
  const byId = useMemo(() => buildByIdMap(colaboradores), [colaboradores]);
  const root = colaboradores.find((c) => c.nivel === 0)!;
  const departments = useMemo(
    () => [...new Set(colaboradores.map((c) => c.departamento))],
    [colaboradores]
  );

  const handleSelectPerson = useCallback((p: Colaborador) => {
    setSelectedPerson((prev) => (prev?.id === p.id ? null : p));
  }, []);

  const highlightPath = useMemo(
    () => getHighlightPath(selectedPerson, byId),
    [selectedPerson, byId]
  );

  return {
    selectedPerson,
    setSelectedPerson,
    highlightDept,
    setHighlightDept,
    colaboradores,
    byId,
    root,
    departments,
    handleSelectPerson,
    highlightPath,
  };
}

export function usePanZoom() {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom,
    pan,
    isDragging,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetView,
  };
}
