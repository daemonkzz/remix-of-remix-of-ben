-- Drop the old CHECK constraint that restricts type values
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_type_check;