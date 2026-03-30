import { useMemo } from "react";
import { User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials, getChildren } from "@/lib/organogram";
import { Colaborador } from "@/types/organogram";

interface OrgListViewProps {
  root: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (person: Colaborador) => void;
  selectedId: string | null;
  showDesligados: boolean;
  searchMatch: Set<string> | null;
}

export function OrgListView({ root, byId, onSelect, selectedId, showDesligados, searchMatch }: OrgListViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <ListItem
        person={root}
        byId={byId}
        onSelect={onSelect}
        selectedId={selectedId}
        depth={0}
        showDesligados={showDesligados}
        searchMatch={searchMatch}
      />
    </div>
  );
}

function ListItem({
  person,
  byId,
  onSelect,
  selectedId,
  depth,
  showDesligados,
  searchMatch,
}: {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onSelect: (p: Colaborador) => void;
  selectedId: string | null;
  depth: number;
  showDesligados: boolean;
  searchMatch: Set<string> | null;
}) {
  const children = useMemo(() => {
    let kids = getChildren(person, byId);
    if (!showDesligados) kids = kids.filter((c) => c.status !== "desligado");
    return kids;
  }, [person, byId, showDesligados]);

  const isSearchActive = searchMatch !== null;
  if (isSearchActive && !searchMatch!.has(person.id)) return null;
  if (!showDesligados && person.status === "desligado") return null;

  const colors = getDeptColor(person.departamento);
  const initials = getInitials(person.nome);
  const isSelected = selectedId === person.id;
  const isDesligado = person.status === "desligado";

  return (
    <div>
      <button
        onClick={() => onSelect(person)}
        className={cn(
          "w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all hover:bg-white/60",
          isSelected && "bg-white shadow-sm ring-1"
        )}
        style={{
          marginLeft: depth * 24,
          ...(isSelected ? { boxShadow: `0 0 0 1px ${colors.bg}44` } : {}),
        }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-full p-[2px]"
          style={{ background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}88)` }}
        >
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
            {person.foto ? (
              <img src={person.foto} alt={person.nome} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold" style={{ color: colors.bg }}>{initials}</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-[6px] h-[6px] rounded-full flex-shrink-0"
              style={{ backgroundColor: isDesligado ? "#ef4444" : "#22c55e" }}
            />
            <span
              className={cn(
                "text-sm font-semibold truncate",
                isDesligado && "line-through opacity-50"
              )}
              style={{ color: "#0f2137" }}
            >
              {person.nome}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{person.cargo} · {person.departamento}</p>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </button>

      {children.map((child) => (
        <ListItem
          key={child.id}
          person={child}
          byId={byId}
          onSelect={onSelect}
          selectedId={selectedId}
          depth={depth + 1}
          showDesligados={showDesligados}
          searchMatch={searchMatch}
        />
      ))}
    </div>
  );
}
