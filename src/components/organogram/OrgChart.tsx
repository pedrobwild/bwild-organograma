import { AnimatePresence } from "framer-motion";
import orgData from "@/data/organograma.json";
import { OrgNode } from "./OrgNode";
import { OrgSidebar } from "./OrgSidebar";
import { DepartmentLegend } from "./DepartmentLegend";
import { OrgToolbar } from "./OrgToolbar";
import { useOrganogram, usePanZoom } from "@/hooks/use-organogram";
import logoSrc from "@/assets/logo-bwild.png";

export default function OrgChart() {
  const {
    selectedPerson, setSelectedPerson, highlightDept, setHighlightDept,
    byId, root, departments, handleSelectPerson, highlightPath,
  } = useOrganogram();

  const {
    zoom, pan, isDragging, containerRef,
    handleMouseDown, handleMouseMove, handleMouseUp,
    zoomIn, zoomOut, resetView,
  } = usePanZoom();

  return (
    <div
      className="h-screen font-body relative overflow-hidden flex flex-col"
      style={{ backgroundImage: "url('/images/bg-bwild.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }} />

      <header className="relative z-30 px-6 py-3 flex-shrink-0" style={{ background: "rgba(10,30,60,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="Bwild" className="h-9 w-auto rounded-lg" />
            <div>
              <h1 className="font-display text-lg font-bold text-white tracking-tight leading-tight">{orgData.empresa}</h1>
              <p className="text-[11px] text-white/50 font-medium uppercase tracking-widest">Organograma</p>
            </div>
          </div>
          <DepartmentLegend departments={departments} highlightDept={highlightDept} onHover={setHighlightDept} />
        </div>
      </header>

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
            onClose={() => setSelectedPerson(null)}
            onNavigate={handleSelectPerson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
