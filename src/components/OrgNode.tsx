import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { getDeptColor } from "@/lib/deptColors";

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
  const colors = getDeptColor(person.departamento);

  return (
    <div className="flex flex-col items-center">
      <motion.button
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: isDimmed ? 0.15 : 1,
          y: 0,
          scale: isSelected ? 1.04 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(person)}
        className="relative cursor-pointer text-center transition-all"
        style={{
          borderRadius: "14px",
          padding: "16px 20px",
          width: "170px",
          background: isSelected ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.93)",
          boxShadow: isSelected
            ? `0 0 0 2px ${colors.bg}, 0 20px 50px -12px rgba(0,0,0,0.4)`
            : "0 8px 32px -8px rgba(0,0,0,0.3), 0 2px 8px -2px rgba(0,0,0,0.15)",
        }}
      >
        {/* Top dept color stripe */}
        <div
          className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full"
          style={{ backgroundColor: colors.bg }}
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full w-10 h-10"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            <User className="w-[18px] h-[18px]" />
          </div>

          <span className="font-display font-bold leading-tight text-[13px]" style={{ color: "#0f2137" }}>
            {person.nome}
          </span>

          <span
            className="font-body font-medium leading-tight rounded-md px-2.5 py-1 text-[10.5px]"
            style={{
              color: colors.bg,
              backgroundColor: colors.light,
              border: `1px solid ${colors.border}`,
            }}
          >
            {person.cargo}
          </span>

          {children.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5" style={{ color: "#7a8ca0" }}>
              <Users className="w-[11px] h-[11px]" />
              <span className="text-[10px] font-medium">
                {children.length} {children.length === 1 ? "report" : "reports"}
              </span>
            </div>
          )}
        </div>

        {children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{
              background: colors.bg,
              color: colors.text,
              boxShadow: "0 3px 10px -2px rgba(0,0,0,0.3)",
            }}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
            />
          </button>
        )}
      </motion.button>

      {children.length > 0 && !collapsed && (
        <div className="flex flex-col items-center mt-5">
          <svg width="2" height="28" className="overflow-visible">
            <line x1="1" y1="0" x2="1" y2="28" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>

          {children.length === 1 ? (
            <div className="flex flex-col items-center">
              <svg width="2" height="16" className="overflow-visible">
                <line x1="1" y1="0" x2="1" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
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
            <div className="relative flex items-start gap-3">
              <svg
                className="absolute top-0 left-0 right-0 overflow-visible pointer-events-none"
                style={{ height: "2px", width: "100%" }}
              >
                <line
                  x1={`${100 / (children.length * 2)}%`}
                  y1="1"
                  x2={`${100 - 100 / (children.length * 2)}%`}
                  y2="1"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              </svg>
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <svg width="2" height="18" className="overflow-visible">
                    <line x1="1" y1="0" x2="1" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
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
