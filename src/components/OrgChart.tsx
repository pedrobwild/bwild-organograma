import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
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

  return (
    <div
      className="min-h-screen font-body relative"
      style={{
        backgroundImage: "url('/images/bg-bwild.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.55) 0%, rgba(10,30,60,0.35) 100%)" }} />

      {/* Header */}
      <header className="sticky top-0 z-30 px-6 py-3" style={{ background: "rgba(10,30,60,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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

      {/* Tree */}
      <div className="relative z-10 px-6 py-12 overflow-x-auto">
        <div className="min-w-[1000px] flex flex-col items-center">
          <OrgNode
            person={root}
            byId={byId}
            onSelect={handleSelectPerson}
            selectedId={selectedPerson?.id || null}
            highlightDept={highlightDept}
          />
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
