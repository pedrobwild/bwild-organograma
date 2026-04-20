import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { toast } from "sonner";
import { FieldRow, ReadOnlyField } from "../FieldHelpers";
import { TabSaveActions } from "../TabSaveActions";

interface Props {
  data: any;
  editing: boolean;
  colaboradorId: string;
}

function calcAge(dateStr: string | null) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function TabDadosPessoais({ data, editing, colaboradorId }: Props) {
  const update = useUpdateColaborador();
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    cnpj: "",
    data_nascimento: "",
    email_pessoal: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        nome: data.nome ?? "",
        cpf: data.cpf ?? "",
        cnpj: data.cnpj ?? "",
        data_nascimento: data.data_nascimento ?? "",
        email_pessoal: data.email_pessoal ?? "",
        telefone: data.telefone ?? "",
        endereco: data.endereco ?? "",
        cidade: data.cidade ?? "",
        estado: data.estado ?? "",
        cep: data.cep ?? "",
      });
    }
  }, [data]);

  const save = async () => {
    try {
      await update.mutateAsync({ id: colaboradorId, ...form });
      toast.success("Dados pessoais atualizados!");
    } catch {
      toast.error("Erro ao salvar dados pessoais.");
    }
  };

  const age = calcAge(form.data_nascimento);

  if (!editing) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Dados Pessoais</h3>
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField label="Nome completo" value={data?.nome} span={2} />
          <ReadOnlyField label="CPF" value={data?.cpf} />
          <ReadOnlyField label="CNPJ" value={data?.cnpj} />
          <ReadOnlyField label="Data de nascimento" value={data?.data_nascimento ? `${new Date(data.data_nascimento).toLocaleDateString("pt-BR")}${age !== null ? ` (${age} anos)` : ""}` : null} />
          <ReadOnlyField label="Email pessoal" value={data?.email_pessoal} />
          <ReadOnlyField label="Telefone" value={data?.telefone} />
          <ReadOnlyField label="Endereço" value={data?.endereco} span={2} />
          <ReadOnlyField label="Cidade" value={data?.cidade} />
          <ReadOnlyField label="Estado" value={data?.estado} />
          <ReadOnlyField label="CEP" value={data?.cep} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Dados Pessoais</h3>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Nome completo" span={2}>
          <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
        </FieldRow>
        <FieldRow label="CPF">
          <Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
        </FieldRow>
        <FieldRow label="CNPJ">
          <Input value={form.cnpj} onChange={(e) => setForm((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
        </FieldRow>
        <FieldRow label="Data de nascimento">
          <Input type="date" value={form.data_nascimento} onChange={(e) => setForm((p) => ({ ...p, data_nascimento: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Email pessoal">
          <Input type="email" value={form.email_pessoal} onChange={(e) => setForm((p) => ({ ...p, email_pessoal: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Telefone">
          <Input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Endereço" span={2}>
          <Input value={form.endereco} onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Cidade">
          <Input value={form.cidade} onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Estado">
          <Input value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} />
        </FieldRow>
        <FieldRow label="CEP">
          <Input value={form.cep} onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value }))} />
        </FieldRow>
      </div>
      <TabSaveActions onSave={save} saving={update.isPending} label="Salvar dados pessoais" />
    </div>
  );
}
