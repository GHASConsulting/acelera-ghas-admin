-- Adicionar role admin ao primeiro usuário
INSERT INTO public.user_roles (user_id, role)
VALUES ('aa304416-d795-479b-ae91-5a6d3444fe79', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;