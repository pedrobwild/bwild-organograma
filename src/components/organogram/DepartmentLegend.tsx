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
    <div className="flex items-center gap-1.5 flex-wrap">
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
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              "backdrop-blur-xl",
              isActive
                ? "scale-[1.02] text-white shadow-lg"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            )}
            style={
              isActive
                ? {
                    backgroundColor: colors.bg,
                    borderColor: colors.bg,
                    boxShadow: `0 12px 30px -12px ${colors.bg}`,
                  }
                : undefined
            }
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isActive ? colors.text : colors.bg }}
            />
            {department}
          </button>
        );
      })}
    </div>
  );
}
