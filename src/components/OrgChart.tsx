import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const DEPT_COLORS: Record<string, string> = {
  Diretoria: "var(--dept-diretoria)",
  Jurídico: "var(--dept-juridico)",
  "Business Operations": "var(--dept-business)",
  Vendas: "var(--dept-vendas)",
  Marketing: "var(--dept-marketing)",
  Operações: "var(--dept-operacoes)",
  Arquitetura: "var(--dept-arquitetura)",
};

export function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || "var(--dept-diretoria)";
}

export function getDeptClass(dept: string): string {
  const map: Record<string, string> = {
    Diretoria: "dept-diretoria",
    Jurídico: "dept-juridico",
    "Business Operations": "dept-business",
    Vendas: "dept-vendas",
    Marketing: "dept-marketing",
    Operações: "dept-operacoes",
    Arquitetura: "dept-arquitetura",
  };
  return map[dept] || "dept-diretoria";
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
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
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

      {/* Tree */}
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

      {/* Detail panel */}
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
