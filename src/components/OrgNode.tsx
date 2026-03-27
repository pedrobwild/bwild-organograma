import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState } from "react";

const DEPT_HSL: Record<string, string> = {
  Diretoria: "45, 100%, 60%",
  Jurídico: "280, 55%, 70%",
  "Business Operations": "200, 75%, 60%",
  Vendas: "155, 55%, 55%",
  Marketing: "340, 65%, 65%",
  Operações: "25, 80%, 58%",
  Arquitetura: "175, 55%, 50%",
};

function deptColor(dept: string) {
  return `hsl(${DEPT_HSL[dept] || "45, 100%, 60%"})`;
}

interface OrgNodeProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (p: Colaborador) => void;
  selectedId: string | null;
  highlightDept: string | null;
  depth?: number;
}

export function OrgNode({
  person,
  byId,
  onSelect,
  selectedId,
  highlightDept,
  depth = 0,
}: OrgNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const children = person.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];

  const isSelected = selectedId === person.id;
  const isDimmed = highlightDept !== null && highlightDept !== person.departamento;
  const color = deptColor(person.departamento);

  return (
    <div className="flex flex-col items-center">
      <motion.button
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: isDimmed ? 0.2 : 1,
          y: 0,
          scale: isSelected ? 1.05 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ scale: 1.07, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(person)}
        className={`relative group cursor-pointer rounded-xl px-4 py-3 min-w-[160px] max-w-[200px] text-center transition-all shadow-lg backdrop-blur-md
          ${isSelected
            ? "bg-white shadow-xl ring-2"
            : "bg-white/95 hover:bg-white hover:shadow-xl"
          }`}
        style={{
          borderLeft: `3px solid ${color}`,
          ...(isSelected ? { ringColor: color, boxShadow: `0 8px 32px -4px ${color}55` } : {}),
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <User className="w-4 h-4" />
          </div>
          <span className="font-display text-sm font-semibold text-card-foreground leading-tight">
            {person.nome}
          </span>
          <span
            className="text-[11px] font-medium leading-tight px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {person.cargo}
          </span>
        </div>

        {children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-card-foreground/10 shadow-sm flex items-center justify-center hover:bg-card transition-colors z-10"
          >
            <ChevronDown
              className={`w-3 h-3 text-card-foreground/60 transition-transform ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
          </button>
        )}
      </motion.button>

      {children.length > 0 && !collapsed && (
        <div className="flex flex-col items-center mt-3">
          <div className="w-px h-6 bg-white/30" />
          <div className="flex items-start gap-1">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center px-1">
                <div className="w-px h-4 bg-white/30" />
                <OrgNode
                  person={child}
                  byId={byId}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  highlightDept={highlightDept}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
