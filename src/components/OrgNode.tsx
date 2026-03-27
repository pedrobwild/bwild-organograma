import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState } from "react";

const DEPT_HSL: Record<string, string> = {
  Diretoria: "45 100% 60%",
  Jurídico: "280 60% 65%",
  "Business Operations": "200 80% 55%",
  Vendas: "150 60% 50%",
  Marketing: "340 70% 60%",
  Operações: "20 80% 55%",
  Arquitetura: "170 60% 50%",
};

function deptHsl(dept: string) {
  return DEPT_HSL[dept] || "45 100% 60%";
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
  const color = `hsl(${deptHsl(person.departamento)})`;

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
        className={`relative group cursor-pointer rounded-xl border px-4 py-3 min-w-[160px] max-w-[200px] text-center transition-colors
          ${isSelected
            ? "border-primary bg-secondary shadow-lg"
            : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
          }`}
        style={isSelected ? { boxShadow: `0 8px 30px -8px ${color}33` } : {}}
      >
        {/* Dept accent bar */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full"
          style={{ backgroundColor: color }}
        />

        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <User className="w-4 h-4" />
          </div>
          <span className="font-display text-sm font-semibold text-foreground leading-tight">
            {person.nome}
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            {person.cargo}
          </span>
        </div>

        {children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
          >
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
          </button>
        )}
      </motion.button>

      {children.length > 0 && !collapsed && (
        <div className="flex flex-col items-center mt-3">
          <div className="w-px h-6 bg-border" />
          <div className="flex items-start gap-1">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center px-1">
                <div className="w-px h-4 bg-border" />
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
