-- Adicionar campos de controle de senha na tabela prestadores
ALTER TABLE public.prestadores 
ADD COLUMN senha_alterada_em timestamp with time zone DEFAULT NULL;

-- A data de criação já existe (criado_em), vamos usar ela como referência
-- Se senha_alterada_em for NULL, significa que é primeiro acesso e precisa alterar a senha