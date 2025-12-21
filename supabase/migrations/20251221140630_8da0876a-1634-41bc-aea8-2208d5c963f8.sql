-- Adicionar campo de notificações ao prestador na tabela avaliacoes_mensais
ALTER TABLE public.avaliacoes_mensais 
ADD COLUMN faixa1_notificacoes integer NOT NULL DEFAULT 0;