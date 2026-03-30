import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Cake,
  Download,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  ClipboardList,
} from "lucide-react";
import { format, differenceInYears, differenceInMonths, differenceInDays, isSameMonth, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useOnboardingSummary } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmployeeDrawer } from "@/components/employee/EmployeeDrawer";
import type { Colaborador } from "@/types/organogram";
import logoSrc from "@/assets/logo-bwild.png";

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
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { colaboradores, historico, documentos, deptColors, isLoading } = useDashboardData();
  const { data: onboardingSummary = {} } = useOnboardingSummary();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [drawerPerson, setDrawerPerson] = useState<Colaborador | null>(null);

  // Derived data
  const ativos = useMemo(() => colaboradores.filter((c) => c.status === "ativo"), [colaboradores]);
  const deptColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    deptColors.forEach((d) => (m[d.departamento] = d.bg));
    return m;
  }, [deptColors]);

  // KPIs
  const totalAtivos = ativos.length;
  const contratacoesNoMes = useMemo(
    () => colaboradores.filter((c) => c.data_inicio && isSameMonth(parseISO(c.data_inicio), now)).length,
    [colaboradores]
  );
  const desligamentosNoMes = useMemo(
    () =>
      colaboradores.filter(
        (c) => c.status === "desligado" && c.data_inicio && isSameMonth(parseISO(c.data_inicio), now)
      ).length,
    [colaboradores]
  );

  // Contract type donut
  const contractData = useMemo(() => {
    const counts: Record<string, number> = {};
    ativos.forEach((c) => {
      const tipo = c.tipo_contrato || "Não definido";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ativos]);
  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

  // Headcount by dept
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    ativos.forEach((c) => {
      counts[c.departamento] = (counts[c.departamento] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([dept, count]) => ({ dept, count, color: deptColorMap[dept] || "#6b7280" }))
      .sort((a, b) => b.count - a.count);
  }, [ativos, deptColorMap]);

  // Birthdays this month
  const aniversariosNascimento = useMemo(
    () =>
      ativos.filter((c) => {
        if (!c.data_nascimento) return false;
        const d = parseISO(c.data_nascimento);
        return d.getMonth() === now.getMonth();
      }),
    [ativos]
  );

  // Company anniversaries (milestones: 1,2,3,5,10)
  const aniversariosEmpresa = useMemo(() => {
    const milestones = [1, 2, 3, 5, 10, 15, 20];
    return ativos
      .filter((c) => {
        if (!c.data_inicio) return false;
        const start = parseISO(c.data_inicio);
        if (start.getMonth() !== now.getMonth()) return false;
        const years = differenceInYears(now, start);
        return milestones.includes(years);
      })
      .map((c) => ({ ...c, years: differenceInYears(now, parseISO(c.data_inicio!)) }));
  }, [ativos]);

  // Salary distribution by dept (for admins)
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
        dept,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
        count: sorted.length,
        color: deptColorMap[dept] || "#6b7280",
      };
    });
  }, [ativos, isAdmin, deptColorMap]);

  // Missing contracts
  const semContrato = useMemo(() => {
    if (!isAdmin) return [];
    const docsById = new Set(documentos.filter((d) => d.tipo === "Contrato de Trabalho").map((d) => d.colaborador_id));
    return ativos.filter((c) => !docsById.has(c.id));
  }, [ativos, documentos, isAdmin]);

  // Activity feed
  const activityFeed = useMemo(() => {
    type FeedItem = { date: string; type: string; text: string; avatarUrl: string | null; name: string; id: string };
    const items: FeedItem[] = [];

    historico.forEach((h) => {
      const colab = colaboradores.find((c) => c.id === h.colaborador_id);
      items.push({
        date: h.data_mudanca,
        type: "promo",
        text: `${h.cargo_anterior ?? "—"} → ${h.cargo_novo}`,
        avatarUrl: colab?.foto_url ?? null,
        name: colab?.nome ?? h.colaborador_id,
        id: h.colaborador_id,
      });
    });

    documentos.slice(0, 10).forEach((d) => {
      const colab = colaboradores.find((c) => c.id === d.colaborador_id);
      items.push({
        date: d.created_at?.split("T")[0] ?? "",
        type: "doc",
        text: `Documento: ${d.tipo} — ${d.nome_arquivo}`,
        avatarUrl: colab?.foto_url ?? null,
        name: colab?.nome ?? d.colaborador_id,
        id: d.colaborador_id,
      });
    });

    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  }, [historico, documentos, colaboradores]);

  // Employee table
  const filteredColabs = useMemo(() => {
    let list = colaboradores;
    if (deptFilter) list = list.filter((c) => c.departamento === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.cargo.toLowerCase().includes(q) ||
          c.departamento.toLowerCase().includes(q)
      );
    }
    return list;
  }, [colaboradores, deptFilter, search]);

  const openDrawer = useCallback(
    (c: typeof colaboradores[0]) => {
      const allDb = colaboradores;
      const subordinados = allDb.filter((s) => s.superior_id === c.id).map((s) => s.id);
      setDrawerPerson({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        departamento: c.departamento,
        nivel: c.nivel,
        foto: c.foto_url,
        funcoes: c.funcoes,
        superior: c.superior_id,
        subordinados,
        status: c.status,
        tipo_contrato: c.tipo_contrato,
      });
    },
    [colaboradores]
  );

  const allColaboradores: Colaborador[] = useMemo(
    () =>
      colaboradores.map((c) => ({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        departamento: c.departamento,
        nivel: c.nivel,
        foto: c.foto_url,
        funcoes: c.funcoes,
        superior: c.superior_id,
        subordinados: colaboradores.filter((s) => s.superior_id === c.id).map((s) => s.id),
        status: c.status,
        tipo_contrato: c.tipo_contrato,
      })),
    [colaboradores]
  );

  const exportCsv = useCallback(() => {
    const headers = ["Nome", "Cargo", "Departamento", "Tipo Contrato", "Data Início", "Status", "Tempo de Empresa"];
    const rows = filteredColabs.map((c) => [
      c.nome,
      c.cargo,
      c.departamento,
      c.tipo_contrato ?? "",
      c.data_inicio ?? "",
      c.status,
      tempoDeEmpresa(c.data_inicio),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "colaboradores.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredColabs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        <Button variant="outline" onClick={() => navigate("/login")}>Ir para login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden">
              <img src={logoSrc} alt="Bwild" className="h-full w-full object-cover" />
            </div>
            <h1 className="font-display text-lg font-bold" style={{ color: "#0f2137", fontFamily: "'Space Grotesk', sans-serif" }}>
              Dashboard RH
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Organograma</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="w-4 h-4 mr-1" /> Admin
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-20">Carregando dados...</p>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<Users className="w-5 h-5" />}
                label="Colaboradores Ativos"
                value={totalAtivos}
                color="#3b82f6"
              />
              <KpiCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Contratações no Mês"
                value={contratacoesNoMes}
                color="#10b981"
              />
              <KpiCard
                icon={<TrendingDown className="w-5 h-5" />}
                label="Desligamentos no Mês"
                value={desligamentosNoMes}
                color="#ef4444"
              />
              {/* Contract donut */}
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-16 h-16 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={contractData} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" stroke="none">
                          {contractData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Por Contrato</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {contractData.map((d, i) => (
                        <span key={d.name} className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {d.name}: {d.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Headcount by Department */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0f2137" }}>
                  <BarChart3 className="w-4 h-4 text-slate-400" /> Headcount por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis
                        dataKey="dept"
                        type="category"
                        tick={{ fontSize: 11, fill: "#475569" }}
                        width={95}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                        formatter={(value: number) => [`${value} colaboradores`, "Headcount"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d: any) => setDeptFilter(deptFilter === d.dept ? null : d.dept)}>
                        {deptData.map((entry) => (
                          <Cell
                            key={entry.dept}
                            fill={entry.color}
                            opacity={deptFilter && deptFilter !== entry.dept ? 0.3 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {deptFilter && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Filtrando: {deptFilter}
                    </Badge>
                    <button onClick={() => setDeptFilter(null)} className="text-xs text-blue-600 hover:underline">
                      Limpar filtro
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Birthdays section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0f2137" }}>
                    <Cake className="w-4 h-4 text-pink-400" /> Aniversários do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aniversariosNascimento.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Nenhum aniversário neste mês</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                      {aniversariosNascimento.map((c) => (
                        <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <Avatar url={c.foto_url} nome={c.nome} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{c.nome}</p>
                            <p className="text-[11px] text-slate-400">{format(parseISO(c.data_nascimento!), "dd 'de' MMMM", { locale: ptBR })}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0f2137" }}>
                    🎉 Aniversários de Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aniversariosEmpresa.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Nenhum aniversário de empresa neste mês</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                      {aniversariosEmpresa.map((c) => (
                        <button key={c.id} onClick={() => openDrawer(c)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <Avatar url={c.foto_url} nome={c.nome} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{c.nome}</p>
                            <p className="text-[11px] text-slate-400">{c.years} {c.years === 1 ? "ano" : "anos"} de empresa</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{c.years}A</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Salary distribution (admins only) */}
            {isAdmin && salaryData.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: "#0f2137" }}>
                    Distribuição Salarial por Departamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salaryData.map((d) => {
                      const range = d.max - d.min || 1;
                      const avgPercent = ((d.avg - d.min) / range) * 100;
                      return (
                        <div key={d.dept} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-28 truncate font-medium">{d.dept}</span>
                          <div className="flex-1 h-6 bg-slate-100 rounded-full relative overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${d.color}44, ${d.color}cc)`,
                                width: "100%",
                              }}
                            />
                            <div
                              className="absolute top-0 w-0.5 h-full bg-white"
                              style={{ left: `${avgPercent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 w-36 text-right tabular-nums">
                            {formatBRL(d.min)} — {formatBRL(d.max)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">A linha branca indica a média salarial do departamento</p>
                </CardContent>
              </Card>
            )}

            {/* Activity Feed */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold" style={{ color: "#0f2137" }}>
                  Últimas Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhuma movimentação recente</p>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                    {activityFeed.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                        <Avatar url={item.avatarUrl} nome={item.name} size={28} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">{item.name}</span>
                            {" · "}
                            <span className="text-slate-500">{item.text}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0">
                          {item.type === "promo" ? "Cargo" : "Doc"}
                        </Badge>
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
                      <button
                        key={c.id}
                        onClick={() => openDrawer(c)}
                        className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 text-left hover:bg-amber-50 transition-colors"
                      >
                        <Avatar url={c.foto_url} nome={c.nome} size={24} />
                        <span className="text-xs font-medium text-slate-700">{c.nome}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employee table */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: "#0f2137" }}>
                    Todos os Colaboradores ({filteredColabs.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 w-48 text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs">
                      <Download className="w-3 h-3 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Colaborador</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Cargo</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Departamento</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Contrato</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Início</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Tempo</th>
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredColabs.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => openDrawer(c)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar url={c.foto_url} nome={c.nome} size={28} />
                              <span className="font-medium text-slate-700">{c.nome}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{c.cargo}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${deptColorMap[c.departamento] || "#6b7280"}15`,
                                color: deptColorMap[c.departamento] || "#6b7280",
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deptColorMap[c.departamento] || "#6b7280" }} />
                              {c.departamento}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{c.tipo_contrato ?? "—"}</td>
                          <td className="py-2.5 px-4 text-slate-500">{c.data_inicio ? format(parseISO(c.data_inicio), "dd/MM/yyyy") : "—"}</td>
                          <td className="py-2.5 px-4 text-slate-500">{tempoDeEmpresa(c.data_inicio)}</td>
                          <td className="py-2.5 px-4">
                            <Badge
                              className={
                                c.status === "ativo"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"
                                  : "bg-red-100 text-red-700 border-red-200 text-[10px]"
                              }
                            >
                              {c.status === "ativo" ? "Ativo" : "Desligado"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredColabs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Nenhum colaborador encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Employee Drawer */}
      <AnimatePresence>
        {drawerPerson && (
          <EmployeeDrawer
            person={drawerPerson}
            allColaboradores={allColaboradores}
            onClose={() => setDrawerPerson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Helper components */

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#0f2137", fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Avatar({ url, nome, size }: { url: string | null; nome: string; size: number }) {
  const initials = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-200"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? (
        <img src={url} alt={nome} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-slate-500">{initials}</span>
      )}
    </div>
  );
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}
