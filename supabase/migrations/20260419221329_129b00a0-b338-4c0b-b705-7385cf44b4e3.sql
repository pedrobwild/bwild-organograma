ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS job_description jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS senioridade text,
  ADD COLUMN IF NOT EXISTS missao text;

CREATE INDEX IF NOT EXISTS idx_colaboradores_job_description
  ON public.colaboradores USING gin (job_description);

COMMENT ON COLUMN public.colaboradores.job_description IS
  'Structured JD: mission, responsibilities, requirements, desired, hardSkills, softSkills, competencies, kpis, notes, updatedAt';
COMMENT ON COLUMN public.colaboradores.senioridade IS
  'Senioridade do cargo (Estagiário..C-Level)';
COMMENT ON COLUMN public.colaboradores.missao IS
  'Resumo da missão do cargo (espelha job_description.mission)';