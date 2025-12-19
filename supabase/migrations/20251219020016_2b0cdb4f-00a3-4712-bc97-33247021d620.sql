-- Adicionar política para Responsável GHAS poder criar registros globais
CREATE POLICY "Responsavel GHAS pode criar registros globais"
ON public.registros_globais
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.user_id = auth.uid()
      AND p.responsavel_ghas = true
  )
);

-- Adicionar política para Responsável GHAS poder atualizar registros globais
CREATE POLICY "Responsavel GHAS pode atualizar registros globais"
ON public.registros_globais
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.user_id = auth.uid()
      AND p.responsavel_ghas = true
  )
);