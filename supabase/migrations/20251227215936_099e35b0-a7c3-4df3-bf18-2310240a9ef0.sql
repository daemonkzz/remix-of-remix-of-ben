-- gallery_images için güvenli view (doğru kolon isimleri ile)
CREATE OR REPLACE VIEW public.gallery_images_public AS
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
  -- uploaded_by KASITLI OLARAK HARİÇ (admin id'lerini gizle)
FROM gallery_images;

GRANT SELECT ON public.gallery_images_public TO authenticated;
GRANT SELECT ON public.gallery_images_public TO anon;