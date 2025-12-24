-- Create admin_2fa_settings table for 2FA management
CREATE TABLE public.admin_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  totp_secret TEXT,
  is_provisioned BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  failed_attempts INTEGER DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_2fa_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all 2FA settings
CREATE POLICY "Admins can manage 2fa settings" 
  ON public.admin_2fa_settings 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own 2FA status (needed for login check)
CREATE POLICY "Users can view own 2fa status" 
  ON public.admin_2fa_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own failed_attempts (for lock screen)
CREATE POLICY "Users can update own 2fa attempts" 
  ON public.admin_2fa_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_admin_2fa_settings_updated_at
  BEFORE UPDATE ON public.admin_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();