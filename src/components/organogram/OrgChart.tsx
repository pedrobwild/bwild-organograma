import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import logoSrc from "@/assets/logo-bwild.png";
import { useOrganogram } from "@/hooks/use-organogram";
import { setDeptColorMap } from "@/lib/deptColors";
import { DepartmentLegend } from "./DepartmentLegend";
import { OrgNode } from "./OrgNode";
import { OrgSidebar } from "./OrgSidebar";
import { OrgToolbar } from "./OrgToolbar";

export default function OrgChart() {
  const {
    companyName,
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
    closeSidebar,
    isLoading,
    deptColorMap,
  } = useOrganogram();

  // Sync dynamic dept colors
  useEffect(() => {
    if (deptColorMap && Object.keys(deptColorMap).length > 0) {
      setDeptColorMap(deptColorMap);
    }
  }, [deptColorMap]);

  if (isLoading || !root) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "rgba(10,30,60,0.9)" }}>
        <p className="text-white/60 text-sm">
          {isLoading ? "Carregando organograma..." : "Nenhum nó raiz encontrado no organograma."}
        </p>
      </div>
    );
  }

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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }}
      />

      {/* Header */}
      <header
        className="relative z-30 px-6 py-3 flex-shrink-0"
        style={{
          background: "rgba(10,30,60,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0">
              <img src={logoSrc} alt={companyName} className="h-full w-full object-cover" />
            </div>

            <div>
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.2em] leading-none">
                Estrutura organizacional
              </p>
              <h1 className="font-display text-lg font-bold text-white tracking-tight leading-tight">
                {companyName} Org Chart
              </h1>
            </div>
          </div>

          <DepartmentLegend
            departments={departments}
            highlightDept={highlightDept}
            onChange={setHighlightDept}
          />
        </div>
      </header>

      {/* Canvas */}
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

      <OrgToolbar zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />

      <AnimatePresence>
        {selectedPerson && (
          <OrgSidebar
            person={selectedPerson}
            byId={byId}
            onClose={closeSidebar}
            onNavigate={handleSelectPerson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
