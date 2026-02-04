
-- Remover a política atual de UPDATE para usuários
DROP POLICY IF EXISTS "Usuarios podem atualizar seus feedbacks" ON public.feedbacks_ghas;

-- Criar nova política que permite atualizar (incluindo liberar) seus próprios feedbacks não liberados
-- A condição verifica se o autor é o usuário atual E se o feedback ainda NÃO FOI liberado anteriormente
CREATE POLICY "Usuarios podem atualizar seus feedbacks"
ON public.feedbacks_ghas
FOR UPDATE
TO authenticated
USING (autor_id = current_prestador_id() AND liberado_em IS NULL)
WITH CHECK (autor_id = current_prestador_id());
