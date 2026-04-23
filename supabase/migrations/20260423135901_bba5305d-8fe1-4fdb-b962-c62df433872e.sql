CREATE TABLE IF NOT EXISTS public.colaborador_lideres (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id text NOT NULL,
  lider_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (colaborador_id, lider_id),
  CHECK (colaborador_id <> lider_id)
);

CREATE INDEX IF NOT EXISTS idx_colaborador_lideres_colaborador ON public.colaborador_lideres(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_lideres_lider ON public.colaborador_lideres(lider_id);

ALTER TABLE public.colaborador_lideres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view colaborador_lideres"
ON public.colaborador_lideres FOR SELECT
USING (true);

CREATE POLICY "Admins can insert colaborador_lideres"
ON public.colaborador_lideres FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update colaborador_lideres"
ON public.colaborador_lideres FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete colaborador_lideres"
ON public.colaborador_lideres FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));