
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Colaboradores table
CREATE TABLE public.colaboradores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  funcoes TEXT[] NOT NULL DEFAULT '{}',
  superior_id TEXT REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view colaboradores"
ON public.colaboradores FOR SELECT
USING (true);

CREATE POLICY "Admins can insert colaboradores"
ON public.colaboradores FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update colaboradores"
ON public.colaboradores FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete colaboradores"
ON public.colaboradores FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Department colors table
CREATE TABLE public.department_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL UNIQUE,
  bg TEXT NOT NULL,
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.department_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view department colors"
ON public.department_colors FOR SELECT
USING (true);

CREATE POLICY "Admins can insert department colors"
ON public.department_colors FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update department colors"
ON public.department_colors FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete department colors"
ON public.department_colors FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_colaboradores_updated_at
BEFORE UPDATE ON public.colaboradores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_colors_updated_at
BEFORE UPDATE ON public.department_colors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Admins can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));
