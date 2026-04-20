import { useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronRight, Home, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useOrganogram } from "@/hooks/use-organogram";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { setDeptColorMap } from "@/lib/deptColors";
import { DepartmentLegend } from "./DepartmentLegend";
import { OrgTreeCanvas } from "./OrgTreeCanvas";
import { OrgListView } from "./OrgListView";
import { OrgToolbar } from "./OrgToolbar";
import { EmployeeDrawer } from "@/components/employee/EmployeeDrawer";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { EditModeBanner } from "./EditModeBanner";

export default function OrgChart() {
  const {
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
    chartRef,
    handleSelectPerson,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetView,
    closeSidebar,
    isLoading,
    deptColorMap,
    searchQuery,
    setSearchQuery,
    showDesligados,
    setShowDesligados,
    viewMode,
    setViewMode,
    searchMatch,
    isFullscreen,
    toggleFullscreen,
    paletteOpen,
    setPaletteOpen,
    focusedBranchId,
    focusBranch,
    focusBreadcrumb,
    density,
    toggleDensity,
    editMode,
    toggleEditMode,
    setEditMode,
  } = useOrganogram();

  const { isAdmin } = useAuth();
  const updateColaborador = useUpdateColaborador();
  const isMobile = useIsMobile();
  const effectiveViewMode = isMobile ? "list" : viewMode;

  // Disable edit mode automatically on mobile or list view
  useEffect(() => {
    if (editMode && (isMobile || viewMode === "list")) {
      setEditMode(false);
    }
  }, [editMode, isMobile, viewMode, setEditMode]);

  const handleReassign = async (movedId: string, newSuperiorId: string | null) => {
    const moved = byId.get(movedId);
    const newSup = newSuperiorId ? byId.get(newSuperiorId) : null;
    if (!moved) return;
    try {
      await updateColaborador.mutateAsync({
        id: movedId,
        superior_id: newSuperiorId,
        nivel: newSup ? newSup.nivel + 1 : 0,
      });
      toast.success(
        newSup
          ? `${moved.nome} agora reporta a ${newSup.nome}`
          : `${moved.nome} foi movido para a raiz`,
      );
    } catch {
      toast.error("Erro ao atualizar hierarquia");
    }
  };

  // Sync dynamic dept colors
  useEffect(() => {
    if (deptColorMap && Object.keys(deptColorMap).length > 0) {
      setDeptColorMap(deptColorMap);
    }
  }, [deptColorMap]);

  // Derive roots: focused branch overrides global root
  const canvasRoots = useMemo(() => {
    if (focusedBranchId) {
      const focused = byId.get(focusedBranchId);
      if (focused) return [focused];
    }
    return root ? [root] : [];
  }, [focusedBranchId, byId, root]);

  // Highlight path as a Set (or null when no selection)
  const highlightPathOrNull = useMemo(() => {
    if (!selectedPerson) return null;
    return highlightPath;
  }, [selectedPerson, highlightPath]);

  // Global keyboard shortcuts
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (paletteOpen) return;
        if (selectedPerson) {
          closeSidebar();
          return;
        }
        if (focusedBranchId) {
          focusBranch(null);
          return;
        }
        if (searchQuery) {
          setSearchQuery("");
          return;
        }
      }

      if (isTyping(e.target)) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetView();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
        case "T":
          e.preventDefault();
          setViewMode("tree");
          break;
        case "h":
        case "H":
          e.preventDefault();
          setViewMode("tree-h");
          break;
        case "l":
        case "L":
          e.preventDefault();
          setViewMode("list");
          break;
        case "d":
        case "D":
          e.preventDefault();
          toggleDensity();
          break;
        case "/": {
          e.preventDefault();
          const input = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Buscar"]'
          );
          input?.focus();
          input?.select();
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    paletteOpen,
    selectedPerson,
    focusedBranchId,
    searchQuery,
    setPaletteOpen,
    closeSidebar,
    focusBranch,
    setSearchQuery,
    zoomIn,
    zoomOut,
    resetView,
    toggleFullscreen,
    setViewMode,
    toggleDensity,
  ]);

  if (isLoading || !root) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "rgba(10,30,60,0.9)" }}>
        <p className="text-white/60 text-sm">
          {isLoading ? "Carregando organograma..." : "Nenhum nó raiz encontrado no organograma."}
        </p>
      </div>
    );
  }

  const noResults = searchMatch !== null && searchMatch.size === 0;

  return (
    <div
      ref={chartRef}
      className="h-screen font-body relative overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/images/bg-bwild.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }}
      />

      <OrgToolbar
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showDesligados={showDesligados}
        onToggleDesligados={setShowDesligados}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        chartRef={chartRef as React.RefObject<HTMLDivElement>}
        onOpenPalette={() => setPaletteOpen(true)}
        density={density}
        onToggleDensity={toggleDensity}
        totalPeople={colaboradores.length}
        canEdit={isAdmin && !isMobile && viewMode !== "list"}
        editMode={editMode}
        onToggleEditMode={toggleEditMode}
      />

      <AnimatePresence>
        {editMode && <EditModeBanner onExit={() => setEditMode(false)} />}
      </AnimatePresence>

      {focusedBranchId && focusBreadcrumb.length > 0 && (
        <div className="absolute top-14 left-0 right-0 z-20 pointer-events-none">
          <div
            className="mx-auto max-w-[1600px] px-4 py-2 flex items-center gap-1.5 flex-wrap pointer-events-auto text-[11px]"
            style={{
              background: "rgba(10,30,60,0.5)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => focusBranch(null)}
              className="flex items-center gap-1 text-white/60 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              title="Voltar à raiz (Esc)"
            >
              <Home className="w-3 h-3" />
              Raiz
            </button>
            {focusBreadcrumb.map((person, idx) => {
              const isLast = idx === focusBreadcrumb.length - 1;
              return (
                <div key={person.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-white/30" />
                  <button
                    onClick={() => !isLast && focusBranch(person.id)}
                    disabled={isLast}
                    className={
                      isLast
                        ? "text-white font-medium px-1.5 py-0.5"
                        : "text-white/60 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                    }
                  >
                    {person.nome}
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => focusBranch(null)}
              className="ml-auto text-white/40 hover:text-white p-1 rounded hover:bg-white/10"
              title="Sair do foco"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-hidden select-none pt-14"
        style={{
          cursor:
            effectiveViewMode === "tree" || effectiveViewMode === "tree-h"
              ? isDragging
                ? "grabbing"
                : "grab"
              : "default",
        }}
        onMouseDown={
          effectiveViewMode === "tree" || effectiveViewMode === "tree-h"
            ? handleMouseDown
            : undefined
        }
        onMouseMove={
          effectiveViewMode === "tree" || effectiveViewMode === "tree-h"
            ? handleMouseMove
            : undefined
        }
        onMouseUp={
          effectiveViewMode === "tree" || effectiveViewMode === "tree-h"
            ? handleMouseUp
            : undefined
        }
        onMouseLeave={
          effectiveViewMode === "tree" || effectiveViewMode === "tree-h"
            ? handleMouseUp
            : undefined
        }
      >
        {noResults ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-medium">Nenhum colaborador encontrado</p>
              <p className="text-white/30 text-xs mt-1">
                Tente buscar por outro nome, cargo ou departamento
              </p>
            </div>
          </div>
        ) : effectiveViewMode === "list" ? (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <OrgListView
              root={root}
              byId={byId}
              onSelect={handleSelectPerson}
              selectedId={selectedPerson?.id || null}
              showDesligados={showDesligados}
              searchMatch={searchMatch}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 overflow-hidden flex"
            style={{
              justifyContent: effectiveViewMode === "tree" ? "center" : "flex-start",
              alignItems: effectiveViewMode === "tree" ? "flex-start" : "center",
              paddingTop: effectiveViewMode === "tree" ? 32 : 0,
              paddingLeft: effectiveViewMode === "tree-h" ? 64 : 0,
            }}
          >
            {/* Single transform wrapper: SVG + cards share the same coordinate system */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin:
                  effectiveViewMode === "tree" ? "top center" : "left center",
                transition: isDragging ? "none" : "transform 0.18s ease-out",
                willChange: "transform",
              }}
            >
              <OrgTreeCanvas
                roots={canvasRoots}
                byId={byId}
                selectedId={selectedPerson?.id || null}
                highlightDept={highlightDept}
                highlightPath={highlightPathOrNull}
                searchMatchIds={searchMatch}
                showDesligados={showDesligados}
                orientation={effectiveViewMode === "tree-h" ? "horizontal" : "vertical"}
                density={density}
                onSelect={handleSelectPerson}
                onFocusBranch={focusBranch}
              />
            </div>
          </div>
        )}
      </div>

      <DepartmentLegend
        departments={departments}
        highlightDept={highlightDept}
        onChange={setHighlightDept}
      />

      <AnimatePresence>
        {selectedPerson && (
          <EmployeeDrawer
            person={selectedPerson}
            allColaboradores={colaboradores}
            onClose={closeSidebar}
          />
        )}
      </AnimatePresence>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        colaboradores={colaboradores}
        departments={departments}
        onSelectPerson={handleSelectPerson}
        onFilterDept={setHighlightDept}
        onFocusBranch={focusBranch}
      />

      <ShortcutsHelp />
    </div>
  );
}
