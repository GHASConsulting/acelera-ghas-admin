-- Adicionar campo de data de liberação na tabela avaliacoes_mensais
ALTER TABLE public.avaliacoes_mensais 
ADD COLUMN liberado_em timestamp with time zone DEFAULT NULL;