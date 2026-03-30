import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import logoSrc from "@/assets/logo-bwild.png";
import { useOrganogram } from "@/hooks/use-organogram";
import { useIsMobile } from "@/hooks/use-mobile";
import { setDeptColorMap } from "@/lib/deptColors";
import { DepartmentLegend } from "./DepartmentLegend";
import { OrgTreeNode } from "./OrgTreeNode";
import { OrgListView } from "./OrgListView";
import { OrgToolbar } from "./OrgToolbar";
import { EmployeeDrawer } from "@/components/employee/EmployeeDrawer";

export default function OrgChart() {
  const {
    companyName,
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
  } = useOrganogram();

  const isMobile = useIsMobile();
  const effectiveViewMode = isMobile ? "list" : viewMode;

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

  // Check if search yields no results
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
      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }}
      />

      {/* Toolbar */}
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
      />

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-hidden select-none pt-14"
        style={{ cursor: effectiveViewMode === "tree" ? (isDragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={effectiveViewMode === "tree" ? handleMouseDown : undefined}
        onMouseMove={effectiveViewMode === "tree" ? handleMouseMove : undefined}
        onMouseUp={effectiveViewMode === "tree" ? handleMouseUp : undefined}
        onMouseLeave={effectiveViewMode === "tree" ? handleMouseUp : undefined}
      >
        {noResults ? (
          /* Empty state */
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
            className="absolute inset-0 flex items-start justify-center pt-8"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            <OrgTreeNode
              person={root}
              byId={byId}
              onSelect={handleSelectPerson}
              selectedId={selectedPerson?.id || null}
              highlightDept={highlightDept}
              highlightPath={highlightPath}
              showDesligados={showDesligados}
              searchMatch={searchMatch}
            />
          </div>
        )}
      </div>

      {/* Floating legend */}
      <DepartmentLegend
        departments={departments}
        highlightDept={highlightDept}
        onChange={setHighlightDept}
      />

      {/* Employee drawer */}
      <AnimatePresence>
        {selectedPerson && (
          <EmployeeDrawer
            person={selectedPerson}
            allColaboradores={colaboradores}
            onClose={closeSidebar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
