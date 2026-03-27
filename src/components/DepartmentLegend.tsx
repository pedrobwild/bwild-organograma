import { getDeptClass } from "./OrgChart";

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
    <div className="flex items-center gap-2 flex-wrap">
      {departments.map((dept) => {
        const deptClass = getDeptClass(dept);
        const colorKey = deptClass.replace("dept-", "");
        const isActive = highlightDept === dept;
        return (
          <button
            key={dept}
            onMouseEnter={() => onHover(dept)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : dept)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
              ${isActive
                ? `bg-dept-${colorKey}/20 border-dept-${colorKey}/40 text-dept-${colorKey}`
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            <div className={`w-2 h-2 rounded-full bg-dept-${colorKey}`} />
            {dept}
          </button>
        );
      })}
    </div>
  );
}
