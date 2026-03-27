import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { getDeptColor } from "@/lib/deptColors";

const LINE_STYLE = "rgba(255,255,255,0.45)";

/** Draws vertical line from parent → horizontal bar → vertical lines to each child */
function ChildrenConnector({ children }: { children: ReactNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barStyle, setBarStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cols = el.querySelectorAll<HTMLElement>("[data-child-col]");
    if (cols.length < 2) return;
    const first = cols[0];
    const last = cols[cols.length - 1];
    const parentRect = el.getBoundingClientRect();
    const firstCenter = first.getBoundingClientRect().left + first.getBoundingClientRect().width / 2 - parentRect.left;
    const lastCenter = last.getBoundingClientRect().left + last.getBoundingClientRect().width / 2 - parentRect.left;
    setBarStyle({ left: firstCenter, width: lastCenter - firstCenter });
  }, [children]);

  // Re-measure on window resize
  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      const cols = el.querySelectorAll<HTMLElement>("[data-child-col]");
      if (cols.length < 2) return;
      const first = cols[0];
      const last = cols[cols.length - 1];
      const parentRect = el.getBoundingClientRect();
      const firstCenter = first.getBoundingClientRect().left + first.getBoundingClientRect().width / 2 - parentRect.left;
      const lastCenter = last.getBoundingClientRect().left + last.getBoundingClientRect().width / 2 - parentRect.left;
      setBarStyle({ left: firstCenter, width: lastCenter - firstCenter });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex flex-col items-center mt-5">
      {/* Vertical line from parent down */}
      <div style={{ width: 2, height: 28, background: LINE_STYLE }} />

      {/* Children row with horizontal bar */}
      <div ref={containerRef} className="relative flex items-start gap-4">
        {/* Horizontal bar */}
        {barStyle.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: barStyle.left,
              width: barStyle.width,
              height: 2,
              background: LINE_STYLE,
            }}
          />
        )}
        {(children as ReactNode[]).map((child, i) => (
          <div key={i} data-child-col className="flex flex-col items-center">
            {/* Vertical line from bar to child */}
            <div style={{ width: 2, height: 18, background: LINE_STYLE }} />
            {child}
          </div>
        ))}
      </div>
    </div>
  );
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

        <div className="flex flex-col items-center gap-2" style={{ minHeight: "90px" }}>
          <div
            className="flex items-center justify-center rounded-full w-10 h-10 flex-shrink-0"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            <User className="w-[18px] h-[18px]" />
          </div>

          <span className="font-display font-bold leading-tight text-[13px] line-clamp-2" style={{ color: "#0f2137" }}>
            {person.nome}
          </span>

          <span
            className="font-body font-medium leading-tight rounded-md px-2.5 py-1 text-[10px] text-center line-clamp-1 max-w-full truncate"
            style={{
              color: colors.bg,
              backgroundColor: colors.light,
              border: `1px solid ${colors.border}`,
            }}
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
        <ChildrenConnector>
          {children.map((child) => (
            <OrgNode
              key={child.id}
              person={child}
              byId={byId}
              onSelect={onSelect}
              selectedId={selectedId}
              highlightDept={highlightDept}
              depth={depth + 1}
            />
          ))}
        </ChildrenConnector>
      )}
    </div>
  );
}
