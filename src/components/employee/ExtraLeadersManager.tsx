import { useMemo, useState } from "react";
import { Plus, Users, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Colaborador } from "@/types/organogram";
import { getInitials } from "@/lib/organogram";
import { getDeptColor } from "@/lib/deptColors";
import { useAddLeader, useRemoveLeader } from "@/hooks/use-colaboradores";

interface ExtraLeadersManagerProps {
  person: Colaborador;
  allColaboradores: Colaborador[];
  isAdmin: boolean;
}

export function ExtraLeadersManager({ person, allColaboradores, isAdmin }: ExtraLeadersManagerProps) {
  const [search, setSearch] = useState("");
  const addLeader = useAddLeader();
  const removeLeader = useRemoveLeader();

  const extraIds = person.lideres_extras ?? [];
  const extras = useMemo(
    () => extraIds.map((id) => allColaboradores.find((c) => c.id === id)).filter(Boolean) as Colaborador[],
    [extraIds, allColaboradores],
  );

  // Cannot pick: self, primary leader, descendants, or already-added extras
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
      .filter(
        (c) =>
          c.id !== person.id &&
          c.id !== person.superior &&
          !descendantIds.has(c.id) &&
          !extraIds.includes(c.id) &&
          c.status !== "desligado",
      )
      .filter(
        (c) =>
          !q ||
          c.nome.toLowerCase().includes(q) ||
          c.cargo.toLowerCase().includes(q) ||
          c.departamento.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [allColaboradores, person, descendantIds, extraIds, search]);

  const handleAdd = async (id: string) => {
    try {
      await addLeader.mutateAsync({ colaborador_id: person.id, lider_id: id });
      toast.success("Líder adicional vinculado");
      setSearch("");
    } catch (err: any) {
      toast.error(`Erro ao vincular líder: ${err?.message ?? "desconhecido"}`);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeLeader.mutateAsync({ colaborador_id: person.id, lider_id: id });
      toast.success("Líder adicional removido");
    } catch (err: any) {
      toast.error(`Erro ao remover líder: ${err?.message ?? "desconhecido"}`);
    }
  };

  if (!isAdmin && extras.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Lideranças adicionais</h4>
          <span className="text-[10px] text-muted-foreground">
            ({extras.length})
          </span>
        </div>
        {isAdmin && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />
                Adicionar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 z-[60]" align="end" sideOffset={8}>
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar líder..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                {candidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhum colaborador disponível
                  </p>
                ) : (
                  candidates.map((c) => {
                    const col = getDeptColor(c.departamento);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleAdd(c.id)}
                        disabled={addLeader.isPending}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted text-left transition-colors disabled:opacity-50"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
                          style={{ background: col.bg }}
                        >
                          {c.foto ? (
                            <img src={c.foto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(c.nome)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{c.nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.cargo} · {c.departamento}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {extras.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {isAdmin
            ? "Nenhum líder adicional. Use 'Adicionar' para vincular."
            : "Nenhum líder adicional."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {extras.map((leader) => {
            const col = getDeptColor(leader.departamento);
            return (
              <div
                key={leader.id}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-card border border-border shadow-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                  style={{ background: col.bg }}
                >
                  {leader.foto ? (
                    <img src={leader.foto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(leader.nome)
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-medium text-foreground leading-tight">{leader.nome}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{leader.cargo}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(leader.id)}
                    disabled={removeLeader.isPending}
                    className="ml-1 w-4 h-4 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                    title="Remover líder"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
