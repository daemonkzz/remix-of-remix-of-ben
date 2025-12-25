-- =============================================
-- AŞAMA 2: FOREIGN KEY İLİŞKİLERİ
-- Tüm user_id ve author_id kolonları profiles.id'ye bağlanıyor
-- =============================================

-- notification_recipients.user_id -> profiles.id
ALTER TABLE public.notification_recipients
ADD CONSTRAINT fk_notification_recipients_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- notification_recipients.notification_id -> notifications.id
ALTER TABLE public.notification_recipients
ADD CONSTRAINT fk_notification_recipients_notification
FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;

-- user_global_notification_reads.user_id -> profiles.id
ALTER TABLE public.user_global_notification_reads
ADD CONSTRAINT fk_user_global_notification_reads_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_global_notification_reads.notification_id -> notifications.id
ALTER TABLE public.user_global_notification_reads
ADD CONSTRAINT fk_user_global_notification_reads_notification
FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;

-- admin_2fa_settings.user_id -> profiles.id
ALTER TABLE public.admin_2fa_settings
ADD CONSTRAINT fk_admin_2fa_settings_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- notifications.created_by -> profiles.id
ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- updates.author_id -> profiles.id
ALTER TABLE public.updates
ADD CONSTRAINT fk_updates_author
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- gallery_images.uploaded_by -> profiles.id
ALTER TABLE public.gallery_images
ADD CONSTRAINT fk_gallery_images_uploaded_by
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- form_templates.created_by -> profiles.id
ALTER TABLE public.form_templates
ADD CONSTRAINT fk_form_templates_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- announcements.author_id -> profiles.id
ALTER TABLE public.announcements
ADD CONSTRAINT fk_announcements_author
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- rules.updated_by -> profiles.id
ALTER TABLE public.rules
ADD CONSTRAINT fk_rules_updated_by
FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- whiteboards.created_by -> profiles.id
ALTER TABLE public.whiteboards
ADD CONSTRAINT fk_whiteboards_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- applications.user_id -> profiles.id
ALTER TABLE public.applications
ADD CONSTRAINT fk_applications_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;