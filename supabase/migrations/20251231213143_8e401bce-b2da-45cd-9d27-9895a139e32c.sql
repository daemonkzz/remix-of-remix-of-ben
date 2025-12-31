-- Mevcut admin ve moderator rollerini sil
-- super_admin ve user rolleri kalacak

DELETE FROM public.user_roles 
WHERE role IN ('admin', 'moderator');