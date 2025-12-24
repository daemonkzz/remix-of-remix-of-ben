import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Bell, 
  Users, 
  Check, 
  X, 
  Loader2,
  Shield,
  Plus,
  Settings,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormQuestion, FormSettings, FormType } from '@/types/formBuilder';
import type { UpdateData } from '@/types/update';

type TabType = 'basvurular' | 'formlar' | 'guncellemeler' | 'kullanicilar';
type ApplicationFilterType = 'all' | 'whitelist' | 'other';
type FormFilterType = 'all' | 'whitelist' | 'other';
type UpdateFilterType = 'all' | 'update' | 'news';
type UpdateStatusFilterType = 'all' | 'published' | 'draft';

interface Application {
  id: number;
  user_id: string;
  type: string;
  content: Record<string, string>;
  status: string;
  created_at: string;
}

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questions: FormQuestion[];
  settings: FormSettings;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basvurular');
  const [applications, setApplications] = useState<Application[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [togglingFormId, setTogglingFormId] = useState<string | null>(null);
  
  // Updates
  const [updates, setUpdates] = useState<UpdateData[]>([]);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);
  const [togglingUpdateId, setTogglingUpdateId] = useState<string | null>(null);
  
  // Filters
  const [applicationFilter, setApplicationFilter] = useState<ApplicationFilterType>('all');
  const [formFilter, setFormFilter] = useState<FormFilterType>('all');
  const [updateFilter, setUpdateFilter] = useState<UpdateFilterType>('all');
  const [updateStatusFilter, setUpdateStatusFilter] = useState<UpdateStatusFilterType>('all');

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız');
        navigate('/');
        return;
      }

      try {
        const { data: hasAdminRole, error: roleError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (roleError) {
          console.error('Role check error:', roleError);
          toast.error('Yetki kontrolü yapılırken hata oluştu');
          navigate('/');
          return;
        }

        if (!hasAdminRole) {
          toast.error('Bu sayfaya erişim yetkiniz yok');
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Yetki kontrolü yapılırken hata oluştu');
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  // Fetch data based on active tab
  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === 'basvurular') {
        fetchApplications();
        fetchFormTemplates(); // Also fetch to get form names
      } else if (activeTab === 'formlar') {
        fetchFormTemplates();
      } else if (activeTab === 'guncellemeler') {
        fetchUpdates();
      }
    }
  }, [isAuthorized, activeTab]);

  const fetchApplications = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch applications error:', error);
        toast.error('Başvurular yüklenirken hata oluştu');
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Başvurular yüklenirken hata oluştu');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchFormTemplates = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch form templates error:', error);
        toast.error('Form şablonları yüklenirken hata oluştu');
        return;
      }

      const typedTemplates = (data || []).map(t => ({
        ...t,
        questions: t.questions as FormQuestion[],
        settings: t.settings as FormSettings
      }));
      setFormTemplates(typedTemplates);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Form şablonları yüklenirken hata oluştu');
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateApplicationStatus = async (id: number, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Durum güncellenirken hata oluştu');
        return;
      }

      toast.success(status === 'approved' ? 'Başvuru onaylandı' : 'Başvuru reddedildi');
      fetchApplications();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Durum güncellenirken hata oluştu');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean, isWhitelist: boolean) => {
    // Check if trying to activate a whitelist form when another is active
    if (!currentStatus && isWhitelist) {
      const otherActiveWhitelist = formTemplates.find(f => {
        const fType = (f.settings as any)?.formType;
        return f.id !== formId && f.is_active && fType === 'whitelist';
      });
      if (otherActiveWhitelist) {
        toast.error('Aynı anda yalnızca bir whitelist formu aktif olabilir');
        return;
      }
    }

    setTogglingFormId(formId);
    try {
      const { error } = await supabase
        .from('form_templates')
        .update({ is_active: !currentStatus })
        .eq('id', formId);

      if (error) {
        console.error('Toggle error:', error);
        toast.error('Form durumu güncellenirken hata oluştu');
        return;
      }

      toast.success(currentStatus ? 'Form pasif yapıldı' : 'Form aktif yapıldı');
      fetchFormTemplates();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Form durumu güncellenirken hata oluştu');
    } finally {
      setTogglingFormId(null);
    }
  };

  const deleteFormTemplate = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', formId);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Form silinirken hata oluştu');
        return;
      }

      toast.success('Form silindi');
      fetchFormTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Form silinirken hata oluştu');
    } finally {
      setDeletingFormId(null);
    }
  };

  const fetchUpdates = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch updates error:', error);
        toast.error('Güncellemeler yüklenirken hata oluştu');
        return;
      }

      setUpdates(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Güncellemeler yüklenirken hata oluştu');
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleUpdateStatus = async (updateId: string, currentStatus: boolean) => {
    setTogglingUpdateId(updateId);
    try {
      const { error } = await supabase
        .from('updates')
        .update({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', updateId);

      if (error) {
        console.error('Toggle error:', error);
        toast.error('Güncelleme durumu değiştirilirken hata oluştu');
        return;
      }

      toast.success(currentStatus ? 'Güncelleme taslağa alındı' : 'Güncelleme yayınlandı');
      fetchUpdates();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Güncelleme durumu değiştirilirken hata oluştu');
    } finally {
      setTogglingUpdateId(null);
    }
  };

  const deleteUpdate = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('updates')
        .delete()
        .eq('id', updateId);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Güncelleme silinirken hata oluştu');
        return;
      }

      toast.success('Güncelleme silindi');
      fetchUpdates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Güncelleme silinirken hata oluştu');
    } finally {
      setDeletingUpdateId(null);
    }
  };

  const getFormType = (template: FormTemplate): FormType => {
    return (template.settings as any)?.formType || 'other';
  };

  const getFormTypeByFormId = (formId: string): FormType => {
    const template = formTemplates.find(t => t.id === formId);
    if (template) {
      return getFormType(template);
    }
    return 'other';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Onaylandı</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Reddedildi</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Beklemede</Badge>;
    }
  };

  const getCharacterName = (content: Record<string, string>) => {
    // Look for common character name fields
    const nameKeys = Object.keys(content).filter(key => 
      key.toLowerCase().includes('karakter') || 
      key.toLowerCase().includes('character') ||
      key.toLowerCase().includes('isim') ||
      key.toLowerCase().includes('ad')
    );
    if (nameKeys.length > 0) {
      return content[nameKeys[0]] || 'Belirtilmemiş';
    }
    // Return first value as fallback
    const values = Object.values(content);
    return values[0] || 'Belirtilmemiş';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFormTypeName = (type: string) => {
    // Try to find from templates
    const template = formTemplates.find(t => t.id === type);
    if (template) return template.title;
    return type;
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (applicationFilter === 'all') return true;
    const formType = getFormTypeByFormId(app.type);
    return formType === applicationFilter;
  });

  // Filter form templates
  const filteredFormTemplates = formTemplates.filter(template => {
    if (formFilter === 'all') return true;
    const formType = getFormType(template);
    return formType === formFilter;
  });

  // Filter updates
  const filteredUpdates = updates.filter(update => {
    const categoryMatch = updateFilter === 'all' || update.category === updateFilter;
    const statusMatch = updateStatusFilter === 'all' || 
      (updateStatusFilter === 'published' ? update.is_published : !update.is_published);
    return categoryMatch && statusMatch;
  });

  // Show loading while checking auth
  if (authLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  const sidebarItems = [
    { id: 'basvurular' as TabType, label: 'Başvurular', icon: FileText },
    { id: 'formlar' as TabType, label: 'Form Şablonları', icon: Settings },
    { id: 'guncellemeler' as TabType, label: 'Güncellemeler', icon: Bell },
    { id: 'kullanicilar' as TabType, label: 'Kullanıcılar', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/')}
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Başvurular Tab */}
        {activeTab === 'basvurular' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Başvurular</h2>
                <p className="text-muted-foreground">Tüm başvuruları görüntüle ve yönet</p>
              </div>
              
              {/* Application Filter */}
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={applicationFilter} onValueChange={(v) => setApplicationFilter(v as ApplicationFilterType)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Başvurular</SelectItem>
                    <SelectItem value="whitelist">Whitelist Başvuruları</SelectItem>
                    <SelectItem value="other">Diğer Başvurular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {applicationFilter === 'all' 
                    ? 'Henüz başvuru bulunmuyor'
                    : applicationFilter === 'whitelist'
                    ? 'Whitelist başvurusu bulunmuyor'
                    : 'Diğer başvuru bulunmuyor'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Başvuran</TableHead>
                      <TableHead className="text-muted-foreground">Form</TableHead>
                      <TableHead className="text-muted-foreground">Tip</TableHead>
                      <TableHead className="text-muted-foreground">Tarih</TableHead>
                      <TableHead className="text-muted-foreground">Durum</TableHead>
                      <TableHead className="text-muted-foreground text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => {
                      const formType = getFormTypeByFormId(app.type);
                      return (
                        <TableRow 
                          key={app.id} 
                          className="border-border cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/basvuru/${app.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">
                            {getCharacterName(app.content as Record<string, string>)}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {getFormTypeName(app.type)}
                          </TableCell>
                          <TableCell>
                            {formType === 'whitelist' ? (
                              <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Whitelist
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Diğer
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(app.created_at)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(app.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                                onClick={() => updateApplicationStatus(app.id, 'approved')}
                                disabled={updatingId === app.id || app.status === 'approved'}
                              >
                                {updatingId === app.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span className="ml-1">Onayla</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                disabled={updatingId === app.id || app.status === 'rejected'}
                              >
                                {updatingId === app.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                <span className="ml-1">Reddet</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Form Şablonları Tab */}
        {activeTab === 'formlar' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Form Şablonları</h2>
                <p className="text-muted-foreground">Başvuru formlarını oluştur ve yönet</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Form Filter */}
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={formFilter} onValueChange={(v) => setFormFilter(v as FormFilterType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Formlar</SelectItem>
                    <SelectItem value="whitelist">Whitelist Formları</SelectItem>
                    <SelectItem value="other">Diğer Formlar</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => navigate('/admin/form-builder')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Yeni Form Oluştur
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredFormTemplates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {formFilter === 'all' 
                    ? 'Henüz form şablonu bulunmuyor'
                    : formFilter === 'whitelist'
                    ? 'Whitelist formu bulunmuyor'
                    : 'Diğer form bulunmuyor'
                  }
                </p>
                <Button onClick={() => navigate('/admin/form-builder')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  İlk Formu Oluştur
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Form Adı</TableHead>
                      <TableHead className="text-muted-foreground">Tip</TableHead>
                      <TableHead className="text-muted-foreground">Soru Sayısı</TableHead>
                      <TableHead className="text-muted-foreground">Durum</TableHead>
                      <TableHead className="text-muted-foreground">Oluşturulma</TableHead>
                      <TableHead className="text-muted-foreground text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormTemplates.map((template) => {
                      const formType = getFormType(template);
                      const isWhitelist = formType === 'whitelist';
                      return (
                        <TableRow key={template.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            {template.title}
                          </TableCell>
                          <TableCell>
                            {isWhitelist ? (
                              <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Whitelist
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Diğer
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {template.questions?.length || 0} soru
                          </TableCell>
                          <TableCell>
                            {template.is_active ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border">
                                Pasif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(template.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFormStatus(template.id, template.is_active, isWhitelist)}
                                disabled={togglingFormId === template.id}
                                title={template.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                              >
                                {togglingFormId === template.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : template.is_active ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/admin/form-builder/${template.id}`)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingFormId(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guncellemeler' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Güncellemeler</h2>
                <p className="text-muted-foreground">Güncellemeler ve haberleri yönet</p>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={updateFilter} onValueChange={(v) => setUpdateFilter(v as UpdateFilterType)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="update">Güncellemeler</SelectItem>
                    <SelectItem value="news">Haberler</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={updateStatusFilter} onValueChange={(v) => setUpdateStatusFilter(v as UpdateStatusFilterType)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="published">Yayında</SelectItem>
                    <SelectItem value="draft">Taslak</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => navigate('/admin/update-editor')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Yeni Güncelleme
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {updateFilter === 'all' && updateStatusFilter === 'all'
                    ? 'Henüz güncelleme bulunmuyor'
                    : 'Filtreye uygun güncelleme bulunamadı'
                  }
                </p>
                <Button onClick={() => navigate('/admin/update-editor')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  İlk Güncellemeyi Oluştur
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Başlık</TableHead>
                      <TableHead className="text-muted-foreground">Kategori</TableHead>
                      <TableHead className="text-muted-foreground">Versiyon</TableHead>
                      <TableHead className="text-muted-foreground">Durum</TableHead>
                      <TableHead className="text-muted-foreground">Tarih</TableHead>
                      <TableHead className="text-muted-foreground text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUpdates.map((update) => (
                      <TableRow key={update.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {update.title}
                        </TableCell>
                        <TableCell>
                          {update.category === 'update' ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Güncelleme
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              Haber
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {update.version || '-'}
                        </TableCell>
                        <TableCell>
                          {update.is_published ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Yayında
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border">
                              Taslak
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(update.created_at || '')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleUpdateStatus(update.id!, update.is_published)}
                              disabled={togglingUpdateId === update.id}
                              title={update.is_published ? 'Taslağa Al' : 'Yayınla'}
                            >
                              {togglingUpdateId === update.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : update.is_published ? (
                                <ToggleRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/update-editor/${update.id}`)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingUpdateId(update.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kullanicilar' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Kullanıcılar</h2>
              <p className="text-muted-foreground">Kullanıcıları yönet</p>
            </div>
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Kullanıcı yönetimi yakında eklenecek</p>
            </div>
          </div>
        )}
      </main>

      {/* Delete Form Confirmation Dialog */}
      <AlertDialog open={!!deletingFormId} onOpenChange={() => setDeletingFormId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Formu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu formu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingFormId && deleteFormTemplate(deletingFormId)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Update Confirmation Dialog */}
      <AlertDialog open={!!deletingUpdateId} onOpenChange={() => setDeletingUpdateId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Güncellemeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu güncellemeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingUpdateId && deleteUpdate(deletingUpdateId)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
