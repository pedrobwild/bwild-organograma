import { motion, AnimatePresence } from "framer-motion";
import type { Colaborador } from "@/types/organogram";
import { User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";

const LEVEL_SIZES: Record<number, { width: string; avatarSize: string; avatarIcon: string; nameSize: string; badgeSize: string; pad: string; minH: string }> = {
  0: { width: "200px", avatarSize: "w-14 h-14", avatarIcon: "text-xl", nameSize: "text-[15px]", badgeSize: "text-[11px]", pad: "20px 24px", minH: "110px" },
  1: { width: "185px", avatarSize: "w-12 h-12", avatarIcon: "text-lg", nameSize: "text-[14px]", badgeSize: "text-[11px]", pad: "18px 22px", minH: "100px" },
  2: { width: "170px", avatarSize: "w-10 h-10", avatarIcon: "text-base", nameSize: "text-[13px]", badgeSize: "text-[10px]", pad: "16px 20px", minH: "90px" },
  3: { width: "160px", avatarSize: "w-9 h-9", avatarIcon: "text-sm", nameSize: "text-[12px]", badgeSize: "text-[10px]", pad: "14px 18px", minH: "85px" },
  4: { width: "150px", avatarSize: "w-8 h-8", avatarIcon: "text-xs", nameSize: "text-[11px]", badgeSize: "text-[9px]", pad: "12px 16px", minH: "80px" },
};

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

  const hasPositions = childCenters.length >= 2;
  const barLeft = hasPositions ? Math.min(...childCenters) : 0;
  const barRight = hasPositions ? Math.max(...childCenters) : 0;
  const barWidth = barRight - barLeft;
  const containerWidth = containerRef.current?.offsetWidth ?? 0;
  const parentCenter = containerWidth / 2;

  return (
    <div className="flex flex-col items-center mt-5">
      <div style={{ width: 2, height: VERT_TOP, background: mainVertColor, ...glowFor(mainVertColor === HIGHLIGHT_LINE_COLOR) }} />
      <div ref={containerRef} className="relative flex items-start gap-4">
        {hasPositions && (
          <div
            className="absolute pointer-events-none"
            style={{ top: 0, left: barLeft, width: barWidth, height: 2, background: LINE_COLOR, transition: "all 0.4s ease" }}
          />
        )}
        {hasPositions && parentInPath &&
          childCenters.map((center, i) => {
            if (!childInPath[i]) return null;
            const segLeft = Math.min(parentCenter, center);
            const segWidth = Math.abs(parentCenter - center) || 2;
            return (
              <div
                key={`hl-${i}`}
                className="absolute pointer-events-none"
                style={{ top: 0, left: segLeft, width: segWidth, height: 2, background: HIGHLIGHT_LINE_COLOR, ...glowFor(true) }}
              />
            );
          })}
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
  person, byId, onSelect, selectedId, highlightDept, highlightPath, depth = 0,
}: OrgNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const children = person.subordinados.map((id) => byId.get(id)).filter(Boolean) as Colaborador[];

  const isSelected = selectedId === person.id;
  const isInPath = highlightPath.size > 0 && highlightPath.has(person.id);
  const isDimmedByPath = highlightPath.size > 0 && !isInPath;
  const isDimmedByDept = highlightDept !== null && highlightDept !== person.departamento;
  const isDimmed = isDimmedByDept || isDimmedByPath;
  const colors = getDeptColor(person.departamento);
  const level = LEVEL_SIZES[Math.min(person.nivel, 4)] || LEVEL_SIZES[4];
  const initials = getInitials(person.nome);
  const isPlaceholder = person.nome === "A definir";

  return (
    <div className="flex flex-col items-center">
      <motion.button
        data-node-card="true"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: isDimmed ? 0.12 : 1, y: 0, scale: isSelected ? 1.06 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4, boxShadow: `0 0 0 2px ${colors.bg}66, 0 24px 48px -12px rgba(0,0,0,0.45)` }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(person)}
        className="relative cursor-pointer text-center group"
        style={{
          borderRadius: "16px",
          padding: level.pad,
          width: level.width,
          background: isSelected ? "rgba(255,255,255,1)" : isInPath ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: isSelected
            ? `0 0 0 2.5px ${colors.bg}, 0 20px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5)`
            : isInPath
            ? `0 0 0 1.5px ${colors.bg}77, 0 12px 36px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)`
            : "0 8px 32px -8px rgba(0,0,0,0.25), 0 2px 8px -2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[16px]" style={{ background: `linear-gradient(90deg, ${colors.bg}, ${colors.bg}99)` }} />
        <div className="flex flex-col items-center gap-2.5" style={{ minHeight: level.minH }}>
          <div
            className={`flex items-center justify-center rounded-full ${level.avatarSize} flex-shrink-0 ring-2 ring-white/80 shadow-md`}
            style={{
              background: isPlaceholder ? "rgba(150,160,175,0.5)" : `linear-gradient(135deg, ${colors.bg}, ${colors.bg}cc)`,
              color: colors.text,
            }}
          >
            {isPlaceholder ? (
              <User className={`${level.avatarIcon} opacity-60`} />
            ) : (
              <span className={`font-display font-bold ${level.avatarIcon} leading-none`}>{initials}</span>
            )}
          </div>
          <span className={`font-display font-bold leading-tight ${level.nameSize} line-clamp-2`} style={{ color: isPlaceholder ? "#8896a7" : "#0f2137" }}>
            {person.nome}
          </span>
          <span
            className={`font-body font-semibold leading-tight rounded-full px-3 py-1 ${level.badgeSize} text-center line-clamp-1 max-w-full truncate`}
            style={{ color: colors.bg, backgroundColor: colors.light, border: `1px solid ${colors.border}` }}
          >
            {person.cargo}
          </span>
          {children.length > 0 && (
            <span className="text-[9px] font-medium tracking-wide uppercase" style={{ color: "rgba(15,33,55,0.35)" }}>
              {children.length} {children.length === 1 ? "report" : "reports"}
            </span>
          )}
        </div>
        {children.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{
              background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}dd)`,
              color: colors.text,
              boxShadow: `0 4px 12px -2px ${colors.bg}55`,
            }}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        )}
      </motion.button>

      <AnimatePresence initial={false}>
        {children.length > 0 && !collapsed && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden", transformOrigin: "top center" }}
          >
            <ChildrenConnector parentInPath={isInPath} childInPath={children.map((c) => highlightPath.has(c.id))}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
