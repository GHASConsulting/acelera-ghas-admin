-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'avaliador', 'prestador');

-- Enum para situação
CREATE TYPE public.situacao_type AS ENUM ('ativo', 'inativo');

-- Tabela principal: prestadores (unifica profiles)
CREATE TABLE public.prestadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  situacao situacao_type NOT NULL DEFAULT 'ativo',
  avaliador_id UUID REFERENCES public.prestadores(id),
  salario_fixo NUMERIC(10,2) NOT NULL DEFAULT 0,
  responsavel_ghas BOOLEAN NOT NULL DEFAULT false,
  data_inicio_prestacao DATE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela registros_globais
CREATE TABLE public.registros_globais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes TEXT NOT NULL,
  registrado_por_id UUID REFERENCES public.prestadores(id) NOT NULL,
  faixa4_nps_global NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa4_churn NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa4_uso_ava NUMERIC(5,2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (mes)
);

-- Tabela avaliacoes_mensais
CREATE TABLE public.avaliacoes_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID REFERENCES public.prestadores(id) ON DELETE CASCADE NOT NULL,
  avaliador_id UUID REFERENCES public.prestadores(id) NOT NULL,
  mes TEXT NOT NULL,
  
  -- Faixa 1 - Elegibilidade
  faixa1_ausencias INTEGER NOT NULL DEFAULT 0,
  faixa1_pendencias INTEGER NOT NULL DEFAULT 0,
  
  -- Faixa 2 - Produtividade Individual
  faixa2_produtividade NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa2_qualidade NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa2_chave_comportamento NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa2_chave_habilidades NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa2_chave_atitudes NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa2_chave_valores NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Faixa 3 - Resultado com Cliente e Time
  faixa3_nps_projeto NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa3_sla NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa3_backlog NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa3_prioridades NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Faixa 4 - Resultado Empresa
  faixa4_nps_global NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa4_churn NUMERIC(5,2) NOT NULL DEFAULT 0,
  faixa4_uso_ava NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (prestador_id, mes)
);

-- Habilitar RLS
ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_mensais ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER update_prestadores_updated_at
  BEFORE UPDATE ON public.prestadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registros_globais_updated_at
  BEFORE UPDATE ON public.registros_globais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avaliacoes_mensais_updated_at
  BEFORE UPDATE ON public.avaliacoes_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar prestador ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.prestadores (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'prestador');
  
  RETURN NEW;
END;
$$;

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies para prestadores
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.prestadores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todos prestadores"
  ON public.prestadores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Avaliadores podem ver seus avaliados"
  ON public.prestadores FOR SELECT
  TO authenticated
  USING (avaliador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins podem inserir prestadores"
  ON public.prestadores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar prestadores"
  ON public.prestadores FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para user_roles
CREATE POLICY "Usuários podem ver próprios roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para registros_globais
CREATE POLICY "Usuários autenticados podem ver registros globais"
  ON public.registros_globais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar registros globais"
  ON public.registros_globais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para avaliacoes_mensais
CREATE POLICY "Prestadores podem ver próprias avaliações"
  ON public.avaliacoes_mensais FOR SELECT
  TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Avaliadores podem ver avaliações de seus avaliados"
  ON public.avaliacoes_mensais FOR SELECT
  TO authenticated
  USING (avaliador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Avaliadores podem criar avaliações"
  ON public.avaliacoes_mensais FOR INSERT
  TO authenticated
  WITH CHECK (avaliador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Avaliadores podem atualizar avaliações"
  ON public.avaliacoes_mensais FOR UPDATE
  TO authenticated
  USING (avaliador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins podem gerenciar todas avaliações"
  ON public.avaliacoes_mensais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));