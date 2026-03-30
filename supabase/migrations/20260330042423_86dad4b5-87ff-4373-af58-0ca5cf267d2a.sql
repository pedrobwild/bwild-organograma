
-- Onboarding checklist items per employee
CREATE TABLE public.onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id TEXT NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  data_conclusao DATE,
  data_limite DATE,
  notas TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- RLS: public read, admin write
CREATE POLICY "Anyone can view onboarding" ON public.onboarding_checklist FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert onboarding" ON public.onboarding_checklist FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update onboarding" ON public.onboarding_checklist FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete onboarding" ON public.onboarding_checklist FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_onboarding_checklist_updated_at
  BEFORE UPDATE ON public.onboarding_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-populate default checklist for a new employee
CREATE OR REPLACE FUNCTION public.populate_onboarding_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.onboarding_checklist (colaborador_id, label, ordem) VALUES
    (NEW.id, 'Contrato assinado enviado', 1),
    (NEW.id, 'Documentos pessoais recebidos (RG, CPF, comprovante de residência)', 2),
    (NEW.id, 'Dados bancários cadastrados', 3),
    (NEW.id, 'E-mail corporativo criado', 4),
    (NEW.id, 'Acesso aos sistemas concedido', 5),
    (NEW.id, 'Integração com a equipe realizada', 6),
    (NEW.id, 'Treinamento inicial concluído', 7),
    (NEW.id, 'Benefícios cadastrados (VR, VT, plano de saúde)', 8),
    (NEW.id, 'Foto de perfil adicionada', 9),
    (NEW.id, 'Apresentação para a liderança feita', 10);
  RETURN NEW;
END;
$$;

CREATE TRIGGER populate_onboarding_on_insert
  AFTER INSERT ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.populate_onboarding_checklist();
