import { useState, useEffect, useRef } from 'react';
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
  
  // Grace period ref to prevent instant empty state
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStableUsersRef = useRef<OnlineUser[]>([]);

  useEffect(() => {
    const channelConfig: any = {
      config: {},
    };

    // Only set presence key if user is authenticated
    if (user) {
      channelConfig.config.presence = {
        key: user.id,
      };
    }

    const channel = supabase.channel(channelName, channelConfig);

    const updateUsers = (users: OnlineUser[]) => {
      // Sort deterministically by user_id to prevent layout jumps
      const sortedUsers = [...users].sort((a, b) => a.user_id.localeCompare(b.user_id));
      
      // Clear any pending grace timeout
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
        graceTimeoutRef.current = null;
      }
      
      if (sortedUsers.length === 0 && lastStableUsersRef.current.length > 0) {
        // Going from users to empty - use grace period
        graceTimeoutRef.current = setTimeout(() => {
          setOnlineUsers([]);
          lastStableUsersRef.current = [];
        }, 300);
      } else {
        // Normal update - check if IDs actually changed
        const prevIds = lastStableUsersRef.current.map(u => u.user_id).join(',');
        const newIds = sortedUsers.map(u => u.user_id).join(',');
        
        if (prevIds !== newIds) {
          setOnlineUsers(sortedUsers);
          lastStableUsersRef.current = sortedUsers;
        }
      }
    };

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

        updateUsers(users);
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
          // Only track presence if user is authenticated
          if (user) {
            await channel.track({
              user_id: user.id,
              username: profile?.username || null,
              avatar_url: profile?.avatar_url || null,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
      }
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [user, profile, channelName]);

  return { onlineUsers, isConnected, currentUserId: user?.id };
};
