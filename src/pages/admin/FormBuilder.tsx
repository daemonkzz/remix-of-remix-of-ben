import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilderGeneral } from '@/components/admin/FormBuilderGeneral';
import { FormBuilderQuestions } from '@/components/admin/FormBuilderQuestions';
import { FormBuilderPages } from '@/components/admin/FormBuilderPages';
import { FormBuilderSettings } from '@/components/admin/FormBuilderSettings';
import { FormPreviewModal } from '@/components/admin/FormPreviewModal';
import { NavigationGuard } from '@/components/admin/NavigationGuard';
import { DraftPrompt } from '@/components/admin/DraftPrompt';
import { UnsavedIndicator } from '@/components/admin/UnsavedIndicator';
import { useFormDraft } from '@/hooks/useFormDraft';
import type { FormTemplate, FormQuestion, FormSettings, FormPage, FormType } from '@/types/formBuilder';

interface FormBuilderData {
  title: string;
  description: string;
  coverImageUrl: string;
  isActive: boolean;
  questions: FormQuestion[];
  pages: FormPage[];
  formType: FormType;
  settings: FormSettings;
}

const defaultFormData: FormBuilderData = {
  title: '',
  description: '',
  coverImageUrl: '',
  isActive: true,
  questions: [],
  pages: [],
  formType: 'other',
  settings: {
    discordWebhookUrl: '',
    userAccessTypes: ['verified'],
    cooldownHours: 0,
    maxApplications: 0,
    accessCodes: [],
    isPasswordProtected: false,
    formType: 'other',
  },
};

const FormBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasActiveWhitelistForm, setHasActiveWhitelistForm] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Draft management
  const draftKey = `formbuilder_${id || 'new'}`;
  const {
    data: formData,
    setData: setFormData,
    hasUnsavedChanges,
    markAsSaved,
    loadDraft,
    ignoreDraft,
    isDraftPromptPending,
  } = useFormDraft<FormBuilderData>({
    key: draftKey,
    initialData: defaultFormData,
    autoLoad: true,
  });

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız');
        navigate('/admin');
        return;
      }

      try {
        const { data: canManageForms, error: roleError } = await supabase
          .rpc('can_manage', { _user_id: user.id, _feature: 'forms' });

        if (roleError || !canManageForms) {
          toast.error('Bu sayfaya erişim yetkiniz yok');
          navigate('/admin');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/admin');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  // Check for active whitelist forms
  useEffect(() => {
    const checkActiveWhitelistForm = async () => {
      if (!isAuthorized) return;

      try {
        const { data, error } = await supabase
          .from('form_templates')
          .select('id, settings')
          .eq('is_active', true);

        if (error) throw error;

        const activeWhitelist = data?.find((form) => {
          const settings = form.settings as Record<string, unknown>;
          return settings?.formType === 'whitelist' && form.id !== id;
        });

        setHasActiveWhitelistForm(!!activeWhitelist);
      } catch (error) {
        console.error('Check whitelist form error:', error);
      }
    };

    checkActiveWhitelistForm();
  }, [isAuthorized, id]);

  // Load existing form template if editing
  useEffect(() => {
    if (id && isAuthorized) {
      loadFormTemplate();
    } else if (!id && isAuthorized) {
      setIsDataLoaded(true);
    }
  }, [id, isAuthorized]);

  const loadFormTemplate = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const loadedQuestions = (data.questions as FormQuestion[]) || [];
        const loadedSettings = data.settings as Record<string, unknown> || {};
        const loadedPages = (loadedSettings.pages as FormPage[]) || [];
        const loadedFormType = (loadedSettings.formType as FormType) || 'other';
        
        setFormData({
          title: data.title,
          description: data.description || '',
          coverImageUrl: data.cover_image_url || '',
          isActive: data.is_active ?? true,
          questions: loadedQuestions,
          pages: loadedPages,
          formType: loadedFormType,
          settings: {
            discordWebhookUrl: (loadedSettings.discordWebhookUrl as string) || '',
            userAccessTypes: (loadedSettings.userAccessTypes as ('unverified' | 'verified')[]) || ['verified'],
            cooldownHours: (loadedSettings.cooldownHours as number) || 0,
            maxApplications: (loadedSettings.maxApplications as number) || 0,
            accessCodes: (loadedSettings.accessCodes as string[]) || [],
            isPasswordProtected: (loadedSettings.isPasswordProtected as boolean) || false,
            formType: loadedFormType,
          },
        });
        setIsDataLoaded(true);
      }
    } catch (error) {
      console.error('Load form template error:', error);
      toast.error('Form şablonu yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync formType with settings
  useEffect(() => {
    if (!isDataLoaded) return;
    
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        formType: prev.formType,
        userAccessTypes: prev.formType === 'whitelist' ? ['unverified'] : prev.settings.userAccessTypes,
      },
    }));
  }, [formData.formType, isDataLoaded]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleSaveRequest = () => {
      if (!isSaving) {
        handleSave();
      }
    };

    window.addEventListener('formDraftSaveRequest', handleSaveRequest);
    return () => window.removeEventListener('formDraftSaveRequest', handleSaveRequest);
  }, [isSaving, formData]);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error('Form başlığı zorunludur');
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('En az bir soru eklemelisiniz');
      return;
    }

    if (formData.formType === 'whitelist' && formData.isActive && hasActiveWhitelistForm) {
      toast.error('Aynı anda yalnızca bir whitelist formu aktif olabilir');
      return;
    }

    setIsSaving(true);
    try {
      const settingsWithPages = {
        ...formData.settings,
        pages: formData.pages,
        formType: formData.formType,
      };

      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover_image_url: formData.coverImageUrl.trim() || null,
        is_active: formData.isActive,
        questions: formData.questions,
        settings: settingsWithPages,
        created_by: user?.id,
      };

      if (id) {
        const { error } = await supabase
          .from('form_templates')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success('Form şablonu güncellendi');
      } else {
        const { error } = await supabase
          .from('form_templates')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Form şablonu oluşturuldu');
      }

      markAsSaved();
      navigate('/admin');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [formData, hasActiveWhitelistForm, id, user?.id, markAsSaved, navigate]);

  // Update individual fields
  const updateField = <K extends keyof FormBuilderData>(
    field: K,
    value: FormBuilderData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const formTemplate: FormTemplate = {
    id: id || '',
    title: formData.title,
    description: formData.description,
    coverImageUrl: formData.coverImageUrl,
    isActive: formData.isActive,
    questions: formData.questions,
    pages: formData.pages,
    settings: formData.settings,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Guard */}
      <NavigationGuard when={hasUnsavedChanges} />

      {/* Draft Prompt */}
      <DraftPrompt
        open={isDraftPromptPending}
        onLoadDraft={loadDraft}
        onIgnoreDraft={ignoreDraft}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground">
                    {id ? 'Form Düzenle' : 'Yeni Form Oluştur'}
                  </h1>
                  <UnsavedIndicator hasUnsavedChanges={hasUnsavedChanges} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.formType === 'whitelist' ? 'Whitelist Formu' : 'Gelişmiş Form Yöneticisi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Önizleme
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="pages">Sayfalar</TabsTrigger>
            <TabsTrigger value="questions">Sorular</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <FormBuilderGeneral
              title={formData.title}
              setTitle={(v) => updateField('title', v)}
              description={formData.description}
              setDescription={(v) => updateField('description', v)}
              coverImageUrl={formData.coverImageUrl}
              setCoverImageUrl={(v) => updateField('coverImageUrl', v)}
              isActive={formData.isActive}
              setIsActive={(v) => updateField('isActive', v)}
              formType={formData.formType}
              setFormType={(v) => updateField('formType', v)}
              hasActiveWhitelistForm={hasActiveWhitelistForm}
              currentFormId={id}
            />
          </TabsContent>

          <TabsContent value="pages">
            <FormBuilderPages
              pages={formData.pages}
              setPages={(v) => updateField('pages', v)}
              questions={formData.questions}
              setQuestions={(v) => updateField('questions', v)}
            />
          </TabsContent>

          <TabsContent value="questions">
            <FormBuilderQuestions
              questions={formData.questions}
              setQuestions={(v) => updateField('questions', v)}
              pages={formData.pages}
            />
          </TabsContent>

          <TabsContent value="settings">
            <FormBuilderSettings
              settings={formData.settings}
              setSettings={(v) => updateField('settings', v)}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Preview Modal */}
      <FormPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        formTemplate={formTemplate}
      />
    </div>
  );
};

export default FormBuilder;
