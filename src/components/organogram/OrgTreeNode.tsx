import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Focus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/deptColors";
import { getChildren } from "@/lib/organogram";
import { Colaborador } from "@/types/organogram";
import { OrgNodeCard } from "./OrgNodeCard";

interface OrgTreeNodeProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (person: Colaborador) => void;
  selectedId: string | null;
  highlightDept: string | null;
  highlightPath: Set<string>;
  showDesligados: boolean;
  searchMatch: Set<string> | null;
  orientation?: "vertical" | "horizontal";
  density?: "compact" | "comfortable";
  onFocusBranch?: (id: string) => void;
}

export function OrgTreeNode({
  person,
  byId,
  onSelect,
  selectedId,
  highlightDept,
  highlightPath,
  showDesligados,
  searchMatch,
  orientation = "vertical",
  density = "comfortable",
  onFocusBranch,
}: OrgTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const colors = getDeptColor(person.departamento);

  const children = useMemo(() => {
    let kids = getChildren(person, byId);
    if (!showDesligados) kids = kids.filter((c) => c.status !== "desligado");
    return kids;
  }, [person, byId, showDesligados]);

  // If search is active and this node + descendants don't match, hide
  const isSearchActive = searchMatch !== null;
  const isVisible = !isSearchActive || searchMatch!.has(person.id);

  const visibleChildren = useMemo(() => {
    if (!isSearchActive) return children;
    return children.filter((child) => searchMatch!.has(child.id));
  }, [children, isSearchActive, searchMatch]);

  if (!isVisible) return null;
  if (!showDesligados && person.status === "desligado") return null;

  const isInPath = highlightPath.size > 0 && highlightPath.has(person.id);
  const isPJ = person.tipo_contrato === "PJ";
  const isHorizontal = orientation === "horizontal";
  const gapClass = density === "compact" ? "gap-2" : "gap-5";

  if (isHorizontal) {
    return (
      <div className="flex items-center">
        <div className="relative group">
          <OrgNodeCard
            person={person}
            byId={byId}
            onSelect={onSelect}
            selectedId={selectedId}
            highlightDept={highlightDept}
            highlightPath={highlightPath}
            level={person.nivel}
          />

          {onFocusBranch && visibleChildren.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFocusBranch(person.id);
              }}
              title="Focar nesta ramificação"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: `${colors.bg}33`, color: colors.bg }}
            >
              <Focus className="w-3 h-3" />
            </button>
          )}

          {visibleChildren.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((p) => !p);
              }}
              className="absolute top-1/2 -right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-md transition-all hover:scale-110"
              style={{
                borderColor: `${colors.bg}33`,
                color: colors.bg,
              }}
            >
              <ChevronRight
                className={cn(
                  "w-3 h-3 transition-transform duration-300",
                  collapsed && "rotate-180"
                )}
              />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && visibleChildren.length > 0 && (
            <motion.div
              key="children-h"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center overflow-visible ml-10"
            >
              {/* Horizontal connector line */}
              <div
                className="h-px flex-shrink-0"
                style={{
                  width: 28,
                  background: isInPath ? "#3b82f6" : colors.bg,
                  marginRight: 8,
                }}
              />
              <div className={cn("flex flex-col", gapClass)}>
                {visibleChildren.map((child) => (
                  <OrgTreeNode
                    key={child.id}
                    person={child}
                    byId={byId}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    highlightDept={highlightDept}
                    highlightPath={highlightPath}
                    showDesligados={showDesligados}
                    searchMatch={searchMatch}
                    orientation="horizontal"
                    density={density}
                    onFocusBranch={onFocusBranch}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <OrgNodeCard
          person={person}
          byId={byId}
          onSelect={onSelect}
          selectedId={selectedId}
          highlightDept={highlightDept}
          highlightPath={highlightPath}
          level={person.nivel}
        />

        {/* Focus-branch button (shown on hover) */}
        {onFocusBranch && visibleChildren.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusBranch(person.id);
            }}
            title="Focar nesta ramificação"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ borderColor: `${colors.bg}33`, color: colors.bg }}
          >
            <Focus className="w-3 h-3" />
          </button>
        )}

        {/* Collapse toggle */}
        {visibleChildren.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((p) => !p);
            }}
            className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border bg-white shadow-md transition-all hover:scale-110"
            style={{
              borderColor: `${colors.bg}33`,
              color: colors.bg,
            }}
          >
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-300",
                collapsed && "-rotate-90"
              )}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && visibleChildren.length > 0 && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center overflow-visible"
          >
            {/* SVG connector lines */}
            <OrgConnectors
              parentColor={colors.bg}
              childCount={visibleChildren.length}
              isInPath={isInPath}
              highlightPath={highlightPath}
              children={visibleChildren}
              isPJ={isPJ}
            />

            <div
              className={cn(
                "flex items-start",
                visibleChildren.length > 1 ? gapClass : ""
              )}
            >
              {visibleChildren.map((child) => (
                <OrgTreeNode
                  key={child.id}
                  person={child}
                  byId={byId}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  highlightDept={highlightDept}
                  highlightPath={highlightPath}
                  showDesligados={showDesligados}
                  searchMatch={searchMatch}
                  orientation={orientation}
                  density={density}
                  onFocusBranch={onFocusBranch}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* SVG curved connectors */
function OrgConnectors({
  parentColor,
  childCount,
  isInPath,
  highlightPath,
  children,
  isPJ,
}: {
  parentColor: string;
  childCount: number;
  isInPath: boolean;
  highlightPath: Set<string>;
  children: Colaborador[];
  isPJ: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; positions: number[] } | null>(null);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.nextElementSibling as HTMLElement;
    if (!parent) return;
    // Select only the top-level child containers (direct children of the flex wrapper)
    const childContainers = parent.children;
    if (childContainers.length === 0) return;

    const parentRect = parent.getBoundingClientRect();
    const positions: number[] = [];
    for (let i = 0; i < Math.min(childCount, childContainers.length); i++) {
      const card = childContainers[i].querySelector("[data-node-card]");
      if (card) {
        const r = card.getBoundingClientRect();
        positions.push(r.left + r.width / 2 - parentRect.left);
      }
    }
    if (positions.length === 0) return;

    setDims({ width: parentRect.width, positions });
  }, [childCount]);

  useEffect(() => {
    // Measure after render
    const raf = requestAnimationFrame(() => {
      setTimeout(measure, 60);
    });
    return () => cancelAnimationFrame(raf);
  }, [measure, childCount]);

  // Observe resize
  useEffect(() => {
    const el = containerRef.current?.nextElementSibling;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const vDrop = 48;
  const curveR = 16;
  const strokeW = 3.5;
  const dashArray = isPJ ? "8 5" : "none";
  const animStyle: React.CSSProperties = {
    transition: "stroke 0.4s ease, stroke-dashoffset 0.5s ease",
  };

  if (childCount === 1) {
    const color = isInPath && highlightPath.has(children[0].id)
      ? "#3b82f6"
      : parentColor;
    return (
      <div ref={containerRef}>
        <svg width={strokeW + 2} height={vDrop} className="block mx-auto mt-3">
          <line
            x1={(strokeW + 2) / 2} y1={0}
            x2={(strokeW + 2) / 2} y2={vDrop}
            stroke={color}
            strokeWidth={strokeW}
            strokeDasharray={dashArray}
            style={{
              ...animStyle,
              strokeDashoffset: 0,
              strokeDasharray: dashArray === "none" ? `${vDrop}` : dashArray,
              animation: "connectorDraw 0.5s ease forwards",
            }}
          />
        </svg>
      </div>
    );
  }

  if (!dims || dims.positions.length < 2) {
    return <div ref={containerRef} className="h-12 mt-3" />;
  }

  const svgH = vDrop + curveR + 8;
  const centerX = dims.width / 2;

  return (
    <div ref={containerRef} className="mt-3" style={{ width: dims.width, height: svgH }}>
      <svg width={dims.width} height={svgH} className="block" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
        {/* Vertical from parent */}
        <line
          x1={centerX} y1={0}
          x2={centerX} y2={vDrop / 2}
          stroke={isInPath ? "#3b82f6" : parentColor}
          strokeWidth={strokeW}
          strokeDasharray={dashArray}
          style={animStyle}
        />

        {dims.positions.map((px, i) => {
          const child = children[i];
          const childActive = child && highlightPath.has(child.id);
          const lineColor = isInPath && childActive
            ? "#3b82f6"
            : parentColor;
          const isPJChild = child?.tipo_contrato === "PJ";
          const childDash = isPJChild ? "8 5" : "none";

          const midY = vDrop / 2;
          const d =
            px === centerX
              ? `M ${centerX} ${midY} L ${px} ${svgH}`
              : px < centerX
              ? `M ${centerX} ${midY} L ${px + curveR} ${midY} Q ${px} ${midY} ${px} ${midY + curveR} L ${px} ${svgH}`
              : `M ${centerX} ${midY} L ${px - curveR} ${midY} Q ${px} ${midY} ${px} ${midY + curveR} L ${px} ${svgH}`;

          // Estimate path length for draw animation
          const dist = Math.abs(px - centerX) + svgH - midY + curveR;

          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={lineColor}
              strokeWidth={strokeW}
              strokeDasharray={childDash === "none" ? `${dist}` : childDash}
              strokeDashoffset={childDash === "none" ? dist : 0}
              strokeLinecap="round"
              style={{
                ...animStyle,
                animation: childDash === "none"
                  ? `connectorDraw 0.5s ease ${0.05 * i}s forwards`
                  : `connectorDrawDashed 0.5s ease ${0.05 * i}s forwards`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}