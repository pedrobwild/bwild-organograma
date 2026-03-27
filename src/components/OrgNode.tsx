import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState } from "react";

const DEPT_COLORS: Record<string, string> = {
  Diretoria: "#F5A623",
  Jurídico: "#C084FC",
  "Business Operations": "#38BDF8",
  Vendas: "#34D399",
  Marketing: "#FB7185",
  Operações: "#FB923C",
  Arquitetura: "#2DD4BF",
};

function deptColor(dept: string) {
  return DEPT_COLORS[dept] || "#F5A623";
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
        className="relative group cursor-pointer rounded-xl px-4 py-3 min-w-[160px] max-w-[200px] text-center transition-all bg-white/95 hover:bg-white backdrop-blur-md"
        style={{
          borderLeft: `4px solid ${color}`,
          boxShadow: isSelected
            ? `0 8px 32px -4px ${color}66, 0 0 0 2px ${color}88`
            : "0 4px 20px -4px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}25`, color }}
          >
            <User className="w-4 h-4" />
          </div>
          <span className="font-display text-sm font-semibold leading-tight" style={{ color: "#1a2a42" }}>
            {person.nome}
          </span>
          <span
            className="text-[11px] font-semibold leading-tight px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
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
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
            style={{ border: `2px solid ${color}` }}
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              style={{ color }}
            />
          </button>
        )}
      </motion.button>

      {children.length > 0 && !collapsed && (
        <div className="flex flex-col items-center mt-4">
          {/* Vertical line down */}
          <div className="w-0.5 h-7 bg-white/70 rounded-full" />

          {/* Horizontal bar + children */}
          {children.length === 1 ? (
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-white/70 rounded-full" />
              <OrgNode
                person={children[0]}
                byId={byId}
                onSelect={onSelect}
                selectedId={selectedId}
                highlightDept={highlightDept}
                depth={depth + 1}
              />
            </div>
          ) : (
            <div className="relative flex items-start">
              {/* Horizontal connector bar */}
              <div
                className="absolute top-0 h-0.5 bg-white/70 rounded-full"
                style={{
                  left: `calc(${100 / (children.length * 2)}% + 4px)`,
                  right: `calc(${100 / (children.length * 2)}% + 4px)`,
                }}
              />
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center px-1.5">
                  <div className="w-0.5 h-5 bg-white/70 rounded-full" />
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
          )}
        </div>
      )}
    </div>
  );
}
