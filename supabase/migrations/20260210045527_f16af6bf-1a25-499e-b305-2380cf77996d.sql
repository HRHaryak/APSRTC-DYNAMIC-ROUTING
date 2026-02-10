-- Add unique constraint for user_id + role to support upsert
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);