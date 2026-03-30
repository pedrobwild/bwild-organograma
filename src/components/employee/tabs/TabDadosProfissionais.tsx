import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Colaborador } from "@/types/organogram";
import { FieldRow, ReadOnlyField } from "../FieldHelpers";
import { Camera } from "lucide-react";

interface Props {
  data: any;
  person: Colaborador;
  editing: boolean;
  colaboradorId: string;
  allColaboradores: Colaborador[];
}

function calcTempo(dateStr: string | null) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ano${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} ${months > 1 ? "meses" : "mês"}`);
  return parts.length > 0 ? parts.join(" e ") : "Menos de 1 mês";
}

const TIPOS_CONTRATO = ["CLT", "PJ", "Estágio", "Temporário"];

export function TabDadosProfissionais({ data, person, editing, colaboradorId, allColaboradores }: Props) {
  const update = useUpdateColaborador();
  const [form, setForm] = useState({
    cargo: "",
    departamento: "",
    tipo_contrato: "",
    carga_horaria: "",
    data_inicio: "",
    superior_id: "",
    email_corporativo: "",
    funcoes: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        cargo: data.cargo ?? "",
        departamento: data.departamento ?? "",
        tipo_contrato: data.tipo_contrato ?? "",
        carga_horaria: data.carga_horaria ?? "",
        data_inicio: data.data_inicio ?? "",
        superior_id: data.superior_id ?? "",
        email_corporativo: data.email_corporativo ?? "",
        funcoes: (data.funcoes ?? []).join("\n"),
      });
    }
  }, [data]);

  const save = async () => {
    try {
      await update.mutateAsync({
        id: colaboradorId,
        cargo: form.cargo,
        departamento: form.departamento,
        tipo_contrato: form.tipo_contrato || null,
        carga_horaria: form.carga_horaria || null,
        data_inicio: form.data_inicio || null,
        superior_id: form.superior_id || null,
        email_corporativo: form.email_corporativo || null,
        funcoes: form.funcoes.split("\n").filter(Boolean),
      } as any);
      toast.success("Dados profissionais atualizados!");
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${colaboradorId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar foto."); return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    await update.mutateAsync({ id: colaboradorId, foto_url: urlData.publicUrl });
    toast.success("Foto atualizada!");
  };

  const tempo = calcTempo(form.data_inicio || data?.data_inicio);

  if (!editing) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Dados Profissionais</h3>
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField label="Cargo" value={data?.cargo} />
          <ReadOnlyField label="Departamento" value={data?.departamento} />
          <ReadOnlyField label="Tipo de contrato" value={data?.tipo_contrato} />
          <ReadOnlyField label="Carga horária" value={data?.carga_horaria} />
          <ReadOnlyField label="Data de início" value={data?.data_inicio ? `${new Date(data.data_inicio).toLocaleDateString("pt-BR")}${tempo ? ` (${tempo})` : ""}` : null} />
          <ReadOnlyField label="Superior direto" value={person.superior ? allColaboradores.find(c => c.id === person.superior)?.nome : null} />
          <ReadOnlyField label="Email corporativo" value={data?.email_corporativo} />
          <ReadOnlyField label="Funções" value={data?.funcoes?.join(", ")} span={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Dados Profissionais</h3>
        {editing && (
          <label className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline cursor-pointer">
            <Camera className="w-3.5 h-3.5" /> Alterar foto
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
          </label>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Cargo">
          <Input value={form.cargo} onChange={(e) => setForm(p => ({ ...p, cargo: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Departamento">
          <Input value={form.departamento} onChange={(e) => setForm(p => ({ ...p, departamento: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Tipo de contrato">
          <Select value={form.tipo_contrato} onValueChange={(v) => setForm(p => ({ ...p, tipo_contrato: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {TIPOS_CONTRATO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Carga horária">
          <Input value={form.carga_horaria} onChange={(e) => setForm(p => ({ ...p, carga_horaria: e.target.value }))} placeholder="44h semanais" />
        </FieldRow>
        <FieldRow label="Data de início">
          <Input type="date" value={form.data_inicio} onChange={(e) => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Superior direto">
          <Select value={form.superior_id} onValueChange={(v) => setForm(p => ({ ...p, superior_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              {allColaboradores.filter(c => c.id !== colaboradorId).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome} — {c.cargo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Email corporativo" span={2}>
          <Input type="email" value={form.email_corporativo} onChange={(e) => setForm(p => ({ ...p, email_corporativo: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Funções (uma por linha)" span={2}>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.funcoes}
            onChange={(e) => setForm(p => ({ ...p, funcoes: e.target.value }))}
          />
        </FieldRow>
      </div>
      <button onClick={save} className="text-xs text-blue-600 hover:underline mt-2">Salvar dados profissionais</button>
    </div>
  );
}
