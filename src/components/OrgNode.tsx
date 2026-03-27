import { motion, AnimatePresence } from "framer-motion";
import { Colaborador } from "./OrgChart";
import { User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { getDeptColor } from "@/lib/deptColors";

const LINE_COLOR = "rgba(255,255,255,0.62)";
const HIGHLIGHT_LINE_COLOR = "#60a5fa";

const VERT_TOP = 28;
const VERT_CHILD = 18;

const glowFor = (active: boolean): React.CSSProperties =>
  active
    ? { filter: "drop-shadow(0 0 4px rgba(96,165,250,0.6))", transition: "all 0.4s ease" }
    : { transition: "all 0.4s ease" };

function useChildCenters(
  containerRef: React.RefObject<HTMLDivElement | null>,
  childCount: number
) {
  const [centers, setCenters] = useState<number[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const measure = () => {
      const cols = container.querySelectorAll<HTMLElement>("[data-child-col]");
      const results: number[] = [];
      cols.forEach((col) => {
        const card = col.querySelector<HTMLElement>("[data-node-card='true']");
        if (card) {
          let x = card.offsetWidth / 2;
          let el: HTMLElement | null = card;
          while (el && el !== container) {
            x += el.offsetLeft;
            el = el.offsetParent as HTMLElement | null;
          }
          results.push(x);
        } else {
          results.push(col.offsetLeft + col.offsetWidth / 2);
        }
      });
      setCenters(results);
    };

    const poll = () => {
      measure();
      rafId = requestAnimationFrame(poll);
    };
    poll();
    const stopPolling = setTimeout(() => {
      cancelAnimationFrame(rafId);
      measure();
    }, 600);

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    container.querySelectorAll<HTMLElement>("[data-child-col]").forEach((c) => ro.observe(c));

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(stopPolling);
      ro.disconnect();
    };
  }, [containerRef, childCount]);

  return centers;
}

function ChildrenConnector({
  children,
  parentInPath,
  childInPath,
}: {
  children: ReactNode[];
  parentInPath: boolean;
  childInPath: boolean[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childCenters = useChildCenters(containerRef, children.length);

  if (children.length === 1) {
    const color = parentInPath && childInPath[0] ? HIGHLIGHT_LINE_COLOR : LINE_COLOR;
    return (
      <div className="flex flex-col items-center mt-5">
        <div style={{ width: 2, height: VERT_TOP, background: color, ...glowFor(color === HIGHLIGHT_LINE_COLOR) }} />
        <div className="flex flex-col items-center">
          <div style={{ width: 2, height: VERT_CHILD, background: color, ...glowFor(color === HIGHLIGHT_LINE_COLOR) }} />
          {children[0]}
        </div>
      </div>
    );
  }

  const anyHighlighted = childInPath.some(Boolean);
  const mainVertColor = parentInPath && anyHighlighted ? HIGHLIGHT_LINE_COLOR : LINE_COLOR;

  // Horizontal bar spans from leftmost to rightmost child center
  const hasPositions = childCenters.length >= 2;
  const barLeft = hasPositions ? Math.min(...childCenters) : 0;
  const barRight = hasPositions ? Math.max(...childCenters) : 0;
  const barWidth = barRight - barLeft;

  // Parent center = container center (flex items-center on parent)
  const containerWidth = containerRef.current?.offsetWidth ?? 0;
  const parentCenter = containerWidth / 2;

  return (
    <div className="flex flex-col items-center mt-5">
      {/* Vertical line from parent down to horizontal bar */}
      <div style={{ width: 2, height: VERT_TOP, background: mainVertColor, ...glowFor(mainVertColor === HIGHLIGHT_LINE_COLOR) }} />

      <div ref={containerRef} className="relative flex items-start gap-4">
        {/* Base horizontal bar (dim) */}
        {hasPositions && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: barLeft,
              width: barWidth,
              height: 2,
              background: LINE_COLOR,
              transition: "all 0.4s ease",
            }}
          />
        )}

        {/* Highlighted segments on the horizontal bar */}
        {hasPositions && parentInPath &&
          childCenters.map((center, i) => {
            if (!childInPath[i]) return null;
            const segLeft = Math.min(parentCenter, center);
            const segWidth = Math.abs(parentCenter - center) || 2;
            return (
              <div
                key={`hl-${i}`}
                className="absolute pointer-events-none"
                style={{
                  top: 0,
                  left: segLeft,
                  width: segWidth,
                  height: 2,
                  background: HIGHLIGHT_LINE_COLOR,
                  ...glowFor(true),
                }}
              />
            );
          })}

        {/* Child columns with vertical drop lines */}
        {children.map((child, i) => {
          const color = childInPath[i] ? HIGHLIGHT_LINE_COLOR : LINE_COLOR;
          return (
            <div key={i} data-child-col className="flex flex-col items-center">
              <div style={{ width: 2, height: VERT_CHILD, background: color, ...glowFor(childInPath[i]) }} />
              {child}
            </div>
          );
        })}
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
  highlightPath: Set<string>;
  depth?: number;
}

export function OrgNode({
  person,
  byId,
  onSelect,
  selectedId,
  highlightDept,
  highlightPath,
  depth = 0,
}: OrgNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const children = person.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];

  const isSelected = selectedId === person.id;
  const isInPath = highlightPath.size > 0 && highlightPath.has(person.id);
  const isDimmedByPath = highlightPath.size > 0 && !isInPath;
  const isDimmedByDept = highlightDept !== null && highlightDept !== person.departamento;
  const isDimmed = isDimmedByDept || isDimmedByPath;
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
          scale: isSelected ? 1.06 : 1,
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
          background: isSelected
            ? "rgba(255,255,255,1)"
            : isInPath
            ? "rgba(255,255,255,0.97)"
            : "rgba(255,255,255,0.93)",
          boxShadow: isSelected
            ? `0 0 0 3px ${colors.bg}, 0 20px 50px -12px rgba(0,0,0,0.5)`
            : isInPath
            ? `0 0 0 2px ${colors.bg}88, 0 12px 36px -8px rgba(0,0,0,0.35)`
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
        <ChildrenConnector
          parentInPath={isInPath}
          childInPath={children.map((c) => highlightPath.has(c.id))}
        >
          {children.map((child) => (
            <OrgNode
              key={child.id}
              person={child}
              byId={byId}
              onSelect={onSelect}
              selectedId={selectedId}
              highlightDept={highlightDept}
              highlightPath={highlightPath}
              depth={depth + 1}
            />
          ))}
        </ChildrenConnector>
      )}
    </div>
  );
}
