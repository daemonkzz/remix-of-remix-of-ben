-- AI Sistemi Database Migration
-- Kaze-Z Başvuru Değerlendirme Sistemi

-- ============================================
-- 1. AI SETTINGS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    mode TEXT NOT NULL DEFAULT 'readonly' CHECK (mode IN ('autonomous', 'readonly', 'hybrid')),
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    confidence_threshold SMALLINT NOT NULL DEFAULT 85 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
    auto_approve BOOLEAN NOT NULL DEFAULT true,
    auto_reject BOOLEAN NOT NULL DEFAULT false,
    revision_limit SMALLINT NOT NULL DEFAULT 3 CHECK (revision_limit >= 1 AND revision_limit <= 10),
    daily_limit SMALLINT NOT NULL DEFAULT 50 CHECK (daily_limit >= 1 AND daily_limit <= 500),
    discord_bot_token TEXT,
    discord_server_id TEXT,
    discord_role_id TEXT,
    discord_log_webhook TEXT,
    discord_alert_webhook TEXT,
    discord_delay_ms INT NOT NULL DEFAULT 2000 CHECK (discord_delay_ms >= 500 AND discord_delay_ms <= 10000),
    blacklist_words TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Varsayılan ayarları ekle
INSERT INTO public.ai_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- RLS aktif et
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Sadece super_admin okuyabilir/yazabilir
CREATE POLICY "Super admins can manage ai_settings"
ON public.ai_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 2. AI REPORTS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_reports (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('autonomous', 'readonly', 'hybrid')),
    deepseek_analysis JSONB,
    claude_analysis JSONB,
    final_decision TEXT CHECK (final_decision IN ('approved', 'rejected', 'interview', 'revision')),
    confidence_score SMALLINT CHECK (confidence_score >= 0 AND confidence_score <= 100),
    action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'revision_sent', 'forwarded_to_admin', 'no_action', 'error')),
    staff_decision TEXT,
    decision_match BOOLEAN,
    priority SMALLINT DEFAULT 0 CHECK (priority >= 0 AND priority <= 1),
    error_log TEXT,
    processing_time_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_ai_reports_application_id ON public.ai_reports(application_id);
CREATE INDEX idx_ai_reports_created_at ON public.ai_reports(created_at DESC);
CREATE INDEX idx_ai_reports_final_decision ON public.ai_reports(final_decision);

-- RLS aktif et
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Sadece super_admin okuyabilir
CREATE POLICY "Super admins can view ai_reports"
ON public.ai_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 3. AI AUDIT LOG TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeks
CREATE INDEX idx_ai_audit_log_created_at ON public.ai_audit_log(created_at DESC);
CREATE INDEX idx_ai_audit_log_action ON public.ai_audit_log(action);

-- RLS aktif et
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Sadece super_admin okuyabilir
CREATE POLICY "Super admins can view ai_audit_log"
ON public.ai_audit_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 4. APPLICATIONS TABLOSUNA EK KOLONLAR
-- ============================================
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS ai_priority SMALLINT DEFAULT 0 CHECK (ai_priority >= 0 AND ai_priority <= 1),
ADD COLUMN IF NOT EXISTS ai_manual_send BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_sent_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ai_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'queued', 'processing', 'done', 'error', 'skipped'));

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_applications_ai_priority ON public.applications(ai_priority) WHERE ai_priority > 0;
CREATE INDEX IF NOT EXISTS idx_applications_ai_processing_status ON public.applications(ai_processing_status);
CREATE INDEX IF NOT EXISTS idx_applications_ai_manual_send ON public.applications(ai_manual_send) WHERE ai_manual_send = true;

-- ============================================
-- 5. AUDIT LOG Trigger Fonksiyonu
-- ============================================
CREATE OR REPLACE FUNCTION log_ai_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.ai_audit_log (action, user_id, details)
    VALUES (
        TG_OP,
        auth.uid(),
        jsonb_build_object(
            'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
            'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS audit_ai_settings ON public.ai_settings;
CREATE TRIGGER audit_ai_settings
AFTER INSERT OR UPDATE OR DELETE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION log_ai_settings_changes();

-- ============================================
-- 6. Günlük İşlem Sayacı View
-- ============================================
CREATE OR REPLACE VIEW public.ai_daily_stats AS
SELECT 
    DATE(created_at) as report_date,
    COUNT(*) as total_processed,
    COUNT(*) FILTER (WHERE final_decision = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE final_decision = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE final_decision = 'interview') as interview_count,
    COUNT(*) FILTER (WHERE final_decision = 'revision') as revision_count,
    AVG(confidence_score) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time_ms
FROM public.ai_reports
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY report_date DESC;

-- View için yetki
GRANT SELECT ON public.ai_daily_stats TO authenticated;

COMMENT ON TABLE public.ai_settings IS 'AI sistemi genel ayarları - sadece super_admin erişebilir';
COMMENT ON TABLE public.ai_reports IS 'AI değerlendirme raporları';
COMMENT ON TABLE public.ai_audit_log IS 'AI ayar değişiklikleri log';
