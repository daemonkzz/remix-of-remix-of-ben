import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  FileText,
  Settings,
  Bell,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  Map,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  LayoutDashboard,
  Key,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionTimeoutIndicator } from '@/components/admin/SessionTimeoutIndicator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import type { TabKey } from '@/types/permissions';

type TabType =
  | 'dashboard'
  | 'basvurular'
  | 'formlar'
  | 'guncellemeler'
  | 'bildirimler'
  | 'kurallar'
  | 'sozluk'
  | 'galeri'
  | 'canliharita'
  | 'kullanicilar'
  | 'yetkilendirme'
  | '2fa';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab?: TabType;
}

const allSidebarItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard, path: '/admin?tab=dashboard' },
  { id: 'basvurular' as TabType, label: 'Başvurular', icon: FileText, path: '/admin?tab=basvurular' },
  { id: 'formlar' as TabType, label: 'Form Şablonları', icon: Settings, path: '/admin?tab=formlar' },
  { id: 'guncellemeler' as TabType, label: 'Güncellemeler', icon: Bell, path: '/admin?tab=guncellemeler' },
  { id: 'bildirimler' as TabType, label: 'Bildirimler', icon: Bell, path: '/admin/notification-editor' },
  { id: 'kurallar' as TabType, label: 'Kurallar', icon: Shield, path: '/admin/rules-editor' },
  { id: 'sozluk' as TabType, label: 'Terimler Sözlüğü', icon: BookOpen, path: '/admin/glossary-editor' },
  { id: 'galeri' as TabType, label: 'Medya Galeri', icon: ImageIcon, path: '/admin/gallery' },
  { id: 'canliharita' as TabType, label: 'Canlı Harita', icon: Map, path: '/admin/whiteboard-editor' },
  { id: 'kullanicilar' as TabType, label: 'Kullanıcılar', icon: Users, path: '/admin/users' },
  { id: 'yetkilendirme' as TabType, label: 'Yetki Yönetimi', icon: ShieldCheck, path: '/admin/permissions' },
  { id: '2fa' as TabType, label: '2FA Yönetimi', icon: Key, path: '/admin/manage-access' },
];

// Helper to detect active tab from location
const getActiveTabFromPath = (pathname: string, search: string): TabType => {
  if (pathname === '/admin/rules-editor') return 'kurallar';
  if (pathname === '/admin/glossary-editor') return 'sozluk';
  if (pathname === '/admin/gallery') return 'galeri';
  if (pathname === '/admin/whiteboard-editor') return 'canliharita';
  if (pathname === '/admin/manage-access') return '2fa';
  if (pathname === '/admin/notification-editor') return 'bildirimler';
  if (pathname === '/admin/users') return 'kullanicilar';
  if (pathname === '/admin/permissions') return 'yetkilendirme';

  // Check query params for main admin tabs
  const params = new URLSearchParams(search);
  const tab = params.get('tab') as TabType | null;
  return tab || 'dashboard';
};

export const AdminLayout = ({ children, activeTab: propActiveTab }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isSuperAdmin, allowedTabs, isLoading: permLoading } = useUserPermissions();

  const activeTab = propActiveTab || getActiveTabFromPath(location.pathname, location.search);

  // Filter sidebar items based on permissions
  const sidebarItems = allSidebarItems.filter(item => {
    // 2FA and yetkilendirme only visible to super admins
    if (item.id === '2fa' || item.id === 'yetkilendirme') {
      return isSuperAdmin;
    }
    // Super admin sees everything
    if (isSuperAdmin) return true;
    // Check if user has permission for this tab
    return allowedTabs.includes(item.id as TabKey);
  });

  const handleTabClick = (item: (typeof allSidebarItems)[number]) => {
    navigate(item.path);
  };

  if (permLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`border-b border-border ${isCollapsed ? 'p-3' : 'p-6'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Shield className={`text-primary shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}`} />
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="mt-4">
              <SessionTimeoutIndicator />
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const buttonContent = (
                <button
                  onClick={() => handleTabClick(item)}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                    isCollapsed 
                      ? 'justify-center p-3' 
                      : 'gap-3 px-4 py-3'
                  } ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );

              if (isCollapsed) {
                return (
                  <li key={item.id}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        {buttonContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.id}>{buttonContent}</li>;
            })}
          </ul>
        </nav>

        <div className={`border-t border-border ${isCollapsed ? 'p-2' : 'p-4'} space-y-2`}>
          {/* Toggle Button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={isCollapsed ? 'icon' : 'default'}
                className={`${isCollapsed ? 'w-full' : 'w-full'}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <>
                    <PanelLeftClose className="w-5 h-5 mr-2" />
                    <span>Menüyü Kapat</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Menüyü Aç
              </TooltipContent>
            )}
          </Tooltip>

          {/* Home Button */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="w-full" onClick={() => navigate('/')}>
                  <Shield className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Ana Sayfaya Dön
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
