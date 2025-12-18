-- Fix: evitar recursão infinita em policy que consulta a própria tabela prestadores

-- Função SECURITY DEFINER para obter o prestador.id do usuário autenticado
CREATE OR REPLACE FUNCTION public.current_prestador_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.prestadores p
  WHERE p.user_id = auth.uid()
  LIMIT 1
$$;

-- Recriar policy de avaliadores sem subquery na própria tabela (evita erro 42P17)
DROP POLICY IF EXISTS "Avaliadores podem ver seus avaliados" ON prestadores;

CREATE POLICY "Avaliadores podem ver seus avaliados"
ON prestadores
FOR SELECT
TO authenticated
USING (avaliador_id = public.current_prestador_id());
