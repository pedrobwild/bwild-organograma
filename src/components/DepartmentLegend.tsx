const DEPT_HSL: Record<string, string> = {
  Diretoria: "45, 100%, 60%",
  Jurídico: "280, 55%, 70%",
  "Business Operations": "200, 75%, 60%",
  Vendas: "155, 55%, 55%",
  Marketing: "340, 65%, 65%",
  Operações: "25, 80%, 58%",
  Arquitetura: "175, 55%, 50%",
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
        const color = `hsl(${DEPT_HSL[dept] || "45, 100%, 60%"})`;
        const isActive = highlightDept === dept;
        return (
          <button
            key={dept}
            onMouseEnter={() => onHover(dept)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : dept)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all backdrop-blur-sm
              ${isActive
                ? "border-transparent text-white"
                : "bg-white/10 border-white/20 text-white/80 hover:text-white hover:bg-white/20"
              }`}
            style={
              isActive
                ? { backgroundColor: `${color}44`, borderColor: `${color}88`, color: "white" }
                : {}
            }
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {dept}
          </button>
        );
      })}
    </div>
  );
}
