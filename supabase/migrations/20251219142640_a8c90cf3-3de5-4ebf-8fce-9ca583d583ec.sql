-- Política para avaliadores excluírem suas próprias avaliações
CREATE POLICY "Avaliadores podem excluir avaliações" 
ON public.avaliacoes_mensais 
FOR DELETE 
USING (avaliador_id IN (
  SELECT id FROM prestadores WHERE user_id = auth.uid()
));

-- Política para Responsável GHAS excluir registros globais
CREATE POLICY "Responsavel GHAS pode excluir registros globais" 
ON public.registros_globais 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM prestadores p WHERE p.user_id = auth.uid() AND p.responsavel_ghas = true
));