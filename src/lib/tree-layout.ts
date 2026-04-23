import { getDeptColor } from "@/lib/deptColors";
import type { Colaborador } from "@/types/organogram";

export type Orientation = "vertical" | "horizontal";

export interface LayoutNode {
  id: string;
  person: Colaborador;
  depth: number;
  parentId: string | null;
  childrenIds: string[];
  leafWidth: number;
  slotCenter: number;
  x: number;
  y: number;
}

export interface LayoutEdge {
  id: string;
  parentId: string;
  childId: string;
  path: string;
  px: number;
  py: number;
  cx: number;
  cy: number;
  dashed: boolean;
  color: string;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  byId: Record<string, LayoutNode>;
  width: number;
  height: number;
}

export interface LayoutOptions {
  orientation: Orientation;
  nodeWidth: number;
  nodeHeight: number;
  hGap: number;
  vGap: number;
  padding: number;
  cornerR: number;
}

export interface TreeFilters {
  showDesligados: boolean;
  searchMatchIds: Set<string> | null;
  collapsed: Set<string>;
}

interface InternalNode {
  id: string;
  person: Colaborador;
  depth: number;
  parentId: string | null;
  childrenIds: string[];
  leafWidth: number;
  slotCenter: number;
}

/**
 * Deterministic tree layout — see notes in connectors-fix doc.
 * Adapted to this project: hierarchy uses `superior` field (not `gestor_id`).
 */
export function layoutTree(
  roots: Colaborador[],
  byIdInput: Map<string, Colaborador>,
  filters: TreeFilters,
  opts: LayoutOptions,
): LayoutResult {
  const { orientation, nodeWidth, nodeHeight, hGap, vGap, padding, cornerR } = opts;

  const internal: Record<string, InternalNode> = {};

  const allColabs = Array.from(byIdInput.values());

  const childrenOf = (id: string): Colaborador[] => {
    return allColabs
      .filter((c) => c.superior === id)
      .filter((c) => filters.showDesligados || c.status !== "desligado")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  };

  // Depth resolution:
  // - Use person.nivel as the visual row when it is greater than parent.depth + 1.
  // - Always enforce a minimum of parent.depth + 1 so a node never appears above
  //   or on the same row as its real superior (keeps connectors readable).
  // - Roots use Math.max(0, person.nivel).
  const build = (
    person: Colaborador,
    parentDepth: number,
    parentId: string | null,
  ): InternalNode => {
    const minDepth = parentId === null ? 0 : parentDepth + 1;
    const requested = typeof person.nivel === "number" ? person.nivel : minDepth;
    const depth = Math.max(minDepth, requested);

    const isCollapsed = filters.collapsed.has(person.id);
    const kids = isCollapsed ? [] : childrenOf(person.id);
    const node: InternalNode = {
      id: person.id,
      person,
      depth,
      parentId,
      childrenIds: kids.map((k) => k.id),
      leafWidth: 0,
      slotCenter: 0,
    };
    internal[person.id] = node;
    for (const k of kids) build(k, depth, person.id);
    return node;
  };

  const rootNodes: InternalNode[] = [];
  const sortedRoots = [...roots].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
  for (const r of sortedRoots) {
    if (!filters.showDesligados && r.status === "desligado") continue;
    rootNodes.push(build(r, -1, null));
  }

  // Search prune: keep only branches with at least one match (and their ancestors)
  if (filters.searchMatchIds) {
    const keep = new Set<string>();
    const markAncestors = (id: string) => {
      let cur: InternalNode | undefined = internal[id];
      while (cur) {
        keep.add(cur.id);
        cur = cur.parentId ? internal[cur.parentId] : undefined;
      }
    };
    for (const id of filters.searchMatchIds) {
      if (internal[id]) markAncestors(id);
    }
    for (const node of Object.values(internal)) {
      node.childrenIds = node.childrenIds.filter((cid) => keep.has(cid));
    }
    for (let i = rootNodes.length - 1; i >= 0; i--) {
      if (!keep.has(rootNodes[i].id)) rootNodes.splice(i, 1);
    }
    for (const k of Object.keys(internal)) {
      if (!keep.has(k)) delete internal[k];
    }
  }

  const computeLeafWidth = (node: InternalNode): number => {
    if (node.childrenIds.length === 0) {
      node.leafWidth = 1;
      return 1;
    }
    let sum = 0;
    for (const cid of node.childrenIds) sum += computeLeafWidth(internal[cid]);
    node.leafWidth = sum;
    return sum;
  };

  for (const r of rootNodes) computeLeafWidth(r);

  const assignSlots = (node: InternalNode, startSlot: number): void => {
    if (node.childrenIds.length === 0) {
      node.slotCenter = startSlot + 0.5;
      return;
    }
    let cursor = startSlot;
    for (const cid of node.childrenIds) {
      const child = internal[cid];
      assignSlots(child, cursor);
      cursor += child.leafWidth;
    }
    const first = internal[node.childrenIds[0]];
    const last = internal[node.childrenIds[node.childrenIds.length - 1]];
    node.slotCenter = (first.slotCenter + last.slotCenter) / 2;
  };

  let cursor = 0;
  for (const r of rootNodes) {
    assignSlots(r, cursor);
    cursor += r.leafWidth;
  }

  const nodes: LayoutNode[] = [];
  const byId: Record<string, LayoutNode> = {};

  const SLOT_PRIMARY =
    orientation === "vertical" ? nodeWidth + hGap : nodeHeight + vGap;
  const DEPTH_STEP =
    orientation === "vertical" ? nodeHeight + vGap : nodeWidth + hGap;

  for (const i of Object.values(internal)) {
    let x: number;
    let y: number;
    if (orientation === "vertical") {
      x = i.slotCenter * SLOT_PRIMARY - nodeWidth / 2;
      y = i.depth * DEPTH_STEP;
    } else {
      x = i.depth * DEPTH_STEP;
      y = i.slotCenter * SLOT_PRIMARY - nodeHeight / 2;
    }
    const ln: LayoutNode = {
      id: i.id,
      person: i.person,
      depth: i.depth,
      parentId: i.parentId,
      childrenIds: i.childrenIds,
      leafWidth: i.leafWidth,
      slotCenter: i.slotCenter,
      x,
      y,
    };
    nodes.push(ln);
    byId[ln.id] = ln;
  }

  if (nodes.length > 0) {
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    for (const n of nodes) {
      n.x = n.x - minX + padding;
      n.y = n.y - minY + padding;
    }
  }

  const edges: LayoutEdge[] = [];
  for (const n of nodes) {
    if (!n.parentId) continue;
    const p = byId[n.parentId];
    if (!p) continue;

    let px: number, py: number, cx: number, cy: number, path: string;
    if (orientation === "vertical") {
      px = p.x + nodeWidth / 2;
      py = p.y + nodeHeight;
      cx = n.x + nodeWidth / 2;
      cy = n.y;
      path = buildVerticalPath(px, py, cx, cy, cornerR);
    } else {
      px = p.x + nodeWidth;
      py = p.y + nodeHeight / 2;
      cx = n.x;
      cy = n.y + nodeHeight / 2;
      path = buildHorizontalPath(px, py, cx, cy, cornerR);
    }

    edges.push({
      id: `${p.id}-${n.id}`,
      parentId: p.id,
      childId: n.id,
      path,
      px,
      py,
      cx,
      cy,
      dashed: n.person.tipo_contrato === "PJ",
      color: getDeptColor(n.person.departamento).bg,
    });
  }

  // Secondary leaders (N:N) — render dashed connections from each extra leader
  // to the colaborador, when both are present in the layout.
  for (const n of nodes) {
    const extras = n.person.lideres_extras ?? [];
    for (const leaderId of extras) {
      const leader = byId[leaderId];
      if (!leader) continue;
      // Skip if it duplicates the primary edge
      if (n.parentId && n.parentId === leaderId) continue;

      let px: number, py: number, cx: number, cy: number, path: string;
      if (orientation === "vertical") {
        // Connect from the side of the leader to the top of the colaborador.
        const leaderRight = leader.x + nodeWidth / 2 < n.x + nodeWidth / 2;
        px = leader.x + (leaderRight ? nodeWidth : 0);
        py = leader.y + nodeHeight / 2;
        cx = n.x + nodeWidth / 2;
        cy = n.y;
        // Simple cubic curve for organic secondary lines
        const dx = cx - px;
        const c1x = px + dx * 0.5;
        const c1y = py;
        const c2x = cx;
        const c2y = (py + cy) / 2;
        path = `M ${px} ${py} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cx} ${cy}`;
      } else {
        const leaderBelow = leader.y + nodeHeight / 2 < n.y + nodeHeight / 2;
        px = leader.x + nodeWidth / 2;
        py = leader.y + (leaderBelow ? nodeHeight : 0);
        cx = n.x;
        cy = n.y + nodeHeight / 2;
        const dy = cy - py;
        const c1x = px;
        const c1y = py + dy * 0.5;
        const c2x = (px + cx) / 2;
        const c2y = cy;
        path = `M ${px} ${py} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cx} ${cy}`;
      }

      edges.push({
        id: `extra-${leader.id}-${n.id}`,
        parentId: leader.id,
        childId: n.id,
        path,
        px,
        py,
        cx,
        cy,
        dashed: true,
        color: getDeptColor(n.person.departamento).bg,
      });
    }
  }

  const width =
    nodes.length === 0
      ? 0
      : Math.max(...nodes.map((n) => n.x + nodeWidth)) + padding;
  const height =
    nodes.length === 0
      ? 0
      : Math.max(...nodes.map((n) => n.y + nodeHeight)) + padding;

  return { nodes, edges, byId, width, height };
}

