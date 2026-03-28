import { Colaborador } from "@/types/organogram";

export function buildByIdMap(colaboradores: Colaborador[]) {
  return new Map(colaboradores.map((colaborador) => [colaborador.id, colaborador]));
}

export function getRootNode(colaboradores: Colaborador[]) {
  return colaboradores.find((colaborador) => colaborador.nivel === 0) ?? null;
}

export function getDepartments(colaboradores: Colaborador[]) {
  return [...new Set(colaboradores.map((colaborador) => colaborador.departamento))];
}

export function getChildren(
  colaborador: Colaborador,
  byId: Map<string, Colaborador>
) {
  return colaborador.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];
}

export function getHighlightPath(
  selectedPerson: Colaborador | null,
  byId: Map<string, Colaborador>
) {
  if (!selectedPerson) return new Set<string>();

  const path = new Set<string>();
  let current: Colaborador | undefined = selectedPerson;

  while (current) {
    path.add(current.id);
    current = current.superior ? byId.get(current.superior) : undefined;
  }

  selectedPerson.subordinados.forEach((id) => path.add(id));

  return path;
}

export function getInitials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
