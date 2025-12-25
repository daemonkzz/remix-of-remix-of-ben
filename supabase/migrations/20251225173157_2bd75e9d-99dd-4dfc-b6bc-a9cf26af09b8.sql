-- =============================================
-- AŞAMA 3: JSONB OPTİMİZASYONU
-- GIN indeksleri ekleniyor
-- =============================================

-- applications.content için GIN indeks
CREATE INDEX IF NOT EXISTS idx_applications_content_gin ON public.applications USING GIN (content);

-- form_templates.questions için GIN indeks
CREATE INDEX IF NOT EXISTS idx_form_templates_questions_gin ON public.form_templates USING GIN (questions);

-- form_templates.settings için GIN indeks
CREATE INDEX IF NOT EXISTS idx_form_templates_settings_gin ON public.form_templates USING GIN (settings);

-- form_templates.settings->>'formType' için B-tree indeks (sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_form_templates_form_type ON public.form_templates ((settings->>'formType'));

-- updates.content için GIN indeks
CREATE INDEX IF NOT EXISTS idx_updates_content_gin ON public.updates USING GIN (content);

-- rules.data için GIN indeks
CREATE INDEX IF NOT EXISTS idx_rules_data_gin ON public.rules USING GIN (data);

-- applications.content_history için GIN indeks
CREATE INDEX IF NOT EXISTS idx_applications_content_history_gin ON public.applications USING GIN (content_history);

-- applications.revision_notes için GIN indeks
CREATE INDEX IF NOT EXISTS idx_applications_revision_notes_gin ON public.applications USING GIN (revision_notes);

-- whiteboards.scene_data için GIN indeks
CREATE INDEX IF NOT EXISTS idx_whiteboards_scene_data_gin ON public.whiteboards USING GIN (scene_data);