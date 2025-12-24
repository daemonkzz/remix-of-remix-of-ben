-- Whitelist başvurusu onaylandığında profiles.is_whitelist_approved alanını güncelle
CREATE OR REPLACE FUNCTION public.handle_whitelist_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Sadece whitelist başvuruları için ve status 'approved' olduğunda
  IF NEW.type = 'whitelist' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET is_whitelist_approved = true
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_whitelist_approval ON public.applications;
CREATE TRIGGER on_whitelist_approval
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_whitelist_approval();