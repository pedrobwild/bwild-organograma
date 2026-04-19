import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Brain,
  CheckCircle2,
  FileDown,
  GraduationCap,
  Plus,
  Printer,
  Rocket,
  Sparkles,
  Target,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { getDeptColor } from "@/lib/deptColors";
import { cn } from "@/lib/utils";
import type { Colaborador } from "@/types/organogram";
import {
  Competency,
  COMPETENCY_LEVEL_LABEL,
  COMPETENCY_LEVEL_VALUE,
  CompetencyLevel,
  EMPTY_JD,
  JobDescription,
  KPI,
  SENIORIDADES,
} from "@/types/job-description";

interface Props {
  data: any;
  person: Colaborador;
  editing: boolean;
  colaboradorId: string;
}

function normalize(jd: any): JobDescription {
  if (!jd || typeof jd !== "object") return { ...EMPTY_JD };
  return {
    mission: jd.mission ?? "",
    responsibilities: Array.isArray(jd.responsibilities) ? jd.responsibilities : [],
    requirements: Array.isArray(jd.requirements) ? jd.requirements : [],
    desired: Array.isArray(jd.desired) ? jd.desired : [],
    hardSkills: Array.isArray(jd.hardSkills) ? jd.hardSkills : [],
    softSkills: Array.isArray(jd.softSkills) ? jd.softSkills : [],
    competencies: Array.isArray(jd.competencies) ? jd.competencies : [],
    kpis: Array.isArray(jd.kpis) ? jd.kpis : [],
    notes: jd.notes ?? "",
    updatedAt: jd.updatedAt,
  };
}

