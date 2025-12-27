-- gallery_images_public view'ını SECURITY INVOKER ile yeniden oluştur
DROP VIEW IF EXISTS public.gallery_images_public;

CREATE VIEW public.gallery_images_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  file_name,
  file_path,
  url,
  original_size,
  optimized_size,
  width,
  height,
  mime_type,
  created_at
FROM gallery_images;

GRANT SELECT ON public.gallery_images_public TO authenticated;
GRANT SELECT ON public.gallery_images_public TO anon;