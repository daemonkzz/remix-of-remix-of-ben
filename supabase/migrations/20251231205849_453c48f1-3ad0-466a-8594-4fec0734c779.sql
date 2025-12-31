-- 1. Super admin kontrol fonksiyonu
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- 2. Admin yetkileri tablosu (dinamik yetkiler)
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  allowed_tabs TEXT[] NOT NULL DEFAULT '{}',
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_applications BOOLEAN NOT NULL DEFAULT false,
  can_manage_forms BOOLEAN NOT NULL DEFAULT false,
  can_manage_updates BOOLEAN NOT NULL DEFAULT false,
  can_manage_rules BOOLEAN NOT NULL DEFAULT false,
  can_manage_gallery BOOLEAN NOT NULL DEFAULT false,
  can_manage_notifications BOOLEAN NOT NULL DEFAULT false,
  can_manage_whiteboard BOOLEAN NOT NULL DEFAULT false,
  can_manage_glossary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Kullanıcı-yetki ilişki tablosu
CREATE TABLE public.user_admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- 4. Profiles tablosuna ban alanları ekle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 5. RLS aktifleştir
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_admin_permissions ENABLE ROW LEVEL SECURITY;

-- 6. admin_permissions için RLS politikaları
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Staff can view permissions"
ON public.admin_permissions
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- 7. user_admin_permissions için RLS politikaları
CREATE POLICY "Super admins can manage user permissions"
ON public.user_admin_permissions
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Staff can view user permissions"
ON public.user_admin_permissions
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can view own permissions"
ON public.user_admin_permissions
FOR SELECT
USING (user_id = auth.uid());

-- 8. Updated_at trigger'ları
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Kullanıcının tüm yetkilerini döndüren fonksiyon
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS SETOF public.admin_permissions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ap.*
  FROM public.admin_permissions ap
  INNER JOIN public.user_admin_permissions uap ON uap.permission_id = ap.id
  WHERE uap.user_id = _user_id
$$;

-- 10. Kullanıcının belirli bir sekmeye erişimi var mı kontrol fonksiyonu
CREATE OR REPLACE FUNCTION public.can_access_tab(_user_id uuid, _tab_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admin her şeye erişebilir
    is_super_admin(_user_id) 
    OR
    -- Kullanıcının yetkilerinden biri bu sekmeyi içeriyor mu
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      INNER JOIN public.user_admin_permissions uap ON uap.permission_id = ap.id
      WHERE uap.user_id = _user_id
        AND _tab_name = ANY(ap.allowed_tabs)
    )
$$;

-- 11. Audit log trigger for ban actions
CREATE OR REPLACE FUNCTION public.log_ban_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_banned IS DISTINCT FROM NEW.is_banned THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_fields,
      user_id
    ) VALUES (
      'profiles',
      NEW.id::text,
      CASE WHEN NEW.is_banned THEN 'BAN' ELSE 'UNBAN' END,
      jsonb_build_object('is_banned', OLD.is_banned, 'ban_reason', OLD.ban_reason),
      jsonb_build_object('is_banned', NEW.is_banned, 'ban_reason', NEW.ban_reason, 'banned_by', NEW.banned_by),
      ARRAY['is_banned', 'banned_at', 'banned_by', 'ban_reason'],
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_profile_ban_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_ban_action();