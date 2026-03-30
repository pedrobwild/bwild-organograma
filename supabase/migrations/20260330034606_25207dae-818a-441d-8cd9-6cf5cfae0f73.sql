
-- 1. Add columns to colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN data_inicio date,
  ADD COLUMN data_desligamento date,
  ADD COLUMN motivo_desligamento text,
  ADD COLUMN tipo_contrato text,
  ADD COLUMN salario_base numeric(12,2),
  ADD COLUMN carga_horaria text,
  ADD COLUMN email_corporativo text,
  ADD COLUMN email_pessoal text,
  ADD COLUMN telefone text,
  ADD COLUMN cpf text,
  ADD COLUMN data_nascimento date,
  ADD COLUMN endereco text,
  ADD COLUMN cidade text,
  ADD COLUMN estado text,
  ADD COLUMN cep text,
  ADD COLUMN banco text,
  ADD COLUMN agencia text,
  ADD COLUMN conta text,
  ADD COLUMN tipo_conta text,
  ADD COLUMN chave_pix text,
  ADD COLUMN observacoes text;

-- Status validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_colaborador_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('ativo', 'desligado') THEN
    RAISE EXCEPTION 'status must be ativo or desligado';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_colaborador_status
  BEFORE INSERT OR UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.validate_colaborador_status();

-- Add updated_at trigger to colaboradores (if not exists)
CREATE OR REPLACE TRIGGER trg_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. beneficios_colaborador
CREATE TABLE public.beneficios_colaborador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id text NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  valor numeric(12,2),
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.beneficios_colaborador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view beneficios" ON public.beneficios_colaborador
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert beneficios" ON public.beneficios_colaborador
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update beneficios" ON public.beneficios_colaborador
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete beneficios" ON public.beneficios_colaborador
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. politicas_comissao
CREATE TABLE public.politicas_comissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id text NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  percentual numeric(5,2),
  base_calculo text,
  meta_mensal numeric(12,2),
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.politicas_comissao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comissoes" ON public.politicas_comissao
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert comissoes" ON public.politicas_comissao
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update comissoes" ON public.politicas_comissao
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete comissoes" ON public.politicas_comissao
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_politicas_comissao_updated_at
  BEFORE UPDATE ON public.politicas_comissao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. politicas_veiculo
CREATE TABLE public.politicas_veiculo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id text NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tem_direito boolean DEFAULT false,
  tipo text,
  valor_km numeric(6,3),
  teto_mensal numeric(12,2),
  placa_veiculo text,
  modelo_veiculo text,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.politicas_veiculo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view veiculos" ON public.politicas_veiculo
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert veiculos" ON public.politicas_veiculo
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update veiculos" ON public.politicas_veiculo
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete veiculos" ON public.politicas_veiculo
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. documentos_colaborador
CREATE TABLE public.documentos_colaborador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id text NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  tamanho_bytes integer,
  mime_type text,
  descricao text,
  data_documento date,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documentos_colaborador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documentos" ON public.documentos_colaborador
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert documentos" ON public.documentos_colaborador
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update documentos" ON public.documentos_colaborador
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete documentos" ON public.documentos_colaborador
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. historico_cargos
CREATE TABLE public.historico_cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id text NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  cargo_anterior text,
  cargo_novo text NOT NULL,
  salario_anterior numeric(12,2),
  salario_novo numeric(12,2),
  data_mudanca date NOT NULL,
  motivo text,
  aprovado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.historico_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view historico" ON public.historico_cargos
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert historico" ON public.historico_cargos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update historico" ON public.historico_cargos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete historico" ON public.historico_cargos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. Storage bucket for documentos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false);

-- Storage RLS policies
CREATE POLICY "Admins can upload documentos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documentos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read documentos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');
