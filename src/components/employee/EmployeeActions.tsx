import { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CalendarIcon, Check, ChevronRight, FileUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUpdateColaborador, useColaboradores } from "@/hooks/use-colaboradores";
import { useDocumentos, useUploadDocumento, useCreateHistorico } from "@/hooks/use-hr-data";
import { useAuth } from "@/hooks/use-auth";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";
import { toast } from "sonner";

const MOTIVOS = [
  "Pedido de demissão",
  "Demissão sem justa causa",
  "Demissão por justa causa",
  "Término de contrato",
  "Acordo",
  "Outros",
];

interface Props {
  colaboradorId: string;
  status: string;
  editing: boolean;
  data: any;
  onClose: () => void;
}

export function EmployeeActions({ colaboradorId, status, editing, data, onClose }: Props) {
  const update = useUpdateColaborador();
  const createHistorico = useCreateHistorico();
  const uploadDoc = useUploadDocumento();
  const { data: docs = [] } = useDocumentos(colaboradorId);
  const { data: allColabs = [] } = useColaboradores();
  const { user } = useAuth();

  const [desligarOpen, setDesligarOpen] = useState(false);
  const [reativarOpen, setReativarOpen] = useState(false);

  const hasDistrato = docs.some((d: any) => d.tipo === "Distrato");

  const showTermination = status === "desligado" && data;

  return (
    <div className="flex-shrink-0 border-t bg-white px-8 py-4">
      {showTermination && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm space-y-1">
          <p className="text-xs font-bold text-red-700 uppercase">Desligado</p>
          {data.data_desligamento && (
            <p className="text-slate-700">Data: {new Date(data.data_desligamento).toLocaleDateString("pt-BR")}</p>
          )}
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
          <Button variant="outline" size="sm" onClick={() => setReativarOpen(true)}>
            Reativar Colaborador
          </Button>
        )}
      </div>

      {/* Termination Modal */}
      <TerminationModal
        open={desligarOpen}
        onOpenChange={setDesligarOpen}
        colaboradorId={colaboradorId}
        data={data}
        allColabs={allColabs}
        docs={docs}
        onSuccess={onClose}
      />

      {/* Reactivation Modal */}
      <ReactivationModal
        open={reativarOpen}
        onOpenChange={setReativarOpen}
        colaboradorId={colaboradorId}
        data={data}
        onSuccess={onClose}
      />
    </div>
  );
}

