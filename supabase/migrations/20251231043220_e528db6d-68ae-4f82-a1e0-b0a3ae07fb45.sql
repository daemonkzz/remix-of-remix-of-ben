-- Application number ve parent application id kolonlarını ekle
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS application_number text UNIQUE,
ADD COLUMN IF NOT EXISTS parent_application_id bigint REFERENCES public.applications(id);

-- Application number için index oluştur
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON public.applications(application_number);
CREATE INDEX IF NOT EXISTS idx_applications_parent_id ON public.applications(parent_application_id);

-- Otomatik application number oluşturucu fonksiyon
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_type text;
  prefix text;
  next_num integer;
  new_app_number text;
BEGIN
  -- Form template'den formType'ı al
  SELECT settings->>'formType' INTO form_type
  FROM public.form_templates
  WHERE id::text = NEW.type;
  
  -- Prefix belirle
  CASE form_type
    WHEN 'whitelist' THEN prefix := 'WL';
    ELSE prefix := 'APP';
  END CASE;
  
  -- Prefix ile başlayan en yüksek numarayı bul
  SELECT COALESCE(MAX(
    CASE 
      WHEN application_number ~ ('^' || prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(application_number FROM (prefix || '-([0-9]+)$')) AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO next_num
  FROM public.applications
  WHERE application_number LIKE (prefix || '-%');
  
  -- Yeni application number oluştur
  new_app_number := prefix || '-' || LPAD(next_num::text, 5, '0');
  
  NEW.application_number := new_app_number;
  RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_generate_application_number ON public.applications;
CREATE TRIGGER trigger_generate_application_number
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  WHEN (NEW.application_number IS NULL)
  EXECUTE FUNCTION public.generate_application_number();

-- Mevcut başvurulara application number ata
DO $$
DECLARE
  app_record RECORD;
  form_type text;
  prefix text;
  counter integer := 0;
  wl_counter integer := 0;
  app_counter integer := 0;
BEGIN
  FOR app_record IN 
    SELECT a.id, a.type 
    FROM public.applications a 
    WHERE a.application_number IS NULL 
    ORDER BY a.created_at ASC
  LOOP
    -- Form type'ı al
    SELECT settings->>'formType' INTO form_type
    FROM public.form_templates
    WHERE id::text = app_record.type;
    
    -- Prefix ve counter belirle
    IF form_type = 'whitelist' THEN
      wl_counter := wl_counter + 1;
      prefix := 'WL';
      counter := wl_counter;
    ELSE
      app_counter := app_counter + 1;
      prefix := 'APP';
      counter := app_counter;
    END IF;
    
    -- Güncelle
    UPDATE public.applications 
    SET application_number = prefix || '-' || LPAD(counter::text, 5, '0')
    WHERE id = app_record.id;
  END LOOP;
END;
$$;