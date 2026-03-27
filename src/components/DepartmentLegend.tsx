import { getDeptColor } from "@/lib/deptColors";

interface DepartmentLegendProps {
  departments: string[];
  highlightDept: string | null;
  onHover: (dept: string | null) => void;
}

export function DepartmentLegend({
  departments,
  highlightDept,
  onHover,
}: DepartmentLegendProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {departments.map((dept) => {
        const colors = getDeptColor(dept);
        const isActive = highlightDept === dept;
        return (
          <button
            key={dept}
            onMouseEnter={() => onHover(dept)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : dept)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={
              isActive
                ? {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    boxShadow: `0 4px 14px -3px ${colors.bg}88`,
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
            }
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isActive ? colors.text : colors.bg }}
            />
            {dept}
          </button>
        );
      })}
    </div>
  );
}
