import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "ativo" | "desligado" | "CLT" | "PJ" | "Estágio" | string;

const STATUS_STYLES: Record<string, string> = {
  ativo: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
  desligado: "bg-red-500 text-white border-red-500 hover:bg-red-600",
  CLT: "bg-blue-500 text-white border-blue-500 hover:bg-blue-600",
  PJ: "bg-purple-500 text-white border-purple-500 hover:bg-purple-600",
  "Estágio": "bg-orange-500 text-white border-orange-500 hover:bg-orange-600",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-muted";

  return (
    <Badge className={cn("text-[10px] font-semibold", style, className)}>
      {status === "ativo" ? "Ativo" : status === "desligado" ? "Desligado" : status}
    </Badge>
  );
}
