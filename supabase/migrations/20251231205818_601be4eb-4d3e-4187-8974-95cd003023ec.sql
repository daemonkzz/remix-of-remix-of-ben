-- 1. super_admin rolünü ekle
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';