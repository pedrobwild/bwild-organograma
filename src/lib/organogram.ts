import type { Colaborador } from "@/types/organogram";

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function buildLookupMap(colaboradores: Colaborador[]) {
  const map = new Map<string, Colaborador>();
  colaboradores.forEach((c) => map.set(c.id, c));
  return map;
}

export function computeHighlightPath(
  selected: Colaborador | null,
  byId: Map<string, Colaborador>
): Set<string> {
  if (!selected) return new Set<string>();
  const path = new Set<string>();
  let current: Colaborador | undefined = selected;
  while (current) {
    path.add(current.id);
    current = current.superior ? byId.get(current.superior) : undefined;
  }
  selected.subordinados.forEach((id) => path.add(id));
  return path;
}
