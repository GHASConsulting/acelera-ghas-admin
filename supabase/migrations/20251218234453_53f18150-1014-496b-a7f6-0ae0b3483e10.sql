-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Admins podem ver todos prestadores" ON prestadores;
DROP POLICY IF EXISTS "Avaliadores podem ver seus avaliados" ON prestadores;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON prestadores;
DROP POLICY IF EXISTS "Admins podem inserir prestadores" ON prestadores;
DROP POLICY IF EXISTS "Admins podem atualizar prestadores" ON prestadores;

-- Recriar políticas como PERMISSIVE (padrão)
CREATE POLICY "Admins podem ver todos prestadores"
ON prestadores
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Avaliadores podem ver seus avaliados"
ON prestadores
FOR SELECT
TO authenticated
USING (avaliador_id IN (
  SELECT id FROM prestadores WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem ver próprio perfil"
ON prestadores
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins podem inserir prestadores"
ON prestadores
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar prestadores"
ON prestadores
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));