export function TabJobDescription({ data, person, editing, colaboradorId }: Props) {
  const update = useUpdateColaborador();
  const colors = getDeptColor(person.departamento);

  const [jd, setJd] = useState<JobDescription>(normalize(data?.job_description));
  const [senioridade, setSenioridade] = useState<string>(data?.senioridade ?? "");
  const [missao, setMissao] = useState<string>(data?.missao ?? data?.job_description?.mission ?? "");

  useEffect(() => {
    setJd(normalize(data?.job_description));
    setSenioridade(data?.senioridade ?? "");
    setMissao(data?.missao ?? data?.job_description?.mission ?? "");
  }, [data]);

  const jdIsEmpty = useMemo(() => {
    return (
      !missao &&
      !jd.responsibilities?.length &&
      !jd.requirements?.length &&
      !jd.desired?.length &&
      !jd.hardSkills?.length &&
      !jd.softSkills?.length &&
      !jd.competencies?.length &&
      !jd.kpis?.length &&
      !jd.notes
    );
  }, [jd, missao]);

  const save = async () => {
    try {
      const payload: JobDescription = {
        ...jd,
        mission: missao,
        updatedAt: new Date().toISOString(),
      };
      await update.mutateAsync({
        id: colaboradorId,
        job_description: payload as any,
        senioridade: senioridade || null,
        missao: missao || null,
      } as any);
      toast.success("Descrição de cargo salva!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar descrição de cargo.");
    }
  };

  const handlePrint = () => window.print();

  const downloadMarkdown = () => {
    const md = renderJdAsMarkdown(person, { ...jd, mission: missao }, senioridade);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jd-${slugify(person.nome)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────── READ MODE ───────────
  if (!editing) {
    return (
      <div className="space-y-6 jd-print">
        {/* Header chip */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-4 h-4" style={{ color: colors.bg }} />
              Descrição de Cargo
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {person.cargo} · {person.departamento}
              {senioridade ? ` · ${senioridade}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={downloadMarkdown}>
              <FileDown className="w-3.5 h-3.5" /> Exportar .md
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
          </div>
        </div>

        {jdIsEmpty && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
            <Sparkles className="w-5 h-5 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              Nenhuma descrição de cargo cadastrada ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em "Editar" no cabeçalho do perfil para preencher.
            </p>
          </div>
        )}

        {missao && (
          <Section title="Missão do cargo" icon={<Target className="w-4 h-4" />} color={colors.bg}>
            <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 pl-3 py-1" style={{ borderColor: colors.bg }}>
              {missao}
            </p>
          </Section>
        )}

        {jd.responsibilities && jd.responsibilities.length > 0 && (
          <Section title="Principais responsabilidades" icon={<CheckCircle2 className="w-4 h-4" />} color={colors.bg}>
            <ul className="space-y-2">
              {jd.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.bg }} />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {jd.kpis && jd.kpis.length > 0 && (
          <Section title="KPIs & Metas" icon={<Award className="w-4 h-4" />} color={colors.bg}>
            <div className="grid sm:grid-cols-2 gap-2">
              {jd.kpis.map((k, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{k.label}</p>
                    {k.target && (
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        Meta: {k.target}
                      </Badge>
                    )}
                  </div>
                  {k.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{k.description}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {(jd.requirements && jd.requirements.length > 0) || (jd.desired && jd.desired.length > 0) ? (
          <div className="grid md:grid-cols-2 gap-4">
            {jd.requirements && jd.requirements.length > 0 && (
              <Section title="Requisitos obrigatórios" icon={<GraduationCap className="w-4 h-4" />} color={colors.bg}>
                <ul className="space-y-1.5">
                  {jd.requirements.map((r, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">▸</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {jd.desired && jd.desired.length > 0 && (
              <Section title="Diferenciais" icon={<Sparkles className="w-4 h-4" />} color={colors.bg}>
                <ul className="space-y-1.5">
                  {jd.desired.map((r, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">◇</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        ) : null}

        {(jd.hardSkills && jd.hardSkills.length > 0) || (jd.softSkills && jd.softSkills.length > 0) ? (
          <div className="grid md:grid-cols-2 gap-4">
            {jd.hardSkills && jd.hardSkills.length > 0 && (
              <Section title="Hard skills" icon={<Wrench className="w-4 h-4" />} color={colors.bg}>
                <div className="flex flex-wrap gap-1.5">
                  {jd.hardSkills.map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${colors.bg}14`, color: colors.bg, border: `1px solid ${colors.bg}33` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            {jd.softSkills && jd.softSkills.length > 0 && (
              <Section title="Soft skills" icon={<Brain className="w-4 h-4" />} color={colors.bg}>
                <div className="flex flex-wrap gap-1.5">
                  {jd.softSkills.map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : null}

        {jd.competencies && jd.competencies.length > 0 && (
          <Section title="Matriz de competências" icon={<Award className="w-4 h-4" />} color={colors.bg}>
            <div className="space-y-2">
              {jd.competencies.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-40 truncate font-medium">{c.name}</span>
                  <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className="h-2 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            lvl <= COMPETENCY_LEVEL_VALUE[c.level] ? colors.bg : `${colors.bg}15`,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider w-24 text-right"
                    style={{ color: colors.bg }}
                  >
                    {COMPETENCY_LEVEL_LABEL[c.level]}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {jd.notes && (
          <Section title="Observações" icon={<Sparkles className="w-4 h-4" />} color={colors.bg}>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{jd.notes}</p>
          </Section>
        )}

        {jd.updatedAt && (
          <p className="text-[10px] text-slate-400 text-right print:hidden">
            Última atualização: {new Date(jd.updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    );
  }

  // ─────────── EDIT MODE ───────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Editar Descrição de Cargo</h3>
        <Button size="sm" className="h-8 text-xs" onClick={save} disabled={update.isPending}>
          {update.isPending ? "Salvando..." : "Salvar JD"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missão do cargo</Label>
          <textarea
            className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={missao}
            onChange={(e) => setMissao(e.target.value)}
            placeholder="Ex: Garantir a excelência da operação comercial da empresa, alinhando vendas e estratégia."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Senioridade</Label>
          <Select value={senioridade} onValueChange={setSenioridade}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SENIORIDADES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StringListEditor
        label="Principais responsabilidades"
        placeholder="Ex: Gerir carteira de clientes estratégicos"
        items={jd.responsibilities ?? []}
        onChange={(v) => setJd((p) => ({ ...p, responsibilities: v }))}
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      />

      <KpiEditor items={jd.kpis ?? []} onChange={(v) => setJd((p) => ({ ...p, kpis: v }))} />

      <div className="grid md:grid-cols-2 gap-4">
        <StringListEditor
          label="Requisitos obrigatórios"
          placeholder="Ex: Ensino superior completo"
          items={jd.requirements ?? []}
          onChange={(v) => setJd((p) => ({ ...p, requirements: v }))}
          icon={<GraduationCap className="w-3.5 h-3.5" />}
        />
        <StringListEditor
          label="Diferenciais"
          placeholder="Ex: Pós-graduação em gestão"
          items={jd.desired ?? []}
          onChange={(v) => setJd((p) => ({ ...p, desired: v }))}
          icon={<Sparkles className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TagListEditor
          label="Hard skills"
          placeholder="Ex: SQL, Python, Excel avançado"
          items={jd.hardSkills ?? []}
          onChange={(v) => setJd((p) => ({ ...p, hardSkills: v }))}
          color={colors.bg}
          icon={<Wrench className="w-3.5 h-3.5" />}
        />
        <TagListEditor
          label="Soft skills"
          placeholder="Ex: Comunicação, Liderança"
          items={jd.softSkills ?? []}
          onChange={(v) => setJd((p) => ({ ...p, softSkills: v }))}
          color="#64748b"
          icon={<Brain className="w-3.5 h-3.5" />}
        />
      </div>

      <CompetencyEditor
        items={jd.competencies ?? []}
        onChange={(v) => setJd((p) => ({ ...p, competencies: v }))}
        color={colors.bg}
      />

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Observações internas
        </Label>
        <textarea
          className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={jd.notes ?? ""}
          onChange={(e) => setJd((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Notas internas, contexto do cargo, etc."
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button size="sm" className="h-8 text-xs" onClick={save} disabled={update.isPending}>
          {update.isPending ? "Salvando..." : "Salvar descrição de cargo"}
        </Button>
      </div>
    </div>
  );
}

/* ───────── Presentational ───────── */

function Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
          {title}
        </h4>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ───────── Editors ───────── */

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <span className="mt-1 text-slate-400 text-xs">▸</span>
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-8 text-sm flex-1"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remover"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={add} disabled={!draft.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

function TagListEditor({
  label,
  items,
  onChange,
  placeholder,
  color,
  icon,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  color: string;
  icon?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...items, ...parts]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 rounded-md border border-input bg-background">
        {items.length === 0 ? (
          <span className="text-xs text-slate-400">Nenhum adicionado</span>
        ) : (
          items.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] font-medium pl-2.5 pr-1 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}33` }}
            >
              {tag}
              <button
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center"
                title="Remover"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`${placeholder ?? ""} (use vírgula para múltiplos)`}
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={add} disabled={!draft.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

function CompetencyEditor({
  items,
  onChange,
  color,
}: {
  items: Competency[];
  onChange: (v: Competency[]) => void;
  color: string;
}) {
  const [draftName, setDraftName] = useState("");
  const [draftLevel, setDraftLevel] = useState<CompetencyLevel>("intermediario");

  const add = () => {
    if (!draftName.trim()) return;
    onChange([...items, { name: draftName.trim(), level: draftLevel }]);
    setDraftName("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5" /> Matriz de competências
      </Label>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <Input
              value={c.name}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...c, name: e.target.value };
                onChange(next);
              }}
              className="h-8 text-sm flex-1"
            />
            <Select
              value={c.level}
              onValueChange={(v: CompetencyLevel) => {
                const next = [...items];
                next[i] = { ...c, level: v };
                onChange(next);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COMPETENCY_LEVEL_LABEL) as CompetencyLevel[]).map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {COMPETENCY_LEVEL_LABEL[lvl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ex: Gestão de projetos"
          className="h-8 text-sm flex-1"
        />
        <Select value={draftLevel} onValueChange={(v: CompetencyLevel) => setDraftLevel(v)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(COMPETENCY_LEVEL_LABEL) as CompetencyLevel[]).map((lvl) => (
              <SelectItem key={lvl} value={lvl}>
                {COMPETENCY_LEVEL_LABEL[lvl]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          onClick={add}
          disabled={!draftName.trim()}
          style={{ borderColor: `${color}55` }}
        >
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

function KpiEditor({ items, onChange }: { items: KPI[]; onChange: (v: KPI[]) => void }) {
  const add = () => onChange([...items, { label: "", target: "", description: "" }]);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5" /> KPIs & Metas
      </Label>
      <div className="space-y-2">
        {items.map((k, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2 relative group">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do KPI (Ex: Receita mensal)"
                value={k.label}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...k, label: e.target.value };
                  onChange(next);
                }}
                className="h-8 text-sm flex-1"
              />
              <Input
                placeholder="Meta (Ex: R$ 50k)"
                value={k.target ?? ""}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...k, target: e.target.value };
                  onChange(next);
                }}
                className="h-8 text-sm w-40"
              />
              <button
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Input
              placeholder="Descrição / contexto (opcional)"
              value={k.description ?? ""}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...k, description: e.target.value };
                onChange(next);
              }}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={add}>
        <Plus className="w-3 h-3" /> Adicionar KPI
      </Button>
    </div>
  );
}

/* ───────── Utils ───────── */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderJdAsMarkdown(person: Colaborador, jd: JobDescription, senioridade: string) {
  const lines: string[] = [];
  lines.push(`# ${person.nome}`);
  lines.push(`**${person.cargo}** · ${person.departamento}${senioridade ? ` · ${senioridade}` : ""}`);
  lines.push("");
  if (jd.mission) {
    lines.push(`## Missão`);
    lines.push(jd.mission);
    lines.push("");
  }
  if (jd.responsibilities?.length) {
    lines.push(`## Principais responsabilidades`);
    jd.responsibilities.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }
  if (jd.kpis?.length) {
    lines.push(`## KPIs`);
    jd.kpis.forEach((k) => lines.push(`- **${k.label}**${k.target ? ` — Meta: ${k.target}` : ""}${k.description ? ` (${k.description})` : ""}`));
    lines.push("");
  }
  if (jd.requirements?.length) {
    lines.push(`## Requisitos`);
    jd.requirements.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }
  if (jd.desired?.length) {
    lines.push(`## Diferenciais`);
    jd.desired.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }
  if (jd.hardSkills?.length) {
    lines.push(`## Hard skills`);
    lines.push(jd.hardSkills.join(", "));
    lines.push("");
  }
  if (jd.softSkills?.length) {
    lines.push(`## Soft skills`);
    lines.push(jd.softSkills.join(", "));
    lines.push("");
  }
  if (jd.competencies?.length) {
    lines.push(`## Matriz de competências`);
    jd.competencies.forEach((c) => lines.push(`- ${c.name}: **${COMPETENCY_LEVEL_LABEL[c.level]}**`));
    lines.push("");
  }
  if (jd.notes) {
    lines.push(`## Observações`);
    lines.push(jd.notes);
    lines.push("");
  }
  return lines.join("\n");
}