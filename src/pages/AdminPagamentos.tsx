import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentsCalendar, type PaymentEntry, type PaymentKind } from "@/hooks/use-payments-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Wallet, Gift, TrendingUp, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const KIND_META: Record<PaymentKind, { label: string; icon: typeof Wallet; color: string; dot: string }> = {
  salario: { label: "Salário", icon: Wallet, color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  beneficio: { label: "Benefício", icon: Gift, color: "text-sky-700 bg-sky-50 border-sky-200", dot: "bg-sky-500" },
  comissao: { label: "Comissão", icon: TrendingUp, color: "text-violet-700 bg-violet-50 border-violet-200", dot: "bg-violet-500" },
};

function formatBRL(val: number | null | undefined) {
  if (val == null || val === 0) return "—";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatBRLFull(val: number | null | undefined) {
  if (val == null) return "—";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminPagamentos() {
  const { user, isAdmin, loading } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  const { data, isLoading } = usePaymentsCalendar();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Build calendar grid for current month
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay(); // 0=Sun
    const cells: Array<{ day: number | null; date: Date | null }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: new Date(year, month, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
    return { cells, daysInMonth };
  }, [year, month]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const monthTotals = data?.monthTotals ?? { salario: 0, beneficio: 0, comissao: 0, total: 0 };
  const selectedEntries: PaymentEntry[] = selectedDay != null ? data?.byDay.get(selectedDay) ?? [] : [];

  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalIcon className="w-6 h-6 text-primary" />
              Calendário de pagamentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize as datas e valores de salários, benefícios e comissões do mês.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-accent"
              aria-label="Mês anterior"
            >
              ←
            </button>
            <div className="px-4 py-1.5 rounded-md border border-border text-sm font-medium min-w-[160px] text-center">
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              onClick={goNext}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-accent"
              aria-label="Próximo mês"
            >
              →
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total do mês" value={monthTotals.total} icon={CalIcon} color="text-slate-900 bg-slate-50 border-slate-200" />
          <SummaryCard label="Salários" value={monthTotals.salario} icon={Wallet} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
          <SummaryCard label="Benefícios" value={monthTotals.beneficio} icon={Gift} color="text-sky-700 bg-sky-50 border-sky-200" />
          <SummaryCard label="Comissões (meta)" value={monthTotals.comissao} icon={TrendingUp} color="text-violet-700 bg-violet-50 border-violet-200" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(Object.keys(KIND_META) as PaymentKind[]).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full", KIND_META[k].dot)} />
              <span>{KIND_META[k].label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEK_DAYS.map((w) => (
                    <div key={w} className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium text-center py-1">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {grid.cells.map((cell, idx) => {
                    if (!cell.day) {
                      return <div key={idx} className="min-h-[88px] rounded-md bg-slate-50/50" />;
                    }
                    const entries = data?.byDay.get(cell.day) ?? [];
                    const totals = data?.totalsByDay.get(cell.day);
                    const isToday =
                      cell.date?.toDateString() === today.toDateString();
                    const hasPayments = entries.length > 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => hasPayments && setSelectedDay(cell.day)}
                        disabled={!hasPayments}
                        className={cn(
                          "min-h-[88px] rounded-md border p-1.5 text-left transition-all flex flex-col gap-1",
                          isToday ? "border-primary ring-1 ring-primary/30" : "border-border",
                          hasPayments
                            ? "bg-card hover:border-primary/60 hover:shadow-sm cursor-pointer"
                            : "bg-slate-50/50 cursor-default opacity-70",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-semibold",
                            isToday ? "text-primary" : "text-slate-700",
                          )}>
                            {cell.day}
                          </span>
                          {hasPayments && (
                            <span className="text-[10px] text-muted-foreground">
                              {entries.length}
                            </span>
                          )}
                        </div>

                        {hasPayments && (
                          <>
                            <div className="flex gap-0.5 flex-wrap">
                              {(["salario", "beneficio", "comissao"] as PaymentKind[]).map((k) => {
                                const count = entries.filter((e) => e.kind === k).length;
                                if (!count) return null;
                                return (
                                  <span
                                    key={k}
                                    className={cn("inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium border", KIND_META[k].color)}
                                  >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", KIND_META[k].dot)} />
                                    {count}
                                  </span>
                                );
                              })}
                            </div>
                            {totals && totals.total > 0 && (
                              <div className="mt-auto text-[11px] font-semibold text-slate-800 truncate">
                                {formatBRL(totals.total)}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day detail dialog */}
      <Dialog open={selectedDay != null} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pagamentos — dia {selectedDay} de {MONTH_NAMES[month]}
            </DialogTitle>
          </DialogHeader>
          {selectedDay != null && (
            <DayDetail
              entries={selectedEntries}
              totals={data?.totalsByDay.get(selectedDay)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SummaryCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: typeof Wallet; color: string }) {
  return (
    <div className={cn("rounded-lg border p-4", color)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-80">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-xl font-bold mt-1">
        {value > 0 ? formatBRLFull(value) : "—"}
      </div>
    </div>
  );
}

function DayDetail({
  entries,
  totals,
}: {
  entries: PaymentEntry[];
  totals?: { salario: number; beneficio: number; comissao: number; total: number };
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pagamento neste dia.</p>;
  }

  const grouped = (["salario", "beneficio", "comissao"] as PaymentKind[]).map((kind) => ({
    kind,
    items: entries.filter((e) => e.kind === kind),
  }));

  return (
    <div className="space-y-4">
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="rounded border bg-slate-50 px-3 py-2">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold text-slate-900">{formatBRLFull(totals.total)}</div>
          </div>
          {(["salario", "beneficio", "comissao"] as PaymentKind[]).map((k) => (
            <div key={k} className={cn("rounded border px-3 py-2", KIND_META[k].color)}>
              <div className="opacity-80">{KIND_META[k].label}</div>
              <div className="font-semibold">{formatBRLFull(totals[k])}</div>
            </div>
          ))}
        </div>
      )}

      {grouped.map(({ kind, items }) => {
        if (items.length === 0) return null;
        const Meta = KIND_META[kind];
        const Icon = Meta.icon;
        return (
          <div key={kind}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-semibold text-slate-800">{Meta.label}</h4>
              <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
            </div>
            <div className="border rounded-md divide-y">
              {items.map((e) => (
                <div key={e.id} className="px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.colaboradorNome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.label} · {e.departamento}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {formatBRLFull(e.valor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
