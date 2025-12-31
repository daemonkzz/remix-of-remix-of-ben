import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  is_banned: boolean;
  ban_reason: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to clean URL hash
const cleanUrlHash = () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl);
  }
};

// Fetch user profile from database
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, discord_id, is_banned, ban_reason')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Profil yüklenirken hata:', error);
    return null;
  }
  
  return {
    ...data,
    is_banned: data.is_banned ?? false,
    ban_reason: data.ban_reason ?? null,
  };
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOT: OAuth dönüşlerinde bazı akışlarda token URL hash içinde gelir.
    // Supabase bunu okuyup oturumu kurmadan önce hash'i temizlemek oturumun hiç oluşmamasına yol açabilir.
    // Bu yüzden URL temizliğini yalnızca session oluştuğunda (aşağıda) yapıyoruz.

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Log user info on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Oturum Açıldı:', session.user.email);
          // Clean URL hash after OAuth redirect
          cleanUrlHash();
          // Fetch profile data with setTimeout to avoid deadlock
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile?.is_banned) {
              console.log('Kullanıcı yasaklı, çıkış yapılıyor');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setProfile(null);
              // Show ban message via alert since toast might not be available
              alert(`Hesabınız yasaklanmıştır. Sebep: ${userProfile.ban_reason || 'Belirtilmemiş'}`);
              return;
            }
            setProfile(userProfile);
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          console.log('Oturum Kapatıldı');
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        console.log('Mevcut Oturum:', session.user.email);
        // Clean URL hash if session exists
        cleanUrlHash();
        // Fetch profile data
        fetchUserProfile(session.user.id).then(setProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
