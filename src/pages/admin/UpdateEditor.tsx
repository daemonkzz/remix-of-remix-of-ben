import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  FileText,
  Send,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/updates/RichTextEditor';
import { UpdatePreview } from '@/components/admin/updates/UpdatePreview';
import { NavigationGuard } from '@/components/admin/NavigationGuard';
import { DraftPrompt } from '@/components/admin/DraftPrompt';
import { UnsavedIndicator } from '@/components/admin/UnsavedIndicator';
import { useFormDraft } from '@/hooks/useFormDraft';
import type { UpdateData, ContentBlock, UpdateCategory } from '@/types/update';
import { defaultUpdateData } from '@/types/update';
import { useDiscordNotification } from '@/hooks/useDiscordNotification';

const UpdateEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const isEditMode = Boolean(id);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const { sendUpdateNotification, isSending: isDiscordSending } = useDiscordNotification();

  // Draft management
  const draftKey = `updateeditor_${id || 'new'}`;
  const {
    data: updateData,
    setData: setUpdateData,
    hasUnsavedChanges,
    markAsSaved,
    loadDraft,
    ignoreDraft,
    isDraftPromptPending,
  } = useFormDraft<UpdateData>({
    key: draftKey,
    initialData: { ...defaultUpdateData },
    autoLoad: true,
  });

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız');
        navigate('/');
        return;
      }

      try {
        const { data: canManageUpdates, error } = await supabase.rpc('can_manage', {
          _user_id: user.id,
          _feature: 'updates',
        });

        if (error || !canManageUpdates) {
          toast.error('Bu sayfaya erişim yetkiniz yok');
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  // Load existing update if editing
  useEffect(() => {
    if (isAuthorized && isEditMode && id) {
      loadUpdate(id);
    } else if (isAuthorized && !isEditMode) {
      setIsDataLoaded(true);
    }
  }, [isAuthorized, isEditMode, id]);

  const loadUpdate = async (updateId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('id', updateId)
        .single();

      if (error) {
        console.error('Load update error:', error);
        toast.error('Güncelleme yüklenirken hata oluştu');
        navigate('/admin');
        return;
      }

      setUpdateData({
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || '',
        category: data.category as UpdateCategory,
        version: data.version || '',
        cover_image_url: data.cover_image_url || '',
        content: (data.content as ContentBlock[]) || [],
        is_published: data.is_published,
        author_id: data.author_id || undefined,
        published_at: data.published_at || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Güncelleme yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleSaveRequest = () => {
      if (!isSaving) {
        handleSave(false);
      }
    };

    window.addEventListener('formDraftSaveRequest', handleSaveRequest);
    return () => window.removeEventListener('formDraftSaveRequest', handleSaveRequest);
  }, [isSaving, updateData]);

  const handleSave = useCallback(async (publish: boolean = false) => {
    if (!updateData.title.trim()) {
      toast.error('Başlık zorunludur');
      setActiveTab('general');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        title: updateData.title,
        subtitle: updateData.subtitle || null,
        category: updateData.category,
        version: updateData.version || null,
        cover_image_url: updateData.cover_image_url || null,
        content: updateData.content,
        is_published: publish ? true : updateData.is_published,
        author_id: user?.id || null,
        published_at: publish ? new Date().toISOString() : updateData.published_at || null,
      };

      if (isEditMode && id) {
        const { error } = await supabase
          .from('updates')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success(publish ? 'Güncelleme yayınlandı!' : 'Güncelleme kaydedildi!');
      } else {
        const { error } = await supabase.from('updates').insert(dataToSave);

        if (error) throw error;
        toast.success(publish ? 'Güncelleme yayınlandı!' : 'Güncelleme oluşturuldu!');
        markAsSaved();
        navigate('/admin');
        return;
      }

      if (publish) {
        setUpdateData((prev) => ({
          ...prev,
          is_published: true,
          published_at: new Date().toISOString(),
        }));
      }

      markAsSaved();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [updateData, isEditMode, id, user?.id, markAsSaved, navigate]);

  if (authLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-bold text-lg">
                  {isEditMode ? 'Güncelleme Düzenle' : 'Yeni Güncelleme'}
                </h1>
                <UnsavedIndicator hasUnsavedChanges={hasUnsavedChanges} />
              </div>
              <p className="text-sm text-muted-foreground">
                {updateData.is_published ? 'Yayında' : 'Taslak'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {updateData.is_published && isEditMode && (
              <Button
                variant="outline"
                onClick={() => sendUpdateNotification(updateData)}
                disabled={isDiscordSending}
                className="gap-2 text-[#5865F2] border-[#5865F2]/30 hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
              >
                {isDiscordSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Discord'a Gönder
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
            {!updateData.is_published && (
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Yayınla
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              Genel
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="w-4 h-4" />
              İçerik
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Önizleme
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-2">
              <Send className="w-4 h-4" />
              Yayınla
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Genel Bilgiler</CardTitle>
                <CardDescription>
                  Güncelleme başlığı, kategorisi ve diğer temel bilgiler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={updateData.title}
                      onChange={(e) =>
                        setUpdateData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Güncelleme başlığı..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={updateData.category}
                      onValueChange={(v) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          category: v as UpdateCategory,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update">Güncelleme</SelectItem>
                        <SelectItem value="news">Haber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Alt Başlık</Label>
                  <Input
                    id="subtitle"
                    value={updateData.subtitle || ''}
                    onChange={(e) =>
                      setUpdateData((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Kısa açıklama..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versiyon (opsiyonel)</Label>
                    <Input
                      id="version"
                      value={updateData.version || ''}
                      onChange={(e) =>
                        setUpdateData((prev) => ({ ...prev, version: e.target.value }))
                      }
                      placeholder="v2.1.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">Kapak Görseli URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cover"
                      value={updateData.cover_image_url || ''}
                      onChange={(e) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          cover_image_url: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {updateData.cover_image_url && (
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted mt-2">
                      <img
                        src={updateData.cover_image_url}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>İçerik</CardTitle>
                <CardDescription>
                  Başlıklar, paragraflar, listeler ve görseller ekleyerek içerik oluşturun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={updateData.content}
                  onChange={(content) =>
                    setUpdateData((prev) => ({ ...prev, content }))
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Önizleme</CardTitle>
                <CardDescription>
                  Güncellemenin son halini görüntüleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpdatePreview data={updateData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish">
            <Card>
              <CardHeader>
                <CardTitle>Yayın Ayarları</CardTitle>
                <CardDescription>Yayın durumu ve son kontroller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Yayın Durumu</p>
                    <p className="text-sm text-muted-foreground">
                      {updateData.is_published
                        ? 'Bu güncelleme şu anda yayında'
                        : 'Bu güncelleme henüz yayınlanmadı'}
                    </p>
                  </div>
                  <Switch
                    checked={updateData.is_published}
                    onCheckedChange={(checked) =>
                      setUpdateData((prev) => ({ ...prev, is_published: checked }))
                    }
                  />
                </div>

                <div className="p-4 border border-border rounded-lg space-y-3">
                  <p className="font-medium">Kontrol Listesi</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          updateData.title ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      Başlık {updateData.title ? 'eklendi' : 'eklenmedi'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          updateData.cover_image_url ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      Kapak görseli{' '}
                      {updateData.cover_image_url ? 'eklendi' : '(opsiyonel)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          updateData.content.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      İçerik blokları: {updateData.content.length} adet
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Taslak Olarak Kaydet
                  </Button>
                  {!updateData.is_published && (
                    <Button
                      className="flex-1"
                      onClick={() => handleSave(true)}
                      disabled={isSaving}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Yayınla
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UpdateEditor;
