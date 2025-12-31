-- =====================================================
-- YETKİ SİSTEMİ BASİTLEŞTİRME
-- super_admin + admin_permissions sistemine geçiş
-- =====================================================

-- 1. Yeni yardımcı fonksiyon: Kullanıcının herhangi bir admin yetkisi var mı?
CREATE OR REPLACE FUNCTION public.has_any_admin_permission(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_super_admin(_user_id) 
    OR 
    EXISTS (
      SELECT 1
      FROM public.user_admin_permissions uap
      WHERE uap.user_id = _user_id
    )
$$;

-- 2. Belirli bir yönetim yetkisi var mı kontrol fonksiyonu
CREATE OR REPLACE FUNCTION public.can_manage(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_super_admin(_user_id) 
    OR 
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      INNER JOIN public.user_admin_permissions uap ON uap.permission_id = ap.id
      WHERE uap.user_id = _user_id
        AND (
          (_feature = 'users' AND ap.can_manage_users = true) OR
          (_feature = 'applications' AND ap.can_manage_applications = true) OR
          (_feature = 'forms' AND ap.can_manage_forms = true) OR
          (_feature = 'updates' AND ap.can_manage_updates = true) OR
          (_feature = 'rules' AND ap.can_manage_rules = true) OR
          (_feature = 'gallery' AND ap.can_manage_gallery = true) OR
          (_feature = 'notifications' AND ap.can_manage_notifications = true) OR
          (_feature = 'whiteboard' AND ap.can_manage_whiteboard = true) OR
          (_feature = 'glossary' AND ap.can_manage_glossary = true)
        )
    )
$$;

-- =====================================================
-- RLS POLİTİKALARINI GÜNCELLE
-- has_role('admin') ve has_role('moderator') yerine
-- has_any_admin_permission() veya can_manage() kullan
-- =====================================================

-- APPLICATIONS tablosu
DROP POLICY IF EXISTS "Staff can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can update applications" ON public.applications;

CREATE POLICY "Staff can view all applications" 
ON public.applications 
FOR SELECT 
USING (
  is_super_admin(auth.uid()) OR 
  can_manage(auth.uid(), 'applications')
);

CREATE POLICY "Staff can update applications" 
ON public.applications 
FOR UPDATE 
USING (
  is_super_admin(auth.uid()) OR 
  can_manage(auth.uid(), 'applications')
);

-- PROFILES tablosu
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;

CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
USING (has_any_admin_permission(auth.uid()));

-- Staff can update profiles for banning
DROP POLICY IF EXISTS "Staff can update profiles" ON public.profiles;
CREATE POLICY "Staff can update profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR 
  is_super_admin(auth.uid()) OR 
  can_manage(auth.uid(), 'users')
);

-- UPDATES tablosu
DROP POLICY IF EXISTS "Admins can view all updates" ON public.updates;
DROP POLICY IF EXISTS "Admins can insert updates" ON public.updates;
DROP POLICY IF EXISTS "Admins can update updates" ON public.updates;
DROP POLICY IF EXISTS "Admins can delete updates" ON public.updates;

CREATE POLICY "Staff can view all updates"
ON public.updates
FOR SELECT
USING (is_published = true OR is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

CREATE POLICY "Staff can insert updates"
ON public.updates
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

CREATE POLICY "Staff can update updates"
ON public.updates
FOR UPDATE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

CREATE POLICY "Staff can delete updates"
ON public.updates
FOR DELETE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

-- RULES tablosu
DROP POLICY IF EXISTS "Admins can insert rules" ON public.rules;
DROP POLICY IF EXISTS "Admins can update rules" ON public.rules;
DROP POLICY IF EXISTS "Admins can delete rules" ON public.rules;

CREATE POLICY "Staff can insert rules"
ON public.rules
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'rules'));

CREATE POLICY "Staff can update rules"
ON public.rules
FOR UPDATE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'rules'));

CREATE POLICY "Staff can delete rules"
ON public.rules
FOR DELETE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'rules'));

-- ADMIN_PERMISSIONS tablosu
DROP POLICY IF EXISTS "Staff can view permissions" ON public.admin_permissions;

CREATE POLICY "Staff can view permissions"
ON public.admin_permissions
FOR SELECT
USING (has_any_admin_permission(auth.uid()));

-- ADMIN_2FA_SETTINGS tablosu
DROP POLICY IF EXISTS "Admins can insert 2fa settings" ON public.admin_2fa_settings;
DROP POLICY IF EXISTS "Admins can update 2fa settings" ON public.admin_2fa_settings;
DROP POLICY IF EXISTS "Admins can delete 2fa settings" ON public.admin_2fa_settings;

CREATE POLICY "Super admins can insert 2fa settings" 
ON admin_2fa_settings 
FOR INSERT 
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update 2fa settings" 
ON admin_2fa_settings 
FOR UPDATE 
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete 2fa settings" 
ON admin_2fa_settings 
FOR DELETE 
TO authenticated
USING (is_super_admin(auth.uid()));

-- APPLICATION_STATS tablosu
DROP POLICY IF EXISTS "Admins can manage application stats" ON public.application_stats;
DROP POLICY IF EXISTS "Moderators can view application stats" ON public.application_stats;

CREATE POLICY "Staff can manage application stats"
ON public.application_stats
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'applications'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'applications'));

-- FORM_TEMPLATES tablosu  
DROP POLICY IF EXISTS "Admins can manage form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Moderators can view form templates" ON public.form_templates;

CREATE POLICY "Staff can manage form templates"
ON public.form_templates
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'forms'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'forms'));

CREATE POLICY "Staff can view form templates"
ON public.form_templates
FOR SELECT
USING (has_any_admin_permission(auth.uid()));

-- GALLERY_IMAGES tablosu
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;

CREATE POLICY "Staff can manage gallery images"
ON public.gallery_images
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'gallery'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'gallery'));

-- GLOSSARY_TERMS tablosu
DROP POLICY IF EXISTS "Admins can manage glossary terms" ON public.glossary_terms;

CREATE POLICY "Staff can manage glossary terms"
ON public.glossary_terms
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'glossary'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'glossary'));

-- NOTIFICATIONS tablosu
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Staff can manage notifications"
ON public.notifications
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'notifications'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'notifications'));

-- NOTIFICATION_RECIPIENTS tablosu
DROP POLICY IF EXISTS "Admins can manage notification recipients" ON public.notification_recipients;

CREATE POLICY "Staff can manage notification recipients"
ON public.notification_recipients
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'notifications'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'notifications'));

-- WHITEBOARDS tablosu
DROP POLICY IF EXISTS "Admins can manage whiteboards" ON public.whiteboards;

CREATE POLICY "Staff can manage whiteboards"
ON public.whiteboards
FOR ALL
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'whiteboard'))
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'whiteboard'));

-- ANNOUNCEMENTS tablosu
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Staff can insert announcements"
ON public.announcements
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

CREATE POLICY "Staff can update announcements"
ON public.announcements
FOR UPDATE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

CREATE POLICY "Staff can delete announcements"
ON public.announcements
FOR DELETE
USING (is_super_admin(auth.uid()) OR can_manage(auth.uid(), 'updates'));

-- USER_ROLES tablosu (sadece super_admin yönetebilir)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
USING (is_super_admin(auth.uid()));

-- AUDIT_LOGS tablosu
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_super_admin(auth.uid()));