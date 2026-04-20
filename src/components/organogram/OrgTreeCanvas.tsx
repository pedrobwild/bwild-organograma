import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Focus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";
import { layoutTree, type Orientation } from "@/lib/tree-layout";
import type { Colaborador } from "@/types/organogram";

interface OrgTreeCanvasProps {
  roots: Colaborador[];
  byId: Map<string, Colaborador>;
  selectedId: string | null;
  highlightDept: string | null;
  highlightPath: Set<string> | null;
  searchMatchIds: Set<string> | null;
  showDesligados: boolean;
  orientation: Orientation;
  density: "compact" | "comfortable";
  onSelect: (person: Colaborador) => void;
  onFocusBranch?: (id: string) => void;
}

const NODE_W = 264;
const NODE_H_COMPACT = 80;
const NODE_H_COMFORTABLE = 108;
const H_GAP_COMPACT = 20;
const H_GAP_COMFORTABLE = 36;
const V_GAP_COMPACT = 56;
const V_GAP_COMFORTABLE = 88;

export function OrgTreeCanvas({
  roots,
  byId,
  selectedId,
  highlightDept,
  highlightPath,
  searchMatchIds,
  showDesligados,
  orientation,
  density,
  onSelect,
  onFocusBranch,
}: OrgTreeCanvasProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const NODE_H = density === "compact" ? NODE_H_COMPACT : NODE_H_COMFORTABLE;
  const H_GAP = density === "compact" ? H_GAP_COMPACT : H_GAP_COMFORTABLE;
  const V_GAP = density === "compact" ? V_GAP_COMPACT : V_GAP_COMFORTABLE;

  const layout = useMemo(
    () =>
      layoutTree(
        roots,
        byId,
        { showDesligados, searchMatchIds, collapsed },
        {
          orientation,
          nodeWidth: NODE_W,
          nodeHeight: NODE_H,
          hGap: H_GAP,
          vGap: V_GAP,
          padding: 32,
          cornerR: 14,
        },
      ),
    [roots, byId, showDesligados, searchMatchIds, collapsed, orientation, NODE_H, H_GAP, V_GAP],
  );

  // Drop stale collapsed ids
  useEffect(() => {
    setCollapsed((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (byId.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [byId]);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pre-compute who has children (in the original tree) so collapsed nodes still show toggle
  const allHasChildren = useMemo(() => {
    const set = new Set<string>();
    for (const c of byId.values()) {
      if (c.subordinados && c.subordinados.length > 0) {
        const visibleKids = c.subordinados.some((sid) => {
          const k = byId.get(sid);
          return k && (showDesligados || k.status !== "desligado");
        });
        if (visibleKids) set.add(c.id);
      }
    }
    return set;
  }, [byId, showDesligados]);

  return (
    <div className="relative" style={{ width: layout.width, height: layout.height }}>
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{ overflow: "visible" }}
      >
        <AnimatePresence>
          {layout.edges.map((e) => {
            const isInPath =
              !!highlightPath &&
              highlightPath.has(e.parentId) &&
              highlightPath.has(e.childId);
            const childNode = layout.byId[e.childId];
            const dim =
              !!highlightDept &&
              !!childNode &&
              childNode.person.departamento !== highlightDept &&
              !isInPath;
            return (
              <motion.path
                key={e.id}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: dim ? 0.12 : isInPath ? 1 : 0.55,
                }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                d={e.path}
                fill="none"
                stroke={isInPath ? "#60a5fa" : e.color}
                strokeWidth={isInPath ? 2.8 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={e.dashed ? "6 4" : undefined}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      <AnimatePresence>
        {layout.nodes.map((n) => {
          const person = n.person;
          const hasChildren = allHasChildren.has(person.id);
          const isCollapsed = collapsed.has(person.id);
          const isSelected = selectedId === person.id;
          const isInPath = highlightPath?.has(person.id) ?? false;
          const isSearchMatch = searchMatchIds?.has(person.id) ?? false;
          const dim = !!highlightDept && person.departamento !== highlightDept && !isInPath;

          return (
            <motion.div
              key={person.id}
              layout
              layoutId={`node-${person.id}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: dim ? 0.35 : 1,
                scale: 1,
                filter: dim ? "saturate(0.4)" : "none",
              }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: NODE_W,
                height: NODE_H,
              }}
              className="group"
            >
              <OrgCanvasCard
                person={person}
                density={density}
                isSelected={isSelected}
                isInPath={isInPath}
                isSearchMatch={isSearchMatch}
                hasChildren={hasChildren}
                isCollapsed={isCollapsed}
                orientation={orientation}
                onClick={() => onSelect(person)}
                onToggleCollapse={() => toggleCollapse(person.id)}
                onFocus={onFocusBranch ? () => onFocusBranch(person.id) : undefined}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface OrgCanvasCardProps {
  person: Colaborador;
  density: "compact" | "comfortable";
  isSelected: boolean;
  isInPath: boolean;
  isSearchMatch: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  orientation: Orientation;
  onClick: () => void;
  onToggleCollapse: () => void;
  onFocus?: () => void;
}

function OrgCanvasCard({
  person,
  density,
  isSelected,
  isInPath,
  isSearchMatch,
  hasChildren,
  isCollapsed,
  orientation,
  onClick,
  onToggleCollapse,
  onFocus,
}: OrgCanvasCardProps) {
  const colors = getDeptColor(person.departamento);
  const initials = getInitials(person.nome);
  const isDesligado = person.status === "desligado";
  const isPJ = person.tipo_contrato === "PJ";

  const avatarSize = density === "compact" ? 36 : 48;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      data-node-card
      className={cn(
        "relative w-full h-full flex items-center gap-3 pl-4 pr-3 rounded-xl cursor-pointer select-none",
        "bg-white shadow-sm transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        isSelected && "shadow-lg -translate-y-0.5",
        isInPath && "ring-2 ring-blue-400",
        isSearchMatch && !isSelected && "ring-2 ring-amber-400",
      )}
      style={{
        borderLeft: `4px solid ${colors.bg}`,
        ...(isSelected
          ? { boxShadow: `0 0 0 2px ${colors.bg}, 0 10px 30px -10px ${colors.bg}66` }
          : {}),
      }}
    >
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center font-semibold text-white"
        style={{
          width: avatarSize,
          height: avatarSize,
          background: colors.bg,
          fontSize: density === "compact" ? 13 : 16,
        }}
      >
        {person.foto ? (
          <img src={person.foto} alt={person.nome} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-semibold text-sm truncate text-slate-900",
            isDesligado && "line-through opacity-60",
          )}
          title={person.nome}
        >
          {person.nome}
        </div>
        <div className="text-xs text-slate-500 truncate" title={person.cargo}>
          {person.cargo}
        </div>
        {density === "comfortable" && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ background: `${colors.bg}22`, color: colors.bg }}
            >
              {person.departamento}
            </span>
            {isPJ && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/15 text-amber-700">
                PJ
              </span>
            )}
            {isDesligado && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/15 text-red-600">
                Desligado
              </span>
            )}
          </div>
        )}
      </div>

      {onFocus && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocus();
          }}
          className={cn(
            "absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md border",
            "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-slate-50",
          )}
          title="Focar nesta ramificação"
          style={{ borderColor: `${colors.bg}55`, color: colors.bg }}
        >
          <Focus className="w-3 h-3" />
        </button>
      )}

      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className={cn(
            "absolute w-6 h-6 rounded-full bg-white shadow-md border",
            "flex items-center justify-center hover:bg-slate-50 transition-colors z-10",
            orientation === "vertical"
              ? "left-1/2 -translate-x-1/2 -bottom-3"
              : "top-1/2 -translate-y-1/2 -right-3",
          )}
          title={isCollapsed ? "Expandir ramo" : "Recolher ramo"}
          style={{ borderColor: colors.bg, color: colors.bg }}
        >
          {isCollapsed ? (
            <Plus className="w-3 h-3" />
          ) : orientation === "vertical" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}
