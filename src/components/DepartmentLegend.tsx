const DEPT_COLORS: Record<string, string> = {
  Diretoria: "#F5A623",
  Jurídico: "#C084FC",
  "Business Operations": "#38BDF8",
  Vendas: "#34D399",
  Marketing: "#FB7185",
  Operações: "#FB923C",
  Arquitetura: "#2DD4BF",
};

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
        const color = DEPT_COLORS[dept] || "#F5A623";
        const isActive = highlightDept === dept;
        return (
          <button
            key={dept}
            onMouseEnter={() => onHover(dept)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : dept)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
            style={
              isActive
                ? { backgroundColor: `${color}55`, borderColor: color, color: "white" }
                : { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)" }
            }
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {dept}
          </button>
        );
      })}
    </div>
  );
}
