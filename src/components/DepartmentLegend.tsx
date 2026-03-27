const DEPT_HSL: Record<string, string> = {
  Diretoria: "45 100% 60%",
  Jurídico: "280 60% 65%",
  "Business Operations": "200 80% 55%",
  Vendas: "150 60% 50%",
  Marketing: "340 70% 60%",
  Operações: "20 80% 55%",
  Arquitetura: "170 60% 50%",
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
        const color = `hsl(${DEPT_HSL[dept] || "45 100% 60%"})`;
        const isActive = highlightDept === dept;
        return (
          <button
            key={dept}
            onMouseEnter={() => onHover(dept)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : dept)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
              ${isActive
                ? "border-transparent"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            style={
              isActive
                ? { backgroundColor: `${color}22`, borderColor: `${color}66`, color }
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
