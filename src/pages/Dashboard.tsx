import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Cake,
  Download,
  FileWarning,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, differenceInYears, differenceInMonths, isSameMonth, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useOnboardingSummary } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmployeeDrawer } from "@/components/employee/EmployeeDrawer";
import type { Colaborador } from "@/types/organogram";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonKpi, SkeletonTable } from "@/components/ui/SkeletonCard";
import { formatBRL, formatDateBR } from "@/lib/format";

const now = new Date();

function tempoDeEmpresa(dataInicio: string | null): string {
  if (!dataInicio) return "—";
  const start = parseISO(dataInicio);
  const years = differenceInYears(now, start);
  const months = differenceInMonths(now, start) % 12;
  if (years > 0) return `${years}a ${months}m`;
  return `${months}m`;
}

export default function Dashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { colaboradores, historico, documentos, deptColors, isLoading } = useDashboardData();
  const { data: onboardingSummary = {} } = useOnboardingSummary();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [drawerPerson, setDrawerPerson] = useState<Colaborador | null>(null);

  const ativos = useMemo(() => colaboradores.filter((c) => c.status === "ativo"), [colaboradores]);
  const deptColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    deptColors.forEach((d) => (m[d.departamento] = d.bg));
    return m;
  }, [deptColors]);

  const totalAtivos = ativos.length;
  const contratacoesNoMes = useMemo(
    () => colaboradores.filter((c) => c.data_inicio && isSameMonth(parseISO(c.data_inicio), now)).length,
    [colaboradores]
  );
  const desligamentosNoMes = useMemo(
    () => colaboradores.filter((c) => c.status === "desligado" && c.data_inicio && isSameMonth(parseISO(c.data_inicio), now)).length,
    [colaboradores]
  );

  const contractData = useMemo(() => {
    const counts: Record<string, number> = {};
    ativos.forEach((c) => { const tipo = c.tipo_contrato || "Não definido"; counts[tipo] = (counts[tipo] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ativos]);
  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    ativos.forEach((c) => { counts[c.departamento] = (counts[c.departamento] || 0) + 1; });
    return Object.entries(counts).map(([dept, count]) => ({ dept, count, color: deptColorMap[dept] || "#6b7280" })).sort((a, b) => b.count - a.count);
  }, [ativos, deptColorMap]);

  const aniversariosNascimento = useMemo(
    () => ativos.filter((c) => { if (!c.data_nascimento) return false; return parseISO(c.data_nascimento).getMonth() === now.getMonth(); }),
    [ativos]
  );

  const aniversariosEmpresa = useMemo(() => {
    const milestones = [1, 2, 3, 5, 10, 15, 20];
    return ativos.filter((c) => {
      if (!c.data_inicio) return false;
      const start = parseISO(c.data_inicio);
      if (start.getMonth() !== now.getMonth()) return false;
      return milestones.includes(differenceInYears(now, start));
    }).map((c) => ({ ...c, years: differenceInYears(now, parseISO(c.data_inicio!)) }));
  }, [ativos]);

  const salaryData = useMemo(() => {
    if (!isAdmin) return [];
    const byDept: Record<string, number[]> = {};
    ativos.forEach((c) => {
      if (c.salario_base != null) {
        if (!byDept[c.departamento]) byDept[c.departamento] = [];
        byDept[c.departamento].push(Number(c.salario_base));
      }
    });
    return Object.entries(byDept).map(([dept, salaries]) => {
      const sorted = salaries.sort((a, b) => a - b);
      return {
        dept, min: sorted[0], max: sorted[sorted.length - 1],
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
        count: sorted.length, color: deptColorMap[dept] || "#6b7280",
      };
    });
  }, [ativos, isAdmin, deptColorMap]);

  const semContrato = useMemo(() => {
    if (!isAdmin) return [];
    const docsById = new Set(documentos.filter((d) => d.tipo === "Contrato de Trabalho").map((d) => d.colaborador_id));
    return ativos.filter((c) => !docsById.has(c.id));
  }, [ativos, documentos, isAdmin]);

  const activityFeed = useMemo(() => {
    type FeedItem = { date: string; type: string; text: string; avatarUrl: string | null; name: string; id: string };
    const items: FeedItem[] = [];
    historico.forEach((h) => {
      const colab = colaboradores.find((c) => c.id === h.colaborador_id);
      items.push({ date: h.data_mudanca, type: "promo", text: `${h.cargo_anterior ?? "—"} → ${h.cargo_novo}`, avatarUrl: colab?.foto_url ?? null, name: colab?.nome ?? h.colaborador_id, id: h.colaborador_id });
    });
    documentos.slice(0, 10).forEach((d) => {
      const colab = colaboradores.find((c) => c.id === d.colaborador_id);
      items.push({ date: d.created_at?.split("T")[0] ?? "", type: "doc", text: `Documento: ${d.tipo} — ${d.nome_arquivo}`, avatarUrl: colab?.foto_url ?? null, name: colab?.nome ?? d.colaborador_id, id: d.colaborador_id });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  }, [historico, documentos, colaboradores]);

  const filteredColabs = useMemo(() => {
    let list = colaboradores;
    if (deptFilter) list = list.filter((c) => c.departamento === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q) || c.departamento.toLowerCase().includes(q));
    }
    return list;
  }, [colaboradores, deptFilter, search]);

  const openDrawer = useCallback((c: typeof colaboradores[0]) => {
    const subordinados = colaboradores.filter((s) => s.superior_id === c.id).map((s) => s.id);
    setDrawerPerson({
      id: c.id, nome: c.nome, cargo: c.cargo, departamento: c.departamento, nivel: c.nivel,
      foto: c.foto_url, funcoes: c.funcoes, superior: c.superior_id, subordinados, status: c.status, tipo_contrato: c.tipo_contrato,
    });
  }, [colaboradores]);

  const allColaboradores: Colaborador[] = useMemo(
    () => colaboradores.map((c) => ({
      id: c.id, nome: c.nome, cargo: c.cargo, departamento: c.departamento, nivel: c.nivel,
      foto: c.foto_url, funcoes: c.funcoes, superior: c.superior_id,
      subordinados: colaboradores.filter((s) => s.superior_id === c.id).map((s) => s.id),
      status: c.status, tipo_contrato: c.tipo_contrato,
    })),
    [colaboradores]
  );

  const exportCsv = useCallback(() => {
    const headers = ["Nome", "Cargo", "Departamento", "Tipo Contrato", "Data Início", "Status", "Tempo de Empresa"];
    const rows = filteredColabs.map((c) => [c.nome, c.cargo, c.departamento, c.tipo_contrato ?? "", c.data_inicio ?? "", c.status, tempoDeEmpresa(c.data_inicio)]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "colaboradores.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [filteredColabs]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
          </div>
          <SkeletonTable rows={6} />
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        <Button variant="outline" onClick={() => navigate("/login")}>Ir para login</Button>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
            </div>
            <SkeletonTable rows={6} />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={<Users className="w-5 h-5" />} label="Colaboradores Ativos" value={totalAtivos} color="hsl(var(--primary))" />
              <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Contratações no Mês" value={contratacoesNoMes} color="#10b981" />
              <KpiCard icon={<TrendingDown className="w-5 h-5" />} label="Desligamentos no Mês" value={desligamentosNoMes} color="hsl(var(--destructive))" />
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-16 h-16 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={contractData} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" stroke="none">
                        {contractData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Por Contrato</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {contractData.map((d, i) => (
                        <span key={d.name} className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} /> {d.name}: {d.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Headcount by Department */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-card-foreground">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" /> Headcount por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={95} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} formatter={(value: number) => [`${value} colaboradores`, "Headcount"]} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d: any) => setDeptFilter(deptFilter === d.dept ? null : d.dept)}>
                        {deptData.map((entry) => <Cell key={entry.dept} fill={entry.color} opacity={deptFilter && deptFilter !== entry.dept ? 0.3 : 1} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {deptFilter && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Filtrando: {deptFilter}</Badge>
                    <button onClick={() => setDeptFilter(null)} className="text-xs text-primary hover:underline">Limpar filtro</button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Birthdays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-card-foreground">
                    <Cake className="w-4 h-4 text-pink-400" /> Aniversários do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aniversariosNascimento.length === 0 ? (
                    <EmptyState icon={Cake} title="Nenhum aniversário neste mês" />
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                      {aniversariosNascimento.map((c) => (
                        <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent transition-colors">
                          <Avatar url={c.foto_url} nome={c.nome} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{c.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{format(parseISO(c.data_nascimento!), "dd 'de' MMMM", { locale: ptBR })}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-card-foreground">🎉 Aniversários de Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  {aniversariosEmpresa.length === 0 ? (
                    <EmptyState icon={Users} title="Nenhum aniversário de empresa neste mês" />
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                      {aniversariosEmpresa.map((c) => (
                        <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent transition-colors">
                          <Avatar url={c.foto_url} nome={c.nome} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{c.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{c.years} {c.years === 1 ? "ano" : "anos"} de empresa</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{c.years}A</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Onboarding em Andamento */}
            {(() => {
              const sixtyDaysAgo = subDays(now, 60);
              const recentHires = ativos.filter((c) => c.data_inicio && parseISO(c.data_inicio) >= sixtyDaysAgo);
              if (recentHires.length === 0) return null;
              return (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-card-foreground">
                      <ClipboardList className="w-4 h-4 text-primary" /> Onboardings em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                      {recentHires.map((c) => {
                        const summary = onboardingSummary[c.id];
                        const total = summary?.total ?? 0;
                        const done = summary?.done ?? 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border">
                            <Avatar url={c.foto_url} nome={c.nome} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">{c.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{c.cargo} · Início: {formatDateBR(c.data_inicio)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#22c55e" : pct > 50 ? "hsl(var(--primary))" : "#f59e0b" }} />
                              </div>
                              <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Salary */}
            {isAdmin && salaryData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-card-foreground">Distribuição Salarial por Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salaryData.map((d) => {
                      const range = d.max - d.min || 1;
                      const avgPercent = ((d.avg - d.min) / range) * 100;
                      return (
                        <div key={d.dept} className="flex items-center gap-3">
                          <span className="text-xs text-foreground w-28 truncate font-medium">{d.dept}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full relative overflow-hidden">
                            <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${d.color}44, ${d.color}cc)`, width: "100%" }} />
                            <div className="absolute top-0 w-0.5 h-full bg-card" style={{ left: `${avgPercent}%` }} />
                          </div>
                          <div className="text-[10px] text-muted-foreground w-36 text-right tabular-nums">
                            {formatBRL(d.min)} — {formatBRL(d.max)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">A linha branca indica a média salarial do departamento</p>
                </CardContent>
              </Card>
            )}

            {/* Activity Feed */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-card-foreground">Últimas Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="Nenhuma movimentação recente" />
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                    {activityFeed.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                        <Avatar url={item.avatarUrl} nome={item.name} size={28} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-card-foreground">
                            <span className="font-semibold">{item.name}</span>{" · "}<span className="text-muted-foreground">{item.text}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateBR(item.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0">{item.type === "promo" ? "Cargo" : "Doc"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missing contracts */}
            {isAdmin && semContrato.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                    <FileWarning className="w-4 h-4" /> Colaboradores sem Contrato de Trabalho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {semContrato.map((c) => (
                      <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-2 bg-card border border-amber-200 rounded-lg px-3 py-2 text-left hover:bg-amber-50 transition-colors">
                        <Avatar url={c.foto_url} nome={c.nome} size={24} />
                        <span className="text-xs font-medium text-card-foreground">{c.nome}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employee table */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold text-card-foreground">
                    Todos os Colaboradores ({filteredColabs.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-48 text-xs" />
                    <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs">
                      <Download className="w-3 h-3 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs polished-table">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Colaborador</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Cargo</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Departamento</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Contrato</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Início</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Tempo</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredColabs.map((c) => (
                        <tr key={c.id} onClick={() => openDrawer(c)} className="border-b hover:bg-accent cursor-pointer transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar url={c.foto_url} nome={c.nome} size={28} />
                              <span className="font-medium text-card-foreground">{c.nome}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{c.cargo}</td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${deptColorMap[c.departamento] || "#6b7280"}15`, color: deptColorMap[c.departamento] || "#6b7280" }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deptColorMap[c.departamento] || "#6b7280" }} />{c.departamento}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {c.tipo_contrato ? <StatusBadge status={c.tipo_contrato} /> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{formatDateBR(c.data_inicio)}</td>
                          <td className="py-2.5 px-4 text-muted-foreground">{tempoDeEmpresa(c.data_inicio)}</td>
                          <td className="py-2.5 px-4"><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                      {filteredColabs.length === 0 && (
                        <tr><td colSpan={7}><EmptyState icon={Users} title="Nenhum colaborador encontrado" /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AnimatePresence>
        {drawerPerson && <EmployeeDrawer person={drawerPerson} allColaboradores={allColaboradores} onClose={() => setDrawerPerson(null)} />}
      </AnimatePresence>
    </AppLayout>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums font-display text-card-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Avatar({ url, nome, size }: { url: string | null; nome: string; size: number }) {
  const initials = nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {url ? <img src={url} alt={nome} className="w-full h-full object-cover" /> : <span className="font-bold text-muted-foreground">{initials}</span>}
    </div>
  );
}
