-- Adicionar colunas de feedback na tabela avaliacoes_mensais
ALTER TABLE public.avaliacoes_mensais
ADD COLUMN feedback_comecar_fazer TEXT,
ADD COLUMN feedback_continuar_fazer TEXT,
ADD COLUMN feedback_parar_fazer TEXT;