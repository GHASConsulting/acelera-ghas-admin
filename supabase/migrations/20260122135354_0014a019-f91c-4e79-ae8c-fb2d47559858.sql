-- Permitir que todos os usuários autenticados vejam a lista de prestadores
-- Isso é necessário para selecionar destinatários no feedback-ghas
CREATE POLICY "Usuários autenticados podem ver todos prestadores"
ON public.prestadores
FOR SELECT
TO authenticated
USING (true);