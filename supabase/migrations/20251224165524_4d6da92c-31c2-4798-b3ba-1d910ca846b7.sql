-- Create whiteboards table for live map feature
CREATE TABLE public.whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Ana Harita',
  scene_data jsonb NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Realtime for this table
ALTER TABLE public.whiteboards REPLICA IDENTITY FULL;

-- Enable Row Level Security
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view whiteboards (for public LiveMap page)
CREATE POLICY "Anyone can view whiteboards"
ON public.whiteboards
FOR SELECT
USING (true);

-- Admins can manage whiteboards (full CRUD)
CREATE POLICY "Admins can manage whiteboards"
ON public.whiteboards
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at
CREATE TRIGGER update_whiteboards_updated_at
BEFORE UPDATE ON public.whiteboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default whiteboard
INSERT INTO public.whiteboards (name) VALUES ('Ana Harita');