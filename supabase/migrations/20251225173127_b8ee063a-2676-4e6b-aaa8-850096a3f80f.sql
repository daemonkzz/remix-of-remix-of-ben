-- =============================================
-- AŞAMA 1: PERFORMANS İNDEKSLERİ
-- 13 adet B-tree indeks ekleniyor
-- =============================================

-- Applications tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);

-- Notifications tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_notifications_is_global ON public.notifications(is_global);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Notification recipients tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_id ON public.notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification_id ON public.notification_recipients(notification_id);

-- Form templates tablosu indeksi
CREATE INDEX IF NOT EXISTS idx_form_templates_is_active ON public.form_templates(is_active);

-- Profiles tablosu indeksi
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles(discord_id);

-- Gallery images tablosu indeksi
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON public.gallery_images(created_at DESC);

-- Updates tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_updates_is_published ON public.updates(is_published);
CREATE INDEX IF NOT EXISTS idx_updates_published_at ON public.updates(published_at DESC);