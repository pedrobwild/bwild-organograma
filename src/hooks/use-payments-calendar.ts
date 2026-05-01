import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentKind = "salario" | "beneficio" | "comissao";

export interface PaymentEntry {
  id: string;
  kind: PaymentKind;
  day: number;
  colaboradorId: string;
  colaboradorNome: string;
  departamento: string;
  label: string;
  valor: number | null;
}

export interface PaymentsCalendarData {
  byDay: Map<number, PaymentEntry[]>;
  totalsByDay: Map<number, { salario: number; beneficio: number; comissao: number; total: number }>;
  monthTotals: { salario: number; beneficio: number; comissao: number; total: number };
  entries: PaymentEntry[];
}

/**
 * Aggregates configured payment days across colaboradores, benefícios, and
 * comissões into a single month-agnostic calendar (days 1-31).
 *
 * Only includes entries where:
 *  - colaborador is `ativo`
 *  - benefício/comissão is `ativo` (or null, treated as active)
 *  - a `dia_pagamento` (or `dia_pagamento_1`/`dia_pagamento_2`) is set
 */
export function usePaymentsCalendar() {
  return useQuery({
    queryKey: ["payments_calendar"],
    queryFn: async (): Promise<PaymentsCalendarData> => {
      const [colabRes, benRes, comRes] = await Promise.all([
        supabase
          .from("colaboradores")
          .select("id, nome, departamento, status, salario_base, dia_pagamento_1, dia_pagamento_2"),
        supabase
          .from("beneficios_colaborador")
          .select("id, colaborador_id, tipo, valor, ativo, dia_pagamento"),
        supabase
          .from("politicas_comissao")
          .select("id, colaborador_id, descricao, meta_mensal, ativo, dia_pagamento"),
      ]);

      if (colabRes.error) throw colabRes.error;
      if (benRes.error) throw benRes.error;
      if (comRes.error) throw comRes.error;

      const colabMap = new Map<string, { nome: string; departamento: string; status: string }>();
      for (const c of colabRes.data ?? []) {
        colabMap.set(c.id, { nome: c.nome, departamento: c.departamento, status: c.status });
      }

      const entries: PaymentEntry[] = [];

      // Salário (split em até 2 dias com valor proporcional)
      for (const c of colabRes.data ?? []) {
        if (c.status !== "ativo") continue;
        const days = [c.dia_pagamento_1, c.dia_pagamento_2].filter(
          (d): d is number => typeof d === "number" && d >= 1 && d <= 31,
        );
        if (days.length === 0) continue;
        const totalSalario = c.salario_base ?? 0;
        const split = days.length > 0 ? totalSalario / days.length : 0;
        for (const day of days) {
          entries.push({
            id: `sal-${c.id}-${day}`,
            kind: "salario",
            day,
            colaboradorId: c.id,
            colaboradorNome: c.nome,
            departamento: c.departamento,
            label: days.length === 2 ? "Salário (parcela)" : "Salário",
            valor: c.salario_base != null ? split : null,
          });
        }
      }

      // Benefícios
      for (const b of benRes.data ?? []) {
        if (b.ativo === false) continue;
        if (typeof b.dia_pagamento !== "number" || b.dia_pagamento < 1 || b.dia_pagamento > 31) continue;
        const colab = colabMap.get(b.colaborador_id);
        if (!colab || colab.status !== "ativo") continue;
        entries.push({
          id: `ben-${b.id}`,
          kind: "beneficio",
          day: b.dia_pagamento,
          colaboradorId: b.colaborador_id,
          colaboradorNome: colab.nome,
          departamento: colab.departamento,
          label: b.tipo,
          valor: b.valor,
        });
      }

      // Comissões (usa meta_mensal como referência de valor estimado)
      for (const com of comRes.data ?? []) {
        if (com.ativo === false) continue;
        if (typeof com.dia_pagamento !== "number" || com.dia_pagamento < 1 || com.dia_pagamento > 31) continue;
        const colab = colabMap.get(com.colaborador_id);
        if (!colab || colab.status !== "ativo") continue;
        entries.push({
          id: `com-${com.id}`,
          kind: "comissao",
          day: com.dia_pagamento,
          colaboradorId: com.colaborador_id,
          colaboradorNome: colab.nome,
          departamento: colab.departamento,
          label: com.descricao,
          valor: com.meta_mensal,
        });
      }

      const byDay = new Map<number, PaymentEntry[]>();
      const totalsByDay = new Map<
        number,
        { salario: number; beneficio: number; comissao: number; total: number }
      >();
      const monthTotals = { salario: 0, beneficio: 0, comissao: 0, total: 0 };

      for (const e of entries) {
        const arr = byDay.get(e.day) ?? [];
        arr.push(e);
        byDay.set(e.day, arr);

        const t = totalsByDay.get(e.day) ?? { salario: 0, beneficio: 0, comissao: 0, total: 0 };
        const v = e.valor ?? 0;
        t[e.kind] += v;
        t.total += v;
        totalsByDay.set(e.day, t);

        monthTotals[e.kind] += v;
        monthTotals.total += v;
      }

      // Sort entries within each day by kind then name
      const kindOrder: Record<PaymentKind, number> = { salario: 0, beneficio: 1, comissao: 2 };
      for (const arr of byDay.values()) {
        arr.sort((a, b) => {
          if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
          return a.colaboradorNome.localeCompare(b.colaboradorNome, "pt-BR");
        });
      }

      return { byDay, totalsByDay, monthTotals, entries };
    },
  });
}
