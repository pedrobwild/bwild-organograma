import { getDeptColor } from "@/lib/deptColors";
import { cn } from "@/lib/utils";

interface DepartmentLegendProps {
  departments: string[];
  highlightDept: string | null;
  onChange: (department: string | null) => void;
}

export function DepartmentLegend({
  departments,
  highlightDept,
  onChange,
}: DepartmentLegendProps) {
  return (
    <div
      className="absolute bottom-6 right-6 z-30 flex flex-col gap-1.5 p-3 rounded-xl"
      style={{
        background: "rgba(10,30,60,0.7)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-0.5">
        Departamentos
      </span>
      {departments.map((department) => {
        const colors = getDeptColor(department);
        const isActive = highlightDept === department;

        return (
          <button
            key={department}
            onClick={() => onChange(isActive ? null : department)}
            onMouseEnter={() => onChange(department)}
            onMouseLeave={() => onChange(null)}
            className={cn(
              "flex items-center gap-2 text-left px-2 py-1 rounded-lg text-[11px] font-medium transition-all",
              isActive
                ? "text-white"
                : "text-white/55 hover:text-white/80"
            )}
            style={isActive ? { backgroundColor: `${colors.bg}33` } : undefined}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.bg }}
            />
            {department}
          </button>
        );
      })}

      {/* Status legend */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-1 block">
          Status
        </span>
        <div className="flex items-center gap-2 px-2 py-0.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-white/50">Ativo</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-white/50">Desligado</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5">
          <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-white/50">PJ</span>
        </div>
      </div>
    </div>
  );
}
