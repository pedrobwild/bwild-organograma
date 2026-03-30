import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { useDocumentos } from "@/hooks/use-hr-data";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface Props {
  colaboradorId: string;
  status: string;
  editing: boolean;
  data: any;
  onClose: () => void;
}

export function EmployeeActions({ colaboradorId, status, editing, data, onClose }: Props) {
  const update = useUpdateColaborador();
  const { data: docs = [] } = useDocumentos(colaboradorId);
  const [desligarOpen, setDesligarOpen] = useState(false);
  const [desligarForm, setDesligarForm] = useState({ data_desligamento: "", motivo_desligamento: "" });

  const hasDistrato = docs.some((d: any) => d.tipo === "Distrato");

  const handleDesligar = async () => {
    if (!desligarForm.data_desligamento) { toast.error("Informe a data de desligamento."); return; }
    try {
      await update.mutateAsync({
        id: colaboradorId,
        status: "desligado",
        data_desligamento: desligarForm.data_desligamento,
        motivo_desligamento: desligarForm.motivo_desligamento || null,
      } as any);
      toast.success("Colaborador desligado.");
      setDesligarOpen(false);
      onClose();
    } catch { toast.error("Erro ao desligar colaborador."); }
  };

  const handleReativar = async () => {
    try {
      await update.mutateAsync({
        id: colaboradorId,
        status: "ativo",
        data_desligamento: null,
        motivo_desligamento: null,
      } as any);
      toast.success("Colaborador reativado!");
    } catch { toast.error("Erro ao reativar."); }
  };

  // Termination info section
  const showTermination = status === "desligado" && data;

  return (
    <div className="flex-shrink-0 border-t bg-white px-8 py-4">
      {showTermination && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm space-y-1">
          <p className="text-xs font-bold text-red-700 uppercase">Desligado</p>
          {data.data_desligamento && <p className="text-slate-700">Data: {new Date(data.data_desligamento).toLocaleDateString("pt-BR")}</p>}
          {data.motivo_desligamento && <p className="text-slate-600">{data.motivo_desligamento}</p>}
          {hasDistrato && <p className="text-emerald-600 text-xs">✓ Distrato disponível na aba Documentos</p>}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        {status === "ativo" ? (
          <Button variant="destructive" size="sm" onClick={() => setDesligarOpen(true)}>
            Desligar Colaborador
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleReativar}>
            Reativar Colaborador
          </Button>
        )}
      </div>

      <Dialog open={desligarOpen} onOpenChange={setDesligarOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Desligar Colaborador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!hasDistrato && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Nenhum documento de Distrato foi enviado. Considere enviar antes de prosseguir.</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data de desligamento</label>
              <Input type="date" value={desligarForm.data_desligamento} onChange={(e) => setDesligarForm(p => ({ ...p, data_desligamento: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Motivo</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={desligarForm.motivo_desligamento}
                onChange={(e) => setDesligarForm(p => ({ ...p, motivo_desligamento: e.target.value }))}
                placeholder="Motivo do desligamento..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDesligarOpen(false)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDesligar}>Confirmar desligamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
