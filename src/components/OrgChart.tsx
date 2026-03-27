import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import orgData from "@/data/organograma.json";
import { OrgNode } from "./OrgNode";
import { PersonDetail } from "./PersonDetail";
import { DepartmentLegend } from "./DepartmentLegend";

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

  return (
    <div className="min-h-screen bg-background font-body relative overflow-x-auto">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {orgData.empresa}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organograma Organizacional
            </p>
          </div>
          <DepartmentLegend
            departments={departments}
            highlightDept={highlightDept}
            onHover={setHighlightDept}
          />
        </div>
      </header>

      <div className="px-6 py-10 overflow-x-auto">
        <div className="min-w-[900px] flex flex-col items-center">
          <OrgNode
            person={root}
            byId={byId}
            onSelect={setSelectedPerson}
            selectedId={selectedPerson?.id || null}
            highlightDept={highlightDept}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <PersonDetail
            person={selectedPerson}
            byId={byId}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
