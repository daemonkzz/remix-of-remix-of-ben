-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create form_templates table for dynamic form builder
CREATE TABLE public.form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage form templates"
ON public.form_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view form templates
CREATE POLICY "Moderators can view form templates"
ON public.form_templates
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Authenticated users can view active templates
CREATE POLICY "Users can view active form templates"
ON public.form_templates
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.form_templates IS 'Stores dynamic form templates created by admins';
COMMENT ON COLUMN public.form_templates.questions IS 'JSON array of questions with type, label, required, placeholder, options';
COMMENT ON COLUMN public.form_templates.settings IS 'JSON object with discord_webhook, role_restrictions, cooldown_hours, max_applications';