/* ─── Termination Modal ─── */
function TerminationModal({
  open,
  onOpenChange,
  colaboradorId,
  data,
  allColabs,
  docs,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  colaboradorId: string;
  data: any;
  allColabs: any[];
  docs: any[];
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [motivo, setMotivo] = useState("");
  const [obs, setObs] = useState("");
  const [distratoFile, setDistratoFile] = useState<File | null>(null);
  const [skippedDoc, setSkippedDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = useUpdateColaborador();
  const createHistorico = useCreateHistorico();
  const uploadDoc = useUploadDocumento();
  const { user } = useAuth();

  const hasDistrato = docs.some((d: any) => d.tipo === "Distrato");

  // Check subordinates
  const subordinates = useMemo(
    () => allColabs.filter((c: any) => c.superior === colaboradorId && c.status !== "desligado"),
    [allColabs, colaboradorId]
  );
  const hasSubordinates = subordinates.length > 0;

  const colors = getDeptColor(data?.departamento ?? "");
  const initials = getInitials(data?.nome ?? "");

  const reset = () => {
    setStep(0);
    setDate(new Date());
    setMotivo("");
    setObs("");
    setDistratoFile(null);
    setSkippedDoc(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleConfirm = async () => {
    if (!date || !motivo) return;
    setSubmitting(true);
    try {
      // Upload distrato if provided
      if (distratoFile) {
        await uploadDoc.mutateAsync({
          colaboradorId,
          file: distratoFile,
          tipo: "Distrato",
          descricao: "Documento de distrato",
          dataDocumento: format(date, "yyyy-MM-dd"),
          userId: user?.id,
        });
      }

      // Update status
      await update.mutateAsync({
        id: colaboradorId,
        status: "desligado",
        data_desligamento: format(date, "yyyy-MM-dd"),
        motivo_desligamento: motivo + (obs ? ` — ${obs}` : ""),
      } as any);

      // Create historico entry
      await createHistorico.mutateAsync({
        colaborador_id: colaboradorId,
        cargo_anterior: data.cargo,
        cargo_novo: data.cargo,
        salario_anterior: data.salario_base ? Number(data.salario_base) : null,
        salario_novo: null,
        data_mudanca: format(date, "yyyy-MM-dd"),
        motivo: `Desligamento: ${motivo}`,
      });

      toast.success("Colaborador desligado com sucesso.");
      handleClose(false);
      onSuccess();
    } catch {
      toast.error("Erro ao desligar colaborador.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        {/* Steps indicator */}
        <div className="flex items-center gap-0 border-b border-slate-100 px-6 pt-5 pb-3">
          {["Confirmar", "Detalhes", "Documentos", "Resumo"].map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                  i <= step ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium ml-1.5 mr-3",
                  i <= step ? "text-slate-700" : "text-slate-400"
                )}
              >
                {label}
              </span>
              {i < 3 && <ChevronRight className="w-3 h-3 text-slate-300 mr-1" />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 min-h-[240px]">
          {/* Step 0: Confirm */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ring-2"
                style={{ background: `${colors.bg}15`, ringColor: `${colors.bg}33`, color: colors.bg }}
              >
                {data.foto_url ? (
                  <img src={data.foto_url} alt={data.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xl">{initials}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">{data.nome}</p>
                <p className="text-sm text-slate-500">{data.cargo} · {data.departamento}</p>
              </div>

              {hasSubordinates ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2 w-full text-left">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{subordinates.length} colaborador(es) têm esta pessoa como superior.</p>
                    <p className="text-xs mt-1 text-red-600">Atribua um novo superior antes de continuar.</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {subordinates.map((s: any) => (
                        <Badge key={s.id} variant="outline" className="text-[10px]">{s.nome}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2 w-full text-left">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Esta ação irá marcar o colaborador como desligado. Esta operação pode ser revertida.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <DialogHeader className="pb-0">
                <DialogTitle className="text-sm font-semibold text-slate-700">Detalhes do Desligamento</DialogTitle>
              </DialogHeader>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data de desligamento *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2 opacity-50" />
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Motivo do desligamento *</label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Observações</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <DialogHeader className="pb-0">
                <DialogTitle className="text-sm font-semibold text-slate-700">Documento de Distrato</DialogTitle>
              </DialogHeader>

              {hasDistrato ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  ✓ Um documento de Distrato já está anexado para este colaborador.
                </div>
              ) : distratoFile ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{distratoFile.name}</p>
                    <p className="text-[11px] text-slate-400">{(distratoFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setDistratoFile(null)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Clique para enviar o Distrato</p>
                  <p className="text-[11px] text-slate-400">PDF, DOC ou imagem</p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDistratoFile(f);
                }}
              />

              {!hasDistrato && !distratoFile && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Recomendamos anexar o distrato antes de concluir.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <DialogHeader className="pb-0">
                <DialogTitle className="text-sm font-semibold text-slate-700">Confirmar Desligamento</DialogTitle>
              </DialogHeader>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <Row label="Colaborador" value={data.nome} />
                <Row label="Data" value={date ? format(date, "dd/MM/yyyy") : "—"} />
                <Row label="Motivo" value={motivo} />
                {obs && <Row label="Observações" value={obs} />}
                <Row
                  label="Distrato"
                  value={
                    hasDistrato
                      ? "Já anexado"
                      : distratoFile
                      ? distratoFile.name
                      : "Não anexado"
                  }
                />
              </div>

              {!hasDistrato && !distratoFile && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>O distrato não foi anexado. Você pode adicioná-lo posteriormente na aba Documentos.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => (step === 0 ? handleClose(false) : setStep(step - 1))}>
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && hasSubordinates) ||
                (step === 1 && (!date || !motivo))
              }
            >
              Próximo <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Processando..." : "Confirmar Desligamento"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Reactivation Modal ─── */
function ReactivationModal({
  open,
  onOpenChange,
  colaboradorId,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  colaboradorId: string;
  data: any;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [cargo, setCargo] = useState(data?.cargo ?? "");
  const [salario, setSalario] = useState(data?.salario_base?.toString() ?? "");
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = useUpdateColaborador();
  const createHistorico = useCreateHistorico();
  const uploadDoc = useUploadDocumento();
  const { user } = useAuth();

  const colors = getDeptColor(data?.departamento ?? "");
  const initials = getInitials(data?.nome ?? "");

  const reset = () => {
    setStep(0);
    setDate(new Date());
    setCargo(data?.cargo ?? "");
    setSalario(data?.salario_base?.toString() ?? "");
    setContratoFile(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleConfirm = async () => {
    if (!date) return;
    setSubmitting(true);
    try {
      // Upload contract if provided
      if (contratoFile) {
        await uploadDoc.mutateAsync({
          colaboradorId,
          file: contratoFile,
          tipo: "Contrato de Trabalho",
          descricao: "Contrato de reativação",
          dataDocumento: format(date, "yyyy-MM-dd"),
          userId: user?.id,
        });
      }

      // Update status
      const updates: Record<string, any> = {
        id: colaboradorId,
        status: "ativo",
        data_desligamento: null,
        motivo_desligamento: null,
        data_inicio: format(date, "yyyy-MM-dd"),
      };
      if (cargo) updates.cargo = cargo;
      if (salario) updates.salario_base = parseFloat(salario);

      await update.mutateAsync(updates as any);

      // Create historico entry
      await createHistorico.mutateAsync({
        colaborador_id: colaboradorId,
        cargo_anterior: data.cargo,
        cargo_novo: cargo || data.cargo,
        salario_anterior: data.salario_base ? Number(data.salario_base) : null,
        salario_novo: salario ? parseFloat(salario) : null,
        data_mudanca: format(date, "yyyy-MM-dd"),
        motivo: "Reativação de colaborador",
      });

      toast.success("Colaborador reativado com sucesso!");
      handleClose(false);
      onSuccess();
    } catch {
      toast.error("Erro ao reativar colaborador.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              Reativar Colaborador
            </DialogTitle>
            <p className="text-emerald-100 text-xs mt-1">Preencha os dados para reativar</p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {step === 0 && (
            <>
              {/* Confirm */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: `${colors.bg}15`, color: colors.bg }}
                >
                  {data.foto_url ? (
                    <img src={data.foto_url} alt={data.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-base">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{data.nome}</p>
                  <p className="text-xs text-slate-500">{data.cargo} · {data.departamento}</p>
                  <Badge className="mt-1 bg-red-100 text-red-700 border-red-200 text-[10px]">Desligado</Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nova data de início *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2 opacity-50" />
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cargo</label>
                  <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Salário base (R$)</label>
                  <Input type="number" value={salario} onChange={(e) => setSalario(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">Contrato de Trabalho</p>

              {contratoFile ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{contratoFile.name}</p>
                    <p className="text-[11px] text-slate-400">{(contratoFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setContratoFile(null)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Enviar novo Contrato de Trabalho</p>
                  <p className="text-[11px] text-slate-400">PDF, DOC ou imagem (opcional)</p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setContratoFile(f);
                }}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => (step === 0 ? handleClose(false) : setStep(0))}>
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>

          {step === 0 ? (
            <Button size="sm" onClick={() => setStep(1)} disabled={!date}>
              Próximo <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Processando..." : "Confirmar Reativação"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-800 text-xs font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