function buildVerticalPath(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): string {
  const midY = (py + cy) / 2;
  const dx = cx - px;
  const absDx = Math.abs(dx);
  const rr = Math.max(0, Math.min(r, absDx / 2, (cy - py) / 2));
  if (absDx < 0.5) {
    return `M ${px} ${py} L ${cx} ${cy}`;
  }
  const sign = Math.sign(dx);
  return [
    `M ${px} ${py}`,
    `L ${px} ${midY - rr}`,
    `Q ${px} ${midY} ${px + sign * rr} ${midY}`,
    `L ${cx - sign * rr} ${midY}`,
    `Q ${cx} ${midY} ${cx} ${midY + rr}`,
    `L ${cx} ${cy}`,
  ].join(" ");
}

function buildHorizontalPath(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): string {
  const midX = (px + cx) / 2;
  const dy = cy - py;
  const absDy = Math.abs(dy);
  const rr = Math.max(0, Math.min(r, absDy / 2, (cx - px) / 2));
  if (absDy < 0.5) {
    return `M ${px} ${py} L ${cx} ${cy}`;
  }
  const sign = Math.sign(dy);
  return [
    `M ${px} ${py}`,
    `L ${midX - rr} ${py}`,
    `Q ${midX} ${py} ${midX} ${py + sign * rr}`,
    `L ${midX} ${cy - sign * rr}`,
    `Q ${midX} ${cy} ${midX + rr} ${cy}`,
    `L ${cx} ${cy}`,
  ].join(" ");
}
