-- =============================================
-- AŞAMA 5: AUDIT LOG TABLOSU
-- Tüm kritik işlemleri loglar
-- =============================================

-- Audit log tablosu oluştur
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  user_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- RLS etkinleştir
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS politikaları - Sadece adminler görebilir
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit log fonksiyonu
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb := NULL;
  new_data jsonb := NULL;
  record_id text;
  changed text[] := ARRAY[]::text[];
  col text;
BEGIN
  -- Record ID belirleme
  IF TG_OP = 'DELETE' THEN
    record_id := OLD.id::text;
    old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    record_id := NEW.id::text;
    new_data := to_jsonb(NEW);
  ELSE -- UPDATE
    record_id := NEW.id::text;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Değişen alanları bul
    FOR col IN SELECT jsonb_object_keys(new_data)
    LOOP
      IF old_data->col IS DISTINCT FROM new_data->col THEN
        changed := array_append(changed, col);
      END IF;
    END LOOP;
  END IF;
  
  -- Log kaydı oluştur
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    record_id,
    TG_OP,
    old_data,
    new_data,
    NULLIF(changed, ARRAY[]::text[]),
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Kritik tablolara trigger ekle

-- applications tablosu
DROP TRIGGER IF EXISTS audit_applications ON public.applications;
CREATE TRIGGER audit_applications
AFTER INSERT OR UPDATE OR DELETE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();

-- user_roles tablosu
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();

-- profiles tablosu
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();

-- form_templates tablosu
DROP TRIGGER IF EXISTS audit_form_templates ON public.form_templates;
CREATE TRIGGER audit_form_templates
AFTER INSERT OR UPDATE OR DELETE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();

-- admin_2fa_settings tablosu (güvenlik için önemli)
DROP TRIGGER IF EXISTS audit_admin_2fa_settings ON public.admin_2fa_settings;
CREATE TRIGGER audit_admin_2fa_settings
AFTER INSERT OR UPDATE OR DELETE ON public.admin_2fa_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();