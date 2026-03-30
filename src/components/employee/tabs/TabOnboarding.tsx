import { useState, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarIcon,
  Check,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useOnboardingChecklist, useUpdateOnboardingItem, useCreateOnboardingItem, useDeleteOnboardingItem } from "@/hooks/use-onboarding";
import { toast } from "sonner";

interface Props {
  colaboradorId: string;
  isAdmin: boolean;
  dataInicio?: string | null;
}

export function TabOnboarding({ colaboradorId, isAdmin, dataInicio }: Props) {
  const { data: items = [], isLoading } = useOnboardingChecklist(colaboradorId);
  const updateItem = useUpdateOnboardingItem();
  const createItem = useCreateOnboardingItem();
  const deleteItem = useDeleteOnboardingItem();

  const [newLabel, setNewLabel] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const completed = items.filter((i) => i.concluido).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const tenureDays = useMemo(() => {
    if (!dataInicio) return 0;
    return differenceInDays(new Date(), parseISO(dataInicio));
  }, [dataInicio]);

  const handleToggle = async (item: any) => {
    if (!isAdmin) return;
    try {
      await updateItem.mutateAsync({
        id: item.id,
        colaboradorId,
        concluido: !item.concluido,
        data_conclusao: !item.concluido ? format(new Date(), "yyyy-MM-dd") : null,
      });
    } catch {
      toast.error("Erro ao atualizar item.");
    }
  };

  const handleAddItem = async () => {
    if (!newLabel.trim()) return;
    try {
      await createItem.mutateAsync({
        colaborador_id: colaboradorId,
        label: newLabel.trim(),
        ordem: total + 1,
        is_custom: true,
      });
      setNewLabel("");
      toast.success("Item adicionado!");
    } catch {
      toast.error("Erro ao adicionar item.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id, colaboradorId });
    } catch {
      toast.error("Erro ao remover item.");
    }
  };

  const handleSaveNotes = async (item: any) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        colaboradorId,
        notas: notesDraft || null,
      });
      setExpandedNotes(null);
      toast.success("Notas salvas!");
    } catch {
      toast.error("Erro ao salvar notas.");
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Carregando checklist...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Progresso do Onboarding</span>
          <span className="text-xs font-medium text-slate-500">
            {completed}/{total} itens concluídos
          </span>
        </div>
        <Progress value={percent} className="h-2.5" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{percent}% completo</span>
          {percent === 100 && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Onboarding concluído!
            </span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1">
        {items
          .sort((a, b) => a.ordem - b.ordem)
          .map((item) => {
            const isOverdue = !item.concluido && tenureDays > 30;

            return (
              <div key={item.id} className="group">
                <div
                  className={cn(
                    "flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors",
                    item.concluido ? "bg-emerald-50/50" : "hover:bg-slate-50"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={!isAdmin}
                    className={cn(
                      "mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      item.concluido
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 hover:border-slate-400",
                      !isAdmin && "cursor-default"
                    )}
                  >
                    {item.concluido && <Check className="w-3 h-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm",
                          item.concluido
                            ? "line-through text-slate-400"
                            : "text-slate-700 font-medium"
                        )}
                      >
                        {item.label}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Pendente
                        </span>
                      )}
                      {item.is_custom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-semibold">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-0.5">
                      {item.data_conclusao && (
                        <span className="text-[10px] text-emerald-500">
                          Concluído em {format(parseISO(item.data_conclusao), "dd/MM/yyyy")}
                        </span>
                      )}
                      {item.notas && expandedNotes !== item.id && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          📝 {item.notas}
                        </span>
                      )}
                    </div>

                    {/* Expanded notes editor */}
                    {expandedNotes === item.id && isAdmin && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Adicionar notas..."
                          className="h-7 text-xs flex-1"
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveNotes(item)}>
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setExpandedNotes(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setExpandedNotes(expandedNotes === item.id ? null : item.id);
                          setNotesDraft(item.notas ?? "");
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        title="Notas"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      {item.is_custom && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Add custom item */}
      {isAdmin && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Adicionar item personalizado..."
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddItem} disabled={!newLabel.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
