import { motion } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { getDeptColor } from "@/lib/deptColors";

const LINE_COLOR = "rgba(255,255,255,0.62)";

function ChildrenConnector({ children }: { children: ReactNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const columns = Array.from(container.children) as HTMLElement[];
      if (columns.length < 2) {
        setBar({ left: 0, width: 0 });
        return;
      }

      const centers = columns
        .map((column) => {
          const card = column.querySelector<HTMLElement>("[data-node-card='true']");
          if (!card) return null;
          const cardRect = card.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          return cardRect.left + cardRect.width / 2 - containerRect.left;
        })
        .filter((v): v is number => v !== null);

      if (centers.length < 2) {
        setBar({ left: 0, width: 0 });
        return;
      }

      const left = centers[0];
      const right = centers[centers.length - 1];
      setBar({ left, width: Math.max(0, right - left) });
    };

    const raf = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    Array.from(container.children).forEach((child) => resizeObserver.observe(child as Element));
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [children.length]);

  if (children.length === 1) {
    return (
      <div className="flex flex-col items-center mt-5">
        <div style={{ width: 2, height: 28, background: LINE_COLOR }} />
        <div className="flex flex-col items-center">
          <div style={{ width: 2, height: 18, background: LINE_COLOR }} />
          {children[0]}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-5">
      <div style={{ width: 2, height: 28, background: LINE_COLOR }} />

      <div ref={containerRef} className="relative flex items-start gap-4">
        {bar.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: bar.left,
              width: bar.width,
              height: 2,
              background: LINE_COLOR,
            }}
          />
        )}

        {children.map((child, i) => (
          <div key={i} data-child-col className="flex flex-col items-center">
            <div style={{ width: 2, height: 18, background: LINE_COLOR }} />
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
        data-node-card="true"
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
