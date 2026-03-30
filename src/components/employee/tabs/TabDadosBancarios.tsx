import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { toast } from "sonner";
import { FieldRow, ReadOnlyField } from "../FieldHelpers";

interface Props {
  data: any;
  editing: boolean;
  colaboradorId: string;
}

function mask(value: string | null) {
  if (!value || value.length <= 4) return value ?? "—";
  return "•".repeat(value.length - 4) + value.slice(-4);
}

export function TabDadosBancarios({ data, editing, colaboradorId }: Props) {
  const update = useUpdateColaborador();
  const [form, setForm] = useState({
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
    chave_pix: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        banco: data.banco ?? "",
        agencia: data.agencia ?? "",
        conta: data.conta ?? "",
        tipo_conta: data.tipo_conta ?? "",
        chave_pix: data.chave_pix ?? "",
      });
    }
  }, [data]);

  const save = async () => {
    try {
      await update.mutateAsync({
        id: colaboradorId,
        banco: form.banco || null,
        agencia: form.agencia || null,
        conta: form.conta || null,
        tipo_conta: form.tipo_conta || null,
        chave_pix: form.chave_pix || null,
      } as any);
      toast.success("Dados bancários atualizados!");
    } catch {
      toast.error("Erro ao salvar dados bancários.");
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Dados Bancários</h3>
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField label="Banco" value={data?.banco} />
          <ReadOnlyField label="Agência" value={mask(data?.agencia)} />
          <ReadOnlyField label="Conta" value={mask(data?.conta)} />
          <ReadOnlyField label="Tipo de conta" value={data?.tipo_conta} />
          <ReadOnlyField label="Chave PIX" value={mask(data?.chave_pix)} span={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Dados Bancários</h3>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Banco">
          <Input value={form.banco} onChange={(e) => setForm(p => ({ ...p, banco: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Agência">
          <Input value={form.agencia} onChange={(e) => setForm(p => ({ ...p, agencia: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Conta">
          <Input value={form.conta} onChange={(e) => setForm(p => ({ ...p, conta: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Tipo de conta">
          <Select value={form.tipo_conta} onValueChange={(v) => setForm(p => ({ ...p, tipo_conta: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Corrente</SelectItem>
              <SelectItem value="poupança">Poupança</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Chave PIX" span={2}>
          <Input value={form.chave_pix} onChange={(e) => setForm(p => ({ ...p, chave_pix: e.target.value }))} />
        </FieldRow>
      </div>
      <button onClick={save} className="text-xs text-blue-600 hover:underline mt-2">Salvar dados bancários</button>
    </div>
  );
}
