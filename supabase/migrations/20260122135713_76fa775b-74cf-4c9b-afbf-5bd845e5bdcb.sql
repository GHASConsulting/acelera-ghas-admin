-- Permitir que todos os usuários autenticados criem feedbacks (como autor)
CREATE POLICY "Usuarios autenticados podem criar feedbacks"
ON public.feedbacks_ghas
FOR INSERT
TO authenticated
WITH CHECK (autor_id = current_prestador_id());

-- Permitir que autores atualizem seus próprios feedbacks não liberados
CREATE POLICY "Usuarios podem atualizar seus feedbacks"
ON public.feedbacks_ghas
FOR UPDATE
TO authenticated
USING (autor_id = current_prestador_id() AND liberado_em IS NULL);

-- Permitir que autores excluam seus próprios feedbacks não liberados
CREATE POLICY "Usuarios podem excluir seus feedbacks"
ON public.feedbacks_ghas
FOR DELETE
TO authenticated
USING (autor_id = current_prestador_id() AND liberado_em IS NULL);