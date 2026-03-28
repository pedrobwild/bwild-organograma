import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColaboradores, useDepartmentColors } from "@/hooks/use-colaboradores";
import { Colaborador } from "@/types/organogram";
import {
  buildByIdMap,
  getDepartments,
  getHighlightPath,
  getRootNode,
} from "@/lib/organogram";

const INITIAL_ZOOM = 0.9;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.8;

export function useOrganogram() {
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const { data: deptColorRows = [] } = useDepartmentColors();

  // Build dept color map for deptColors lib
  const deptColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string; light: string; border: string }> = {};
    for (const row of deptColorRows) {
      map[row.departamento] = {
        bg: row.bg,
        text: row.text_color,
        light: `${row.bg}1f`,
        border: `${row.bg}4d`,
      };
    }
    return map;
  }, [deptColorRows]);

  const byId = useMemo(() => buildByIdMap(colaboradores), [colaboradores]);
  const root = useMemo(() => getRootNode(colaboradores), [colaboradores]);
  const departments = useMemo(() => getDepartments(colaboradores), [colaboradores]);

  const [selectedPerson, setSelectedPerson] = useState<Colaborador | null>(null);
  const [highlightDept, setHighlightDept] = useState<string | null>(null);

  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const highlightPath = useMemo(
    () => getHighlightPath(selectedPerson, byId),
    [selectedPerson, byId]
  );

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + 0.15));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - 0.15));
  }, []);

  const resetView = useCallback(() => {
    setZoom(INITIAL_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleSelectPerson = useCallback((person: Colaborador) => {
    setSelectedPerson((prev) => (prev?.id === person.id ? null : person));
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button")) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;

      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.05 : 0.05;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return {
    companyName: "Bwild",
    colaboradores,
    byId,
    root,
    departments,
    selectedPerson,
    highlightDept,
    setHighlightDept,
    highlightPath,
    zoom,
    pan,
    isDragging,
    containerRef,
    handleSelectPerson,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetView,
    closeSidebar: () => setSelectedPerson(null),
    isLoading,
    deptColorMap,
  };
}
