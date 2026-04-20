import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { useBeneficios, useUpsertBeneficio, useDeleteBeneficio, useComissoes, useUpsertComissao, useVeiculos, useUpsertVeiculo } from "@/hooks/use-hr-data";
import { toast } from "sonner";
import { FieldRow, ReadOnlyField } from "../FieldHelpers";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: any;
  editing: boolean;
  colaboradorId: string;
  isAdmin: boolean;
}

const BENEFICIO_TIPOS = ["Vale Refeição", "Vale Transporte", "Plano de Saúde", "Plano Odontológico", "Gympass", "Outros"];

function formatBRL(val: number | null | undefined) {
  if (val == null) return "—";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TabRemuneracao({ data, editing, colaboradorId, isAdmin }: Props) {
  const update = useUpdateColaborador();
  const { data: beneficios = [] } = useBeneficios(colaboradorId);
  const upsertBeneficio = useUpsertBeneficio();
  const deleteBeneficio = useDeleteBeneficio();
  const { data: comissoes = [] } = useComissoes(colaboradorId);
  const upsertComissao = useUpsertComissao();
  const { data: veiculos = [] } = useVeiculos(colaboradorId);
  const upsertVeiculo = useUpsertVeiculo();

  const [salario, setSalario] = useState("");
  const [chavePix, setChavePix] = useState("");
  useEffect(() => {
    setSalario(data?.salario_base?.toString() ?? "");
    setChavePix(data?.chave_pix ?? "");
  }, [data]);

  const saveSalario = async () => {
    try {
      await update.mutateAsync({ id: colaboradorId, salario_base: salario ? parseFloat(salario) : null } as any);
      toast.success("Salário atualizado!");
    } catch { toast.error("Erro ao salvar salário."); }
  };

  const savePix = async () => {
    try {
      await update.mutateAsync({ id: colaboradorId, chave_pix: chavePix || null } as any);
      toast.success("Chave PIX atualizada!");
    } catch { toast.error("Erro ao salvar chave PIX."); }
  };

  // New beneficio
  const [newBen, setNewBen] = useState({ tipo: "", valor: "", descricao: "" });
  const addBeneficio = async () => {
    if (!newBen.tipo) return;
    try {
      await upsertBeneficio.mutateAsync({ colaborador_id: colaboradorId, tipo: newBen.tipo, valor: newBen.valor ? parseFloat(newBen.valor) : null, descricao: newBen.descricao || null });
      setNewBen({ tipo: "", valor: "", descricao: "" });
      toast.success("Benefício adicionado!");
    } catch { toast.error("Erro ao adicionar benefício."); }
  };

  // New comissao
  const [newCom, setNewCom] = useState({ descricao: "", percentual: "", base_calculo: "", meta_mensal: "", observacoes: "" });
  const addComissao = async () => {
    if (!newCom.descricao) return;
    try {
      await upsertComissao.mutateAsync({
        colaborador_id: colaboradorId,
        descricao: newCom.descricao,
        percentual: newCom.percentual ? parseFloat(newCom.percentual) : null,
        base_calculo: newCom.base_calculo || null,
        meta_mensal: newCom.meta_mensal ? parseFloat(newCom.meta_mensal) : null,
        observacoes: newCom.observacoes || null,
      });
      setNewCom({ descricao: "", percentual: "", base_calculo: "", meta_mensal: "", observacoes: "" });
      toast.success("Comissão adicionada!");
    } catch { toast.error("Erro ao adicionar comissão."); }
  };

  // New veiculo
  const [newVei, setNewVei] = useState({ tipo: "", valor_km: "", teto_mensal: "", placa_veiculo: "", modelo_veiculo: "", observacoes: "" });
  const addVeiculo = async () => {
    try {
      await upsertVeiculo.mutateAsync({
        colaborador_id: colaboradorId,
        tem_direito: true,
        tipo: newVei.tipo || null,
        valor_km: newVei.valor_km ? parseFloat(newVei.valor_km) : null,
        teto_mensal: newVei.teto_mensal ? parseFloat(newVei.teto_mensal) : null,
        placa_veiculo: newVei.placa_veiculo || null,
        modelo_veiculo: newVei.modelo_veiculo || null,
        observacoes: newVei.observacoes || null,
      });
      setNewVei({ tipo: "", valor_km: "", teto_mensal: "", placa_veiculo: "", modelo_veiculo: "", observacoes: "" });
      toast.success("Política de veículo adicionada!");
    } catch { toast.error("Erro ao adicionar política de veículo."); }
  };

  return (
    <div className="space-y-8">
      {/* Salário */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Salário Base</h3>
        {editing ? (
          <div className="flex items-end gap-3">
            <FieldRow label="Valor (R$)">
              <Input type="number" step="0.01" value={salario} onChange={(e) => setSalario(e.target.value)} />
            </FieldRow>
            <Button size="sm" variant="outline" onClick={saveSalario} className="mb-0.5">Salvar</Button>
          </div>
        ) : (
          <p className="text-lg font-semibold text-slate-900">{formatBRL(data?.salario_base)}</p>
        )}
      </section>

      {/* Chave PIX */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Chave PIX</h3>
        {editing ? (
          <div className="flex items-end gap-3">
            <FieldRow label="Chave">
              <Input value={chavePix} onChange={(e) => setChavePix(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
            </FieldRow>
            <Button size="sm" variant="outline" onClick={savePix} className="mb-0.5">Salvar</Button>
          </div>
        ) : (
          <p className="text-sm text-slate-700">{data?.chave_pix || "—"}</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Benefícios</h3>
        {beneficios.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Valor</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  {editing && <th className="px-4 py-2 w-10" />}
                </tr>
              </thead>
              <tbody>
                {beneficios.map((b: any) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-2">{b.tipo}</td>
                    <td className="px-4 py-2">{formatBRL(b.valor)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium ${b.ativo ? "text-emerald-600" : "text-slate-400"}`}>
                        {b.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {editing && (
                      <td className="px-4 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBeneficio.mutate({ id: b.id, colaboradorId })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum benefício cadastrado.</p>
        )}
        {editing && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Adicionar benefício</p>
            <div className="grid grid-cols-3 gap-3">
              <Select value={newBen.tipo} onValueChange={(v) => setNewBen(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>{BENEFICIO_TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" step="0.01" placeholder="Valor" value={newBen.valor} onChange={(e) => setNewBen(p => ({ ...p, valor: e.target.value }))} />
              <Input placeholder="Descrição" value={newBen.descricao} onChange={(e) => setNewBen(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addBeneficio}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
          </div>
        )}
      </section>

      {/* Comissão */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Política de Comissão</h3>
        {comissoes.length > 0 ? (
          <div className="space-y-2">
            {comissoes.map((c: any) => (
              <div key={c.id} className="p-3 border rounded-lg text-sm space-y-1">
                <p className="font-medium">{c.descricao}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {c.percentual && <span>{c.percentual}%</span>}
                  {c.base_calculo && <span>{c.base_calculo}</span>}
                  {c.meta_mensal && <span>Meta: {formatBRL(c.meta_mensal)}</span>}
                </div>
                {c.observacoes && <p className="text-xs text-slate-500">{c.observacoes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma política de comissão.</p>
        )}
        {editing && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Adicionar comissão</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Descrição" value={newCom.descricao} onChange={(e) => setNewCom(p => ({ ...p, descricao: e.target.value }))} />
              <Input type="number" step="0.01" placeholder="Percentual (%)" value={newCom.percentual} onChange={(e) => setNewCom(p => ({ ...p, percentual: e.target.value }))} />
              <Input placeholder="Base de cálculo" value={newCom.base_calculo} onChange={(e) => setNewCom(p => ({ ...p, base_calculo: e.target.value }))} />
              <Input type="number" step="0.01" placeholder="Meta mensal (R$)" value={newCom.meta_mensal} onChange={(e) => setNewCom(p => ({ ...p, meta_mensal: e.target.value }))} />
            </div>
            <Input placeholder="Observações" value={newCom.observacoes} onChange={(e) => setNewCom(p => ({ ...p, observacoes: e.target.value }))} />
            <Button size="sm" onClick={addComissao}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
          </div>
        )}
      </section>

      {/* Veículo */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Política de Veículo</h3>
        {veiculos.length > 0 ? (
          <div className="space-y-2">
            {veiculos.map((v: any) => (
              <div key={v.id} className="p-3 border rounded-lg text-sm space-y-1">
                <p className="font-medium">{v.tipo ?? "Veículo"}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {v.valor_km && <span>R$ {v.valor_km}/km</span>}
                  {v.teto_mensal && <span>Teto: {formatBRL(v.teto_mensal)}</span>}
                  {v.placa_veiculo && <span>Placa: {v.placa_veiculo}</span>}
                  {v.modelo_veiculo && <span>{v.modelo_veiculo}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma política de veículo.</p>
        )}
        {editing && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Adicionar política de veículo</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tipo (ex: Carro Próprio)" value={newVei.tipo} onChange={(e) => setNewVei(p => ({ ...p, tipo: e.target.value }))} />
              <Input type="number" step="0.001" placeholder="Valor/km (R$)" value={newVei.valor_km} onChange={(e) => setNewVei(p => ({ ...p, valor_km: e.target.value }))} />
              <Input type="number" step="0.01" placeholder="Teto mensal (R$)" value={newVei.teto_mensal} onChange={(e) => setNewVei(p => ({ ...p, teto_mensal: e.target.value }))} />
              <Input placeholder="Placa" value={newVei.placa_veiculo} onChange={(e) => setNewVei(p => ({ ...p, placa_veiculo: e.target.value }))} />
              <Input placeholder="Modelo" value={newVei.modelo_veiculo} onChange={(e) => setNewVei(p => ({ ...p, modelo_veiculo: e.target.value }))} />
              <Input placeholder="Observações" value={newVei.observacoes} onChange={(e) => setNewVei(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addVeiculo}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
          </div>
        )}
      </section>
    </div>
  );
}
