-- Adicionar campo de data de liberação na tabela registros_globais
ALTER TABLE public.registros_globais 
ADD COLUMN liberado_em timestamp with time zone DEFAULT NULL;

-- Adicionar campo de data de liberação na tabela feedbacks_ghas
ALTER TABLE public.feedbacks_ghas 
ADD COLUMN liberado_em timestamp with time zone DEFAULT NULL;