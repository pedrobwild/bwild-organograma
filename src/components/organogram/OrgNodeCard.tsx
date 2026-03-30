import { useMemo } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/deptColors";
import { getChildren, getInitials } from "@/lib/organogram";
import { Colaborador } from "@/types/organogram";

interface OrgNodeCardProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (person: Colaborador) => void;
  selectedId: string | null;
  highlightDept: string | null;
  highlightPath: Set<string>;
  level: number;
}

const SIZE_BY_LEVEL: Record<number, { w: number; avatar: number; nameSize: string; roleSize: string; px: number; py: number }> = {
  0: { w: 250, avatar: 52, nameSize: "text-[15px]", roleSize: "text-[11px]", px: 20, py: 18 },
  1: { w: 230, avatar: 46, nameSize: "text-sm", roleSize: "text-[11px]", px: 18, py: 16 },
  2: { w: 210, avatar: 42, nameSize: "text-[13px]", roleSize: "text-[10px]", px: 16, py: 14 },
  3: { w: 192, avatar: 38, nameSize: "text-xs", roleSize: "text-[10px]", px: 14, py: 12 },
  4: { w: 178, avatar: 34, nameSize: "text-xs", roleSize: "text-[9px]", px: 12, py: 10 },
};

export function OrgNodeCard({
  person,
  byId,
  onSelect,
  selectedId,
  highlightDept,
  highlightPath,
  level,
}: OrgNodeCardProps) {
  const children = useMemo(() => getChildren(person, byId), [person, byId]);
  const colors = getDeptColor(person.departamento);
  const s = SIZE_BY_LEVEL[Math.min(level, 4)] ?? SIZE_BY_LEVEL[4];
  const initials = getInitials(person.nome);

  const isSelected = selectedId === person.id;
  const isInPath = highlightPath.size > 0 && highlightPath.has(person.id);
  const isDimmedByPath = highlightPath.size > 0 && !isInPath;
  const isDimmedByDept = highlightDept !== null && highlightDept !== person.departamento;
  const isDimmed = isDimmedByPath || isDimmedByDept;
  const isPlaceholder = person.nome === "A definir";
  const isDesligado = person.status === "desligado";

  return (
    <motion.button
      data-node-card="true"
      layout
      initial={{ opacity: 0, y: 14 }}
      onClick={() => onSelect(person)}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        opacity: isDimmed ? 0.15 : isDesligado ? 0.45 : 1,
        scale: isSelected ? 1.04 : 1,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative rounded-2xl border text-left backdrop-blur-xl transition-all overflow-visible",
        "bg-white/[0.97] shadow-[0_8px_32px_-12px_rgba(15,23,42,0.25)]",
        "hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.35)]",
      )}
      style={{
        width: s.w,
        padding: `${s.py}px ${s.px}px`,
        borderColor: isSelected ? `${colors.bg}66` : "rgba(148,163,184,0.15)",
        boxShadow: isSelected
          ? `0 0 0 2px ${colors.bg}30, 0 20px 60px -20px ${colors.bg}44`
          : isInPath
          ? `0 0 0 1px ${colors.bg}20, 0 12px 36px -16px ${colors.bg}30`
          : undefined,
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full"
        style={{ background: `linear-gradient(90deg, ${colors.bg}, ${colors.bg}77)` }}
      />

      <div className="flex items-center gap-3">
        {/* Avatar with department ring */}
        <div
          className="flex-shrink-0 rounded-full p-[2.5px]"
          style={{ background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}99)` }}
        >
          <div
            className="rounded-full flex items-center justify-center overflow-hidden bg-white"
            style={{ width: s.avatar, height: s.avatar }}
          >
            {person.foto ? (
              <img src={person.foto} alt={person.nome} className="w-full h-full object-cover" />
            ) : isPlaceholder ? (
              <User className="w-4 h-4 text-slate-400" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.bg}18, ${colors.bg}08)`,
                  color: colors.bg,
                  fontSize: s.avatar * 0.34,
                }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* Status dot */}
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{
                backgroundColor: isDesligado ? "#ef4444" : "#22c55e",
                boxShadow: isDesligado ? "0 0 6px #ef444466" : "0 0 6px #22c55e55",
              }}
            />
            <span
              className={cn(
                "font-semibold leading-tight truncate",
                s.nameSize,
                isDesligado && "line-through opacity-60"
              )}
              style={{ color: "#0f2137", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {person.nome}
            </span>
          </div>

          <p
            className={cn(
              "leading-tight mt-0.5 truncate font-medium uppercase tracking-wider",
              s.roleSize
            )}
            style={{ color: "rgba(15,33,55,0.4)" }}
          >
            {person.cargo}
          </p>

          {/* Department pill */}
          <div
            className="inline-flex items-center gap-1 mt-1.5 rounded-full px-2 py-[2px]"
            style={{
              background: `${colors.bg}12`,
              border: `1px solid ${colors.bg}22`,
            }}
          >
            <span
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: colors.bg }}
            />
            <span
              className="text-[9px] font-semibold tracking-wide"
              style={{ color: colors.bg }}
            >
              {person.departamento}
            </span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <span className="whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-white shadow-lg">
          Ver perfil
        </span>
      </div>
    </motion.button>
  );
}
