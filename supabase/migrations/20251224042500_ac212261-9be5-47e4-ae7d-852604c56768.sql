-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  original_size INTEGER NOT NULL,
  optimized_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  mime_type TEXT DEFAULT 'image/webp',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage gallery images"
  ON public.gallery_images
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view gallery images"
  ON public.gallery_images
  FOR SELECT
  USING (true);

-- Create gallery storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gallery files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));