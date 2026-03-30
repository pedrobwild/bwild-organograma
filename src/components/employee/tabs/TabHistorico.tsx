import { useHistoricoCargos, useDocumentos } from "@/hooks/use-hr-data";
import { useColaboradorFull } from "@/hooks/use-hr-data";
import { Briefcase, FileText, UserMinus, UserPlus } from "lucide-react";

interface Props {
  colaboradorId: string;
}

function formatBRL(val: number | null | undefined) {
  if (val == null) return "—";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface TimelineEntry {
  date: string;
  type: "cargo" | "documento" | "status";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export function TabHistorico({ colaboradorId }: Props) {
  const { data: historico = [] } = useHistoricoCargos(colaboradorId);
  const { data: docs = [] } = useDocumentos(colaboradorId);
  const { data: fullData } = useColaboradorFull(colaboradorId);

  const entries: TimelineEntry[] = [];

  // Cargo changes
  historico.forEach((h: any) => {
    entries.push({
      date: h.data_mudanca,
      type: "cargo",
      title: `${h.cargo_anterior ?? "—"} → ${h.cargo_novo}`,
      subtitle: h.salario_anterior || h.salario_novo
        ? `${formatBRL(h.salario_anterior)} → ${formatBRL(h.salario_novo)}${h.motivo ? ` · ${h.motivo}` : ""}`
        : h.motivo || undefined,
      icon: <Briefcase className="w-3.5 h-3.5" />,
    });
  });

  // Document uploads
  docs.forEach((d: any) => {
    entries.push({
      date: d.created_at?.split("T")[0] ?? d.data_documento ?? "",
      type: "documento",
      title: `Documento: ${d.tipo}`,
      subtitle: d.nome_arquivo,
      icon: <FileText className="w-3.5 h-3.5" />,
    });
  });

  // Hire/termination
  if (fullData?.data_inicio) {
    entries.push({
      date: fullData.data_inicio,
      type: "status",
      title: "Admissão",
      icon: <UserPlus className="w-3.5 h-3.5" />,
    });
  }
  if (fullData?.status === "desligado" && fullData?.data_desligamento) {
    entries.push({
      date: fullData.data_desligamento,
      type: "status",
      title: "Desligamento",
      subtitle: fullData.motivo_desligamento || undefined,
      icon: <UserMinus className="w-3.5 h-3.5" />,
    });
  }

  entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const colorMap = {
    cargo: "bg-blue-100 text-blue-600",
    documento: "bg-amber-100 text-amber-600",
    status: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Histórico</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum registro no histórico.</p>
      ) : (
        <div className="relative pl-6 space-y-4">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />

          {entries.map((entry, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className={`absolute left-[-13px] w-6 h-6 rounded-full flex items-center justify-center ${colorMap[entry.type]}`}>
                {entry.icon}
              </div>
              <div className="flex-1 min-w-0 pl-3">
                <p className="text-sm font-medium text-slate-800">{entry.title}</p>
                {entry.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{entry.subtitle}</p>}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {entry.date ? new Date(entry.date).toLocaleDateString("pt-BR") : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
