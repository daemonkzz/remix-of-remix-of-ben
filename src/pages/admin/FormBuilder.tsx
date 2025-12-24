import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilderGeneral } from '@/components/admin/FormBuilderGeneral';
import { FormBuilderQuestions } from '@/components/admin/FormBuilderQuestions';
import { FormBuilderSettings } from '@/components/admin/FormBuilderSettings';
import { FormPreviewModal } from '@/components/admin/FormPreviewModal';
import type { FormTemplate, FormQuestion, FormSettings } from '@/types/formBuilder';

const FormBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    discordWebhookUrl: '',
    roleRestrictions: [],
    cooldownHours: 0,
    maxApplications: 0,
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
        const { data: hasAdminRole, error: roleError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (roleError || !hasAdminRole) {
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

  // Load existing form template if editing
  useEffect(() => {
    if (id && isAuthorized) {
      loadFormTemplate();
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
        setTitle(data.title);
        setDescription(data.description || '');
        setCoverImageUrl(data.cover_image_url || '');
        setIsActive(data.is_active ?? true);
        setQuestions((data.questions as FormQuestion[]) || []);
        
        const loadedSettings = data.settings as Record<string, unknown> || {};
        setSettings({
          discordWebhookUrl: (loadedSettings.discordWebhookUrl as string) || '',
          roleRestrictions: (loadedSettings.roleRestrictions as string[]) || [],
          cooldownHours: (loadedSettings.cooldownHours as number) || 0,
          maxApplications: (loadedSettings.maxApplications as number) || 0,
        });
      }
    } catch (error) {
      console.error('Load form template error:', error);
      toast.error('Form şablonu yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Form başlığı zorunludur');
      return;
    }

    if (questions.length === 0) {
      toast.error('En az bir soru eklemelisiniz');
      return;
    }

    setIsSaving(true);
    try {
      const formData = {
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverImageUrl.trim() || null,
        is_active: isActive,
        questions: questions,
        settings: settings,
        created_by: user?.id,
      };

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('form_templates')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Form şablonu güncellendi');
      } else {
        // Create new
        const { error } = await supabase
          .from('form_templates')
          .insert(formData);

        if (error) throw error;
        toast.success('Form şablonu oluşturuldu');
      }

      navigate('/admin');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
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
    title,
    description,
    coverImageUrl,
    isActive,
    questions,
    settings,
  };

  return (
    <div className="min-h-screen bg-background">
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
                <h1 className="text-xl font-bold text-foreground">
                  {id ? 'Form Düzenle' : 'Yeni Form Oluştur'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gelişmiş Form Yöneticisi
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
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="questions">Form Soruları</TabsTrigger>
            <TabsTrigger value="settings">Gelişmiş Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <FormBuilderGeneral
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              coverImageUrl={coverImageUrl}
              setCoverImageUrl={setCoverImageUrl}
              isActive={isActive}
              setIsActive={setIsActive}
            />
          </TabsContent>

          <TabsContent value="questions">
            <FormBuilderQuestions
              questions={questions}
              setQuestions={setQuestions}
            />
          </TabsContent>

          <TabsContent value="settings">
            <FormBuilderSettings
              settings={settings}
              setSettings={setSettings}
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
