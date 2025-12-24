import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, FileText, Settings, Bell, Users, ShieldCheck, Image as ImageIcon, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionTimeoutIndicator } from '@/components/admin/SessionTimeoutIndicator';

type TabType = 'basvurular' | 'formlar' | 'guncellemeler' | 'bildirimler' | 'kurallar' | 'galeri' | 'canliharita' | 'kullanicilar' | 'yetkilendirme';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: TabType;
}

const sidebarItems = [
  { id: 'basvurular' as TabType, label: 'Başvurular', icon: FileText, path: '/admin?tab=basvurular' },
  { id: 'formlar' as TabType, label: 'Form Şablonları', icon: Settings, path: '/admin?tab=formlar' },
  { id: 'guncellemeler' as TabType, label: 'Güncellemeler', icon: Bell, path: '/admin?tab=guncellemeler' },
  { id: 'bildirimler' as TabType, label: 'Bildirimler', icon: Bell, path: '/admin/notification-editor' },
  { id: 'kurallar' as TabType, label: 'Kurallar', icon: Shield, path: '/admin/rules-editor' },
  { id: 'galeri' as TabType, label: 'Medya Galeri', icon: ImageIcon, path: '/admin/gallery' },
  { id: 'canliharita' as TabType, label: 'Canlı Harita', icon: Map, path: '/admin/whiteboard-editor' },
  { id: 'kullanicilar' as TabType, label: 'Kullanıcılar', icon: Users, path: '/admin?tab=kullanicilar' },
  { id: 'yetkilendirme' as TabType, label: 'Yetki Yönetimi', icon: ShieldCheck, path: '/admin/manage-access' },
];

// Helper to detect active tab from location
const getActiveTabFromPath = (pathname: string, search: string): TabType => {
  if (pathname === '/admin/rules-editor') return 'kurallar';
  if (pathname === '/admin/gallery') return 'galeri';
  if (pathname === '/admin/whiteboard-editor') return 'canliharita';
  if (pathname === '/admin/manage-access') return 'yetkilendirme';
  if (pathname === '/admin/notification-editor') return 'bildirimler';
  
  // Check query params for main admin tabs
  const params = new URLSearchParams(search);
  const tab = params.get('tab') as TabType | null;
  return tab || 'basvurular';
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab: propActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Determine active tab from props or location
  const activeTab = propActiveTab || getActiveTabFromPath(location.pathname, location.search);

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

  const handleTabClick = (item: typeof sidebarItems[0]) => {
    navigate(item.path);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
            </div>
          </div>
          <div className="mt-4">
            <SessionTimeoutIndicator />
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleTabClick(item)}
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
