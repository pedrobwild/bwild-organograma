import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/deptColors";
import { getChildren, getInitials } from "@/lib/organogram";
import { Colaborador } from "@/types/organogram";

interface OrgNodeProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (person: Colaborador) => void;
  selectedId: string | null;
  highlightDept: string | null;
  highlightPath: Set<string>;
}

const LEVEL_STYLES: Record<
  number,
  {
    width: string;
    avatar: string;
    name: string;
    role: string;
    padding: string;
  }
> = {
  0: {
    width: "w-[240px]",
    avatar: "h-16 w-16 text-lg",
    name: "text-base",
    role: "text-xs",
    padding: "px-6 py-5",
  },
  1: {
    width: "w-[220px]",
    avatar: "h-14 w-14 text-base",
    name: "text-[15px]",
    role: "text-[11px]",
    padding: "px-5 py-4.5",
  },
  2: {
    width: "w-[200px]",
    avatar: "h-12 w-12 text-sm",
    name: "text-sm",
    role: "text-[11px]",
    padding: "px-4 py-4",
  },
  3: {
    width: "w-[184px]",
    avatar: "h-10 w-10 text-sm",
    name: "text-[13px]",
    role: "text-[10px]",
    padding: "px-4 py-3.5",
  },
  4: {
    width: "w-[172px]",
    avatar: "h-9 w-9 text-xs",
    name: "text-xs",
    role: "text-[10px]",
    padding: "px-3.5 py-3",
  },
};

export function OrgNode({
  person,
  byId,
  onSelect,
  selectedId,
  highlightDept,
  highlightPath,
}: OrgNodeProps) {
  const [collapsed, setCollapsed] = useState(false);

  const children = useMemo(() => getChildren(person, byId), [person, byId]);
  const colors = getDeptColor(person.departamento);
  const level = LEVEL_STYLES[Math.min(person.nivel, 4)] ?? LEVEL_STYLES[4];
  const initials = getInitials(person.nome);

  const isSelected = selectedId === person.id;
  const isInPath = highlightPath.size > 0 && highlightPath.has(person.id);
  const isDimmedByPath = highlightPath.size > 0 && !isInPath;
  const isDimmedByDept = highlightDept !== null && highlightDept !== person.departamento;
  const isDimmed = isDimmedByPath || isDimmedByDept;
  const isPlaceholder = person.nome === "A definir";

  const singleChildActive =
    children.length === 1 && isInPath && highlightPath.has(children[0].id);
  const singleConnectorColor = singleChildActive
    ? "#60a5fa"
    : "rgba(148,163,184,0.55)";

  return (
    <div className="flex flex-col items-center">
      <motion.button
        data-node-card="true"
        layout
        initial={{ opacity: 0, y: 16 }}
        onClick={() => onSelect(person)}
        whileHover={{ y: -4, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          opacity: isDimmed ? 0.18 : 1,
          scale: isSelected ? 1.04 : 1,
        }}
        transition={{ duration: 0.22 }}
        className={cn(
          "group relative rounded-[28px] border text-center backdrop-blur-xl transition-all",
          "bg-white/95 shadow-[0_20px_55px_-24px_rgba(15,23,42,0.45)]",
          "before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/80 before:content-['']",
          level.width,
          level.padding
        )}
        style={{
          borderColor: isSelected ? `${colors.bg}88` : "rgba(148,163,184,0.18)",
          boxShadow: isSelected
            ? `0 0 0 2px ${colors.bg}30, 0 24px 80px -28px ${colors.bg}55`
            : isInPath
            ? `0 0 0 1px ${colors.bg}25, 0 20px 50px -25px ${colors.bg}35`
            : undefined,
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full"
          style={{ background: `linear-gradient(90deg, ${colors.bg}, ${colors.bg}88)` }}
        />

        <div className="flex flex-col items-center gap-2.5">
          {/* Avatar */}
          <div
            className={cn(
              "flex items-center justify-center rounded-full ring-2 ring-white/80 shadow-md flex-shrink-0 overflow-hidden",
              level.avatar
            )}
            style={{
              background: isPlaceholder
                ? "rgba(150,160,175,0.5)"
                : person.foto
                ? undefined
                : `linear-gradient(135deg, ${colors.bg}, ${colors.bg}cc)`,
              color: colors.text,
            }}
          >
            {person.foto ? (
              <img src={person.foto} alt={person.nome} className="w-full h-full object-cover" />
            ) : isPlaceholder ? (
              <User className="opacity-60" />
            ) : (
              <span className="font-display font-bold leading-none">{initials}</span>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn("font-display font-bold leading-tight line-clamp-2", level.name)}
              style={{ color: isPlaceholder ? "#8896a7" : "#0f2137" }}
            >
              {person.nome}
            </span>

            <span
              className={cn(
                "font-body font-semibold leading-tight rounded-full px-3 py-1 text-center line-clamp-1 max-w-full truncate",
                level.role
              )}
              style={{
                color: colors.bg,
                backgroundColor: colors.light,
                border: `1px solid ${colors.border}`,
              }}
            >
              {person.cargo}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(15,33,55,0.4)" }}>
              {person.departamento}
            </span>
            {children.length > 0 && (
              <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: "rgba(15,33,55,0.3)" }}>
                {children.length} {children.length === 1 ? "liderado" : "liderados"}
              </span>
            )}
          </div>
        </div>

        {/* Expand/collapse toggle */}
        {children.length > 0 && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setCollapsed((prev) => !prev);
            }}
            className="absolute -bottom-3 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-white shadow-lg transition-transform hover:scale-110"
            style={{ color: colors.bg }}
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", collapsed && "-rotate-90")} />
          </button>
        )}
      </motion.button>

      <AnimatePresence initial={false}>
        {!collapsed && children.length > 0 && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center overflow-hidden"
            style={{ transformOrigin: "top center" }}
          >
            {children.length === 1 ? (
              <>
                <div
                  className="w-[2px] mt-5 transition-colors duration-300"
                  style={{ height: 46, background: singleConnectorColor }}
                />
                <OrgNode
                  person={children[0]}
                  byId={byId}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  highlightDept={highlightDept}
                  highlightPath={highlightPath}
                />
              </>
            ) : (
              <>
                {/* Vertical line from parent */}
                <div
                  className="w-[2px] mt-5 transition-colors duration-300"
                  style={{
                    height: 28,
                    background: isInPath ? "#60a5fa" : "rgba(148,163,184,0.55)",
                  }}
                />

                {/* Children with horizontal bar segments */}
                <div className="relative flex items-start gap-4">
                  {children.map((child, index) => {
                    const isFirst = index === 0;
                    const isLast = index === children.length - 1;
                    const childActive = highlightPath.has(child.id);
                    const connectorColor =
                      isInPath && childActive
                        ? "#60a5fa"
                        : "rgba(148,163,184,0.55)";
                    const barColor = isInPath ? "#60a5fa" : "rgba(148,163,184,0.55)";

                    return (
                      <div key={child.id} className="flex flex-col items-center relative">
                        {/* Horizontal bar segment */}
                        <div
                          className="absolute top-0 h-[2px] pointer-events-none"
                          style={{
                            left: isFirst ? "50%" : 0,
                            right: isLast ? "50%" : 0,
                            background: barColor,
                          }}
                        />
                        {/* Vertical drop */}
                        <div
                          className="w-[2px] transition-colors duration-300"
                          style={{ height: 18, background: connectorColor }}
                        />
                        <OrgNode
                          person={child}
                          byId={byId}
                          onSelect={onSelect}
                          selectedId={selectedId}
                          highlightDept={highlightDept}
                          highlightPath={highlightPath}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
