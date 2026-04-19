import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Download,
  Focus,
  Keyboard,
  List,
  Maximize,
  Minimize,
  Network,
  Rows3,
  Search,
  SquareDashed,
  User,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";
import type { Colaborador } from "@/types/organogram";

export interface CommandPaletteAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradores: Colaborador[];
  departments: string[];
  onSelectPerson: (person: Colaborador) => void;
  onFilterDept: (dept: string | null) => void;
  onFocusBranch: (personId: string) => void;
  actions?: CommandPaletteAction[];
}

export function CommandPalette({
  open,
  onOpenChange,
  colaboradores,
  departments,
  onSelectPerson,
  onFilterDept,
  onFocusBranch,
  actions = [],
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredPeople = useMemo(() => {
    if (!query.trim()) return colaboradores.slice(0, 8);
    const q = query.toLowerCase();
    const scored = colaboradores
      .map((c) => {
        const name = c.nome.toLowerCase();
        const cargo = c.cargo.toLowerCase();
        const dept = c.departamento.toLowerCase();
        let score = 0;
        if (name.startsWith(q)) score += 100;
        else if (name.includes(q)) score += 50;
        if (cargo.includes(q)) score += 20;
        if (dept.includes(q)) score += 10;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.c);
    return scored;
  }, [query, colaboradores]);

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar pessoas, departamentos ou ações…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {filteredPeople.length > 0 && (
          <>
            <CommandGroup heading="Colaboradores">
              {filteredPeople.map((p) => {
                const color = getDeptColor(p.departamento);
                return (
                  <CommandItem
                    key={p.id}
                    value={`${p.nome} ${p.cargo} ${p.departamento}`}
                    onSelect={() => run(() => onSelectPerson(p))}
                    className="gap-2.5"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden"
                      style={{ background: `${color.bg}18`, color: color.bg }}
                    >
                      {p.foto ? (
                        <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(p.nome)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.cargo} · {p.departamento}
                      </p>
                    </div>
                    <CommandShortcut>↵</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {query && filteredPeople.length > 0 && (
          <>
            <CommandGroup heading="Foco na hierarquia">
              {filteredPeople.slice(0, 3).map((p) => (
                <CommandItem
                  key={`focus-${p.id}`}
                  value={`focar em ${p.nome}`}
                  onSelect={() => run(() => onFocusBranch(p.id))}
                >
                  <Focus className="w-4 h-4 mr-2" />
                  <span>Focar em {p.nome} e subordinados</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Departamentos">
          <CommandItem value="todos departamentos" onSelect={() => run(() => onFilterDept(null))}>
            <SquareDashed className="w-4 h-4 mr-2" />
            <span>Mostrar todos os departamentos</span>
          </CommandItem>
          {departments.map((d) => {
            const color = getDeptColor(d);
            return (
              <CommandItem key={d} value={`departamento ${d}`} onSelect={() => run(() => onFilterDept(d))}>
                <span
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: color.bg }}
                />
                Filtrar por {d}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação">
          <CommandItem value="organograma" onSelect={() => run(() => navigate("/"))}>
            <Network className="w-4 h-4 mr-2" /> Organograma
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
          <CommandItem value="dashboard" onSelect={() => run(() => navigate("/dashboard"))}>
            <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem value="colaboradores admin" onSelect={() => run(() => navigate("/admin"))}>
            <Users className="w-4 h-4 mr-2" /> Admin colaboradores
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {actions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ações">
              {actions.map((a) => (
                <CommandItem key={a.id} value={a.label} onSelect={() => run(a.onSelect)}>
                  {a.icon}
                  <span>{a.label}</span>
                  {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Ajuda">
          <CommandItem value="atalhos de teclado" onSelect={() => run(() => {
            // Trigger the help overlay by dispatching a custom event
            window.dispatchEvent(new CustomEvent("bwild:show-shortcuts"));
          })}>
            <Keyboard className="w-4 h-4 mr-2" /> Mostrar atalhos de teclado
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Re-export icons for caller convenience
export {
  BarChart3,
  Download,
  Focus,
  List,
  Maximize,
  Minimize,
  Network,
  Rows3,
  Search,
  User,
  Users,
  ZoomIn,
  ZoomOut,
};