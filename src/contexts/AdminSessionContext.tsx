import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { verifyTOTP } from '@epic-web/totp';
import type { Admin2FASettings } from '@/types/admin2fa';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

interface AdminSessionContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  lockSession: () => void;
  remainingTime: number | null;
  admin2FASettings: Admin2FASettings | null;
  refetch2FASettings: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export const useAdminSession = () => {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
};

export const AdminSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin2FASettings, setAdmin2FASettings] = useState<Admin2FASettings | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Fetch user's 2FA settings
  const fetch2FASettings = useCallback(async () => {
    if (!user) {
      setAdmin2FASettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching 2FA settings:', error);
      }

      setAdmin2FASettings(data as Admin2FASettings | null);
    } catch (error) {
      console.error('Error fetching 2FA settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch2FASettings();
  }, [fetch2FASettings]);

  // Lock session and redirect to lock screen
  const lockSession = useCallback(() => {
    if (location.pathname !== '/admin/locked' && location.pathname.startsWith('/admin')) {
      setIsAdminAuthenticated(false);
      navigate('/admin/locked', { state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  // Handle idle timeout
  const onIdle = useCallback(() => {
    if (isAdminAuthenticated && location.pathname.startsWith('/admin') && location.pathname !== '/admin/locked') {
      lockSession();
    }
  }, [isAdminAuthenticated, location.pathname, lockSession]);

  // Idle timer
  const { getRemainingTime } = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle,
    debounce: 500,
    disabled: !isAdminAuthenticated || !location.pathname.startsWith('/admin') || location.pathname === '/admin/locked',
  });

  // Update remaining time periodically
  useEffect(() => {
    if (!isAdminAuthenticated) {
      setRemainingTime(null);
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime(Math.ceil(getRemainingTime() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated, getRemainingTime]);

  // Verify 2FA code
  const verify2FA = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !admin2FASettings?.totp_secret) {
      return { success: false, error: '2FA ayarları bulunamadı' };
    }

    if (admin2FASettings.is_blocked) {
      return { success: false, error: 'Hesabınız bloklanmış. Yönetici ile iletişime geçin.' };
    }

    try {
      // Verify the TOTP code
      const result = await verifyTOTP({
        otp: code,
        secret: admin2FASettings.totp_secret,
        window: 1, // Allow 1 period before/after for clock skew
      });

      if (result) {
        // Reset failed attempts on success
        await supabase
          .from('admin_2fa_settings')
          .update({ failed_attempts: 0, last_failed_at: null })
          .eq('user_id', user.id);

        setIsAdminAuthenticated(true);
        return { success: true };
      } else {
        // Increment failed attempts
        const newAttempts = (admin2FASettings.failed_attempts || 0) + 1;
        const shouldBlock = newAttempts >= 5;

        await supabase
          .from('admin_2fa_settings')
          .update({
            failed_attempts: newAttempts,
            last_failed_at: new Date().toISOString(),
            is_blocked: shouldBlock,
          })
          .eq('user_id', user.id);

        // Refresh settings
        await fetch2FASettings();

        if (shouldBlock) {
          return { success: false, error: 'Çok fazla başarısız deneme. Hesabınız bloklandı.' };
        }

        return { success: false, error: `Yanlış kod. ${5 - newAttempts} deneme hakkınız kaldı.` };
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: 'Doğrulama sırasında hata oluştu' };
    }
  }, [user, admin2FASettings, fetch2FASettings]);

  return (
    <AdminSessionContext.Provider
      value={{
        isAdminAuthenticated,
        isLoading,
        verify2FA,
        lockSession,
        remainingTime,
        admin2FASettings,
        refetch2FASettings: fetch2FASettings,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
};
