-- notifications tablosu (ana bildirim tablosu)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_global boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- notification_recipients tablosu (bireysel bildirimler için)
CREATE TABLE public.notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- user_global_notification_reads tablosu (global bildirimlerin okundu durumu)
CREATE TABLE public.user_global_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- RLS Etkinleştir
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_global_notification_reads ENABLE ROW LEVEL SECURITY;

-- Adminler bildirimleri yönetebilir
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kullanıcılar global bildirimleri veya kendilerine gelen bildirimleri görebilir
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (
  is_global = true 
  OR id IN (
    SELECT notification_id FROM public.notification_recipients 
    WHERE user_id = auth.uid()
  )
);

-- Kullanıcılar kendi bildirim durumlarını görebilir
CREATE POLICY "Users can view own notification status"
ON public.notification_recipients FOR SELECT
USING (user_id = auth.uid());

-- Kullanıcılar kendi bildirimlerini okundu işaretleyebilir
CREATE POLICY "Users can mark own notifications as read"
ON public.notification_recipients FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Adminler recipient kayıtlarını yönetebilir
CREATE POLICY "Admins can manage notification recipients"
ON public.notification_recipients FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kullanıcılar kendi global bildirim okuma durumlarını yönetebilir
CREATE POLICY "Users can manage own global notification reads"
ON public.user_global_notification_reads FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Adminler global notification reads görebilir
CREATE POLICY "Admins can view global notification reads"
ON public.user_global_notification_reads FOR SELECT
USING (has_role(auth.uid(), 'admin'));