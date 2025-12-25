-- =============================================
-- AŞAMA 4: İSTATİSTİK TABLOSU
-- Günlük başvuru istatistiklerini önceden hesaplar
-- =============================================

-- İstatistik tablosu oluştur
CREATE TABLE IF NOT EXISTS public.application_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date date NOT NULL UNIQUE,
  total_applications integer NOT NULL DEFAULT 0,
  pending_count integer NOT NULL DEFAULT 0,
  approved_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  revision_requested_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_application_stats_date ON public.application_stats(stat_date DESC);

-- RLS etkinleştir
ALTER TABLE public.application_stats ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Admins can manage application stats"
ON public.application_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can view application stats"
ON public.application_stats
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION public.update_application_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_date date;
BEGIN
  -- Hangi tarihi güncelleyeceğimizi belirle
  IF TG_OP = 'DELETE' THEN
    target_date := OLD.created_at::date;
  ELSE
    target_date := NEW.created_at::date;
  END IF;
  
  -- İstatistikleri upsert et
  INSERT INTO public.application_stats (stat_date, total_applications, pending_count, approved_count, rejected_count, revision_requested_count)
  SELECT 
    target_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'revision_requested')
  FROM public.applications
  WHERE created_at::date = target_date
  ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_applications = EXCLUDED.total_applications,
    pending_count = EXCLUDED.pending_count,
    approved_count = EXCLUDED.approved_count,
    rejected_count = EXCLUDED.rejected_count,
    revision_requested_count = EXCLUDED.revision_requested_count,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger ekle
DROP TRIGGER IF EXISTS trigger_update_application_stats ON public.applications;
CREATE TRIGGER trigger_update_application_stats
AFTER INSERT OR UPDATE OR DELETE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_application_stats();

-- Mevcut verileri doldur
INSERT INTO public.application_stats (stat_date, total_applications, pending_count, approved_count, rejected_count, revision_requested_count)
SELECT 
  created_at::date as stat_date,
  COUNT(*) as total_applications,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'revision_requested') as revision_requested_count
FROM public.applications
GROUP BY created_at::date
ON CONFLICT (stat_date) DO NOTHING;