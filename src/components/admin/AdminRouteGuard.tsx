import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldX, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

type GuardStatus = 
  | 'loading'
  | 'not_logged_in'
  | 'not_admin'
  | 'no_2fa_record'
  | 'not_provisioned'
  | 'blocked'
  | 'needs_2fa'
  | 'authorized';

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdminAuthenticated, isLoading: sessionLoading, admin2FASettings } = useAdminSession();
  const [hasAdminRole, setHasAdminRole] = useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setHasAdminRole(false);
        setIsCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setHasAdminRole(false);
        } else {
          setHasAdminRole(data);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setHasAdminRole(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Skip guard for lock screen
  if (location.pathname === '/admin/locked') {
    return <>{children}</>;
  }

  // Determine guard status
  const getGuardStatus = (): GuardStatus => {
    if (authLoading || sessionLoading || isCheckingRole) {
      return 'loading';
    }
    if (!user) {
      return 'not_logged_in';
    }
    if (!hasAdminRole) {
      return 'not_admin';
    }
    if (!admin2FASettings) {
      return 'no_2fa_record';
    }
    if (!admin2FASettings.is_provisioned) {
      return 'not_provisioned';
    }
    if (admin2FASettings.is_blocked) {
      return 'blocked';
    }
    if (!isAdminAuthenticated) {
      return 'needs_2fa';
    }
    return 'authorized';
  };

  const status = getGuardStatus();

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (status === 'not_logged_in') {
    return <Navigate to="/" replace />;
  }

  // Not admin
  if (status === 'not_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <ShieldX className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Erişim Reddedildi</h1>
          <p className="text-muted-foreground">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // No 2FA record (not added to admin list)
  if (status === 'no_2fa_record') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <ShieldX className="w-16 h-16 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Yetki Bulunamadı</h1>
          <p className="text-muted-foreground">
            Admin paneline erişim yetkiniz bulunmamaktadır. Bir yönetici tarafından yetkilendirilmeniz gerekmektedir.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Not provisioned (waiting for QR setup)
  if (status === 'not_provisioned') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <Clock className="w-16 h-16 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Yetkiniz Hazırlanıyor</h1>
          <p className="text-muted-foreground">
            Admin yetkiniz tanımlanmış ancak 2FA kurulumu henüz tamamlanmamış. Lütfen yönetici ile iletişime geçin.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Blocked
  if (status === 'blocked') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Hesap Bloklandı</h1>
          <p className="text-muted-foreground">
            Çok fazla başarısız giriş denemesi nedeniyle hesabınız bloklanmıştır. Lütfen yönetici ile iletişime geçin.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Needs 2FA verification
  if (status === 'needs_2fa') {
    return <Navigate to="/admin/locked" state={{ from: location.pathname }} replace />;
  }

  // Authorized
  return <>{children}</>;
};
