-- Super_adminlerin tüm admin_2fa_settings kayıtlarını okuyabilmesi için SELECT policy
-- Bu sayede super_admin, başka kullanıcıların totp_secret'ını görebilir ve paylaşabilir

-- Önce mevcut SELECT policy'leri temizle
DROP POLICY IF EXISTS "Users can view own 2fa settings" ON public.admin_2fa_settings;
DROP POLICY IF EXISTS "Super admins can read all 2fa settings" ON public.admin_2fa_settings;

-- Kullanıcılar kendi 2FA ayarlarını görebilir
CREATE POLICY "Users can view own 2fa settings"
ON public.admin_2fa_settings 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Super_adminler TÜM 2FA ayarlarını görebilir (totp_secret dahil)
CREATE POLICY "Super admins can read all 2fa settings"
ON public.admin_2fa_settings 
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
