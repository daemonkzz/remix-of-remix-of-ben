import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnlineUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  online_at: string;
}

export const useOnlineUsers = (channelName: string = 'online-hikaye-users') => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as unknown as OnlineUser[];
          if (presences && presences.length > 0) {
            users.push(presences[0]);
          }
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            user_id: user.id,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [user, profile, channelName]);

  return { onlineUsers, isConnected, currentUserId: user?.id };
};
