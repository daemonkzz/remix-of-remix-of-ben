-- admin_2fa_status view'ına RLS ekle
ALTER VIEW public.admin_2fa_status SET (security_invoker = true);

-- View üzerinde RLS politikası (view'lar için underlying table'ın RLS'i kullanılır)
-- Ama güvenlik için view'ı yeniden oluşturalım ve sadece kendi kaydını görsün

DROP VIEW IF EXISTS public.admin_2fa_status;

CREATE VIEW public.admin_2fa_status 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  is_provisioned,
  is_blocked,
  failed_attempts,
  last_failed_at,
  created_at,
  updated_at
FROM public.admin_2fa_settings
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- View'a erişim izni
GRANT SELECT ON public.admin_2fa_status TO authenticated;