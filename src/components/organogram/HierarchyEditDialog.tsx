import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, GitBranch, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Colaborador } from "@/types/organogram";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { toast } from "sonner";

interface HierarchyEditDialogProps {
  person: Colaborador;
  allColaboradores: Colaborador[];
  onClose: () => void;
}

export function HierarchyEditDialog({ person, allColaboradores, onClose }: HierarchyEditDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedSuperior, setSelectedSuperior] = useState<string | null>(person.superior);
  const updateColaborador = useUpdateColaborador();

  // Get all descendants to prevent circular references
  const descendantIds = useMemo(() => {
    const ids = new Set<string>();
    const queue = [person.id];
    while (queue.length) {
      const curr = queue.shift()!;
      ids.add(curr);
      const node = allColaboradores.find((c) => c.id === curr);
      if (node) queue.push(...node.subordinados);
    }
    return ids;
  }, [person, allColaboradores]);

  const candidates = useMemo(() => {
    const q = search.toLowerCase();
    return allColaboradores
      .filter((c) => c.id !== person.id && !descendantIds.has(c.id) && c.status !== "desligado")
      .filter((c) => !q || c.nome.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q) || c.departamento.toLowerCase().includes(q));
  }, [allColaboradores, person, descendantIds, search]);

  const currentSuperior = allColaboradores.find((c) => c.id === person.superior);
  const newSuperior = selectedSuperior ? allColaboradores.find((c) => c.id === selectedSuperior) : null;
  const hasChanged = selectedSuperior !== person.superior;

  const handleSave = async () => {
    try {
      await updateColaborador.mutateAsync({
        id: person.id,
        superior_id: selectedSuperior,
        nivel: newSuperior ? newSuperior.nivel + 1 : 0,
      });
      toast.success(`Hierarquia de ${person.nome} atualizada com sucesso`);
      onClose();
    } catch {
      toast.error("Erro ao atualizar hierarquia");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(5,15,30,0.6)", backdropFilter: "blur(4px)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">Editar Hierarquia</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Alterar superior de {person.nome}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Current → New preview */}
        <div className="px-6 py-4 bg-muted/30 flex items-center justify-center gap-3">
          <MiniCard person={currentSuperior ?? null} label="Superior atual" />
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <MiniCard
            person={hasChanged ? (newSuperior ?? null) : (currentSuperior ?? null)}
            label={hasChanged ? "Novo superior" : "Superior atual"}
            highlight={hasChanged}
          />
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar colaborador..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Candidate list */}
        <div className="px-6 pb-2 max-h-[240px] overflow-y-auto">
          {/* Option: no superior (root) */}
          <button
            onClick={() => setSelectedSuperior(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-1 ${
              selectedSuperior === null
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted/50 border border-transparent"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sem superior (raiz)</p>
              <p className="text-[10px] text-muted-foreground">Nível 0 da hierarquia</p>
            </div>
          </button>

          {candidates.map((c) => {
            const col = getDeptColor(c.departamento);
            const isActive = selectedSuperior === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedSuperior(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-1 ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{ background: `${col.bg}18`, color: col.bg }}
                >
                  {c.foto ? (
                    <img src={c.foto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(c.nome)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.cargo} · {c.departamento}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">Nível {c.nivel}</span>
              </button>
            );
          })}

          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador encontrado</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" disabled={!hasChanged || updateColaborador.isPending} onClick={handleSave}>
            {updateColaborador.isPending ? "Salvando..." : "Salvar alteração"}
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function MiniCard({ person, label, highlight }: { person: Colaborador | null; label: string; highlight?: boolean }) {
  if (!person) {
    return (
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
        <p className="text-xs font-medium text-foreground">Raiz</p>
      </div>
    );
  }

  const col = getDeptColor(person.departamento);
  return (
    <div className={`text-center ${highlight ? "ring-2 ring-primary/30 rounded-xl p-2" : "p-2"}`}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-xs font-bold overflow-hidden"
        style={{ background: `${col.bg}18`, color: col.bg }}
      >
        {person.foto ? (
          <img src={person.foto} alt="" className="w-full h-full object-cover" />
        ) : (
          getInitials(person.nome)
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      <p className="text-xs font-medium text-foreground truncate max-w-[100px]">{person.nome}</p>
    </div>
  );
}
