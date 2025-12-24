import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { verifyTOTP } from '@epic-web/totp';
import type { Admin2FASettings } from '@/types/admin2fa';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const SESSION_KEY = 'admin_2fa_session';
const SESSION_EXPIRY_KEY = 'admin_2fa_session_expiry';

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

// Get stored session expiry (ms) for this user, if valid
const getStoredSessionExpiry = (userId: string): number | null => {
  try {
    const storedUserId = sessionStorage.getItem(SESSION_KEY);
    const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);

    if (!storedUserId || !expiryStr || storedUserId !== userId) {
      return null;
    }

    const expiry = parseInt(expiryStr, 10);
    if (!Number.isFinite(expiry) || Date.now() > expiry) {
      // Session expired, clear it
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      return null;
    }

    return expiry;
  } catch {
    return null;
  }
};

// Save/extend session in storage and return expiry (ms)
const saveSession = (userId: string): number | null => {
  try {
    const expiry = Date.now() + IDLE_TIMEOUT;
    sessionStorage.setItem(SESSION_KEY, userId);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    return expiry;
  } catch {
    return null;
  }
};

// Clear session from storage
const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const AdminSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin2FASettings, setAdmin2FASettings] = useState<Admin2FASettings | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Check stored session when auth state settles (avoid clearing on initial refresh)
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const expiry = getStoredSessionExpiry(user.id);
      const hasValidSession = !!expiry;

      setIsAdminAuthenticated(hasValidSession);
      setRemainingTime(null);

      if (!hasValidSession) {
        // Expired/wrong user session, keep storage clean
        clearSession();
      }
    } else {
      setIsAdminAuthenticated(false);
      setRemainingTime(null);
      clearSession();
    }
  }, [user, authLoading]);

  // Fetch user's 2FA settings
  const fetch2FASettings = useCallback(async () => {
    // Wait until auth state is resolved; otherwise refresh (F5) briefly looks like "no user"
    if (authLoading) return;

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
  }, [user, authLoading]);

  useEffect(() => {
    fetch2FASettings();
  }, [fetch2FASettings]);

  const isInAdminArea = location.pathname.startsWith('/admin') && location.pathname !== '/admin/locked';

  const createOrExtendSession = useCallback(
    (uid?: string | null) => {
      if (!uid) return null;
      const expiry = saveSession(uid);
      return expiry;
    },
    []
  );

  // Lock session and redirect to lock screen
  const lockSession = useCallback(() => {
    if (location.pathname !== '/admin/locked' && location.pathname.startsWith('/admin')) {
      setIsAdminAuthenticated(false);
      setRemainingTime(null);
      clearSession();
      navigate('/admin/locked', { state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  // Handle idle timeout
  const onIdle = useCallback(
    () => {
      if (isAdminAuthenticated && isInAdminArea) {
        lockSession();
      }
    },
    [isAdminAuthenticated, isInAdminArea, lockSession]
  );

  const onAction = useCallback(
    () => {
      if (!user?.id || !isAdminAuthenticated || !isInAdminArea) return;
      createOrExtendSession(user.id);
    },
    [user?.id, isAdminAuthenticated, isInAdminArea, createOrExtendSession]
  );

  const onActive = useCallback(
    () => {
      if (!user?.id || !isAdminAuthenticated || !isInAdminArea) return;
      createOrExtendSession(user.id);
    },
    [user?.id, isAdminAuthenticated, isInAdminArea, createOrExtendSession]
  );

  // Idle timer
  useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle,
    onAction,
    onActive,
    debounce: 500,
    disabled: !isAdminAuthenticated || !isInAdminArea,
  });

  // Update remaining time from session expiry in storage (stable + always decrements)
  useEffect(() => {
    if (!isAdminAuthenticated || !user?.id || !isInAdminArea) {
      setRemainingTime(null);
      return;
    }

    // Treat entering the admin area as activity: start a fresh 10:00 window.
    createOrExtendSession(user.id);

    const tick = () => {
      const expiry = getStoredSessionExpiry(user.id);
      if (!expiry) {
        lockSession();
        return;
      }

      const remainingSec = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemainingTime(remainingSec);

      if (remainingSec <= 0) {
        lockSession();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated, user?.id, isInAdminArea, createOrExtendSession, lockSession]);

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
        setRemainingTime(null);
        createOrExtendSession(user.id);
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
