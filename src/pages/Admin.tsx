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
  Plus
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

type TabType = 'basvurular' | 'duyurular' | 'kullanicilar';

interface Application {
  id: number;
  user_id: string;
  type: string;
  content: Record<string, string>;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basvurular');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
        // Check if user has admin role using the has_role function via RPC
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

  // Fetch applications when authorized and on basvurular tab
  useEffect(() => {
    if (isAuthorized && activeTab === 'basvurular') {
      fetchApplications();
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
    return content?.karakter_adi || content?.character_name || content?.isim || 'Belirtilmemiş';
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
    const typeMap: Record<string, string> = {
      'lspd-akademi': 'LSPD Akademi',
      'sirket': 'Şirket',
      'taksici': 'Taksici',
      'hastane': 'Hastane',
    };
    return typeMap[type] || type;
  };

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
    { id: 'duyurular' as TabType, label: 'Duyurular', icon: Bell },
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
        {activeTab === 'basvurular' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Başvurular</h2>
                <p className="text-muted-foreground">Tüm başvuruları görüntüle ve yönet</p>
              </div>
              <Button onClick={() => navigate('/admin/form-builder')} className="gap-2">
                <Plus className="w-4 h-4" />
                Yeni Form Oluştur
              </Button>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz başvuru bulunmuyor</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Karakter Adı</TableHead>
                      <TableHead className="text-muted-foreground">Başvuru Tipi</TableHead>
                      <TableHead className="text-muted-foreground">Tarih</TableHead>
                      <TableHead className="text-muted-foreground">Durum</TableHead>
                      <TableHead className="text-muted-foreground text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
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
                        <TableCell className="text-muted-foreground">
                          {formatDate(app.created_at)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(app.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'duyurular' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Duyurular</h2>
              <p className="text-muted-foreground">Duyuruları yönet</p>
            </div>
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Duyuru yönetimi yakında eklenecek</p>
            </div>
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
    </div>
  );
};

export default Admin;
