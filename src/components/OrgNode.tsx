import { motion } from "framer-motion";
import { Colaborador, getDeptClass } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState } from "react";

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
  const deptClass = getDeptClass(person.departamento);

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <motion.button
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: isDimmed ? 0.25 : 1,
          y: 0,
          scale: isSelected ? 1.05 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ scale: 1.07, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(person)}
        className={`relative group cursor-pointer rounded-xl border px-4 py-3 min-w-[160px] max-w-[200px] text-center transition-colors
          ${isSelected
            ? "border-primary bg-secondary shadow-lg shadow-primary/10"
            : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
          }`}
      >
        {/* Dept accent bar */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full bg-dept-${deptClass.replace("dept-", "")}`}
        />

        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center bg-dept-${deptClass.replace("dept-", "")}/15 text-dept-${deptClass.replace("dept-", "")}`}
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

        {/* Expand/collapse for children */}
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

      {/* Children */}
      {children.length > 0 && !collapsed && (
        <div className="flex flex-col items-center mt-3">
          {/* Vertical connector */}
          <div className="w-px h-6 bg-border" />

          {/* Horizontal connector + children */}
          <div className="relative flex items-start gap-2">
            {children.length > 1 && (
              <div
                className="absolute top-0 bg-border"
                style={{
                  height: "1px",
                  left: `calc(50% / ${children.length} * (${children.length} - 1))`,
                  right: `calc(50% / ${children.length} * (${children.length} - 1))`,
                  // simple approach: span from first to last child center
                  ...(children.length > 1 ? { left: "calc(50% - 50% + 80px)", right: "calc(50% - 50% + 80px)" } : {}),
                }}
              />
            )}
            <div className="flex items-start gap-1">
              {children.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical line from horizontal bar to child */}
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
        </div>
      )}
    </div>
  );
}
