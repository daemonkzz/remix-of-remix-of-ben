import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { throttle } from 'lodash';

export interface MapState {
  scale: number;
  position: { x: number; y: number };
}

// Normalized coordinates (0-1) relative to the map image
export interface CursorPosition {
  u: number; // normalized X (0-1) on the map image
  v: number; // normalized Y (0-1) on the map image
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  color: string;
  lastUpdate: number;
}

export interface PingPosition {
  id: string;
  u: number; // normalized X (0-1) on the map image
  v: number; // normalized Y (0-1) on the map image
  user_id: string;
  color: string;
  timestamp: number;
}

// Generate a vibrant border color based on user ID
const generateUserColor = (userId: string): string => {
  const colors = [
    '#ef4444', // Kırmızı
    '#22c55e', // Yeşil
    '#3b82f6', // Mavi
    '#f97316', // Turuncu
    '#a855f7', // Mor
    '#06b6d4', // Cyan
    '#ec4899', // Pembe
    '#eab308', // Sarı
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

interface UseCursorSyncOptions {
  channelName?: string;
  isActive?: boolean;
  mapState?: MapState;
}

export const useCursorSync = ({
  channelName = 'cursor-hikaye-tablosu',
  isActive = true,
  mapState = { scale: 1, position: { x: 0, y: 0 } }
}: UseCursorSyncOptions = {}) => {
  const { user, profile } = useAuth();
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [pings, setPings] = useState<PingPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const myColor = user ? generateUserColor(user.id) : '#fff';

  // Cleanup stale cursors and pings
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Clean stale cursors (3s)
      setCursors(prev => {
        const updated = new Map(prev);
        let hasChanges = false;
        
        updated.forEach((cursor, id) => {
          if (now - cursor.lastUpdate > 3000) {
            updated.delete(id);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });

      // Clean old pings (3s)
      setPings(prev => {
        const filtered = prev.filter(p => now - p.timestamp < 3000);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    // Allow non-authenticated users to listen (but not send)
    if (!isActive) {
      setCursors(new Map());
      setPings([]);
      setIsConnected(false);
      return;
    }

    const channelConfig: any = {
      config: {
        broadcast: {
          self: false,
        },
      },
    };

    // Only set presence key if user is authenticated
    if (user) {
      channelConfig.config.presence = {
        key: user.id,
      };
    }

    const channel = supabase.channel(channelName, channelConfig);

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newCursors = new Map<string, CursorPosition>();

        Object.keys(state).forEach((key) => {
          if (user && key === user.id) return; // Skip own cursor if logged in
          
          const presences = state[key] as unknown as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            // Use normalized u,v coordinates
            if (presence.cursor && typeof presence.cursor.u === 'number') {
              newCursors.set(key, {
                u: presence.cursor.u,
                v: presence.cursor.v,
                user_id: presence.user_id,
                username: presence.username,
                avatar_url: presence.avatar_url,
                color: generateUserColor(key),
                lastUpdate: Date.now(),
              });
            }
          }
        });

        setCursors(newCursors);
      })
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        if (payload && typeof payload.u === 'number') {
          const pingData: PingPosition = {
            id: `${payload.user_id}-${payload.timestamp}`,
            u: payload.u,
            v: payload.v,
            user_id: payload.user_id,
            color: generateUserColor(payload.user_id),
            timestamp: payload.timestamp,
          };
          
          setPings(prev => {
            // Limit to 5 active pings, remove oldest if needed
            const updated = [...prev, pingData];
            if (updated.length > 5) {
              return updated.slice(-5);
            }
            return updated;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [user, channelName, isActive]);

  // Throttled cursor update function - sends normalized (u,v) coordinates
  const updateCursor = useCallback(
    throttle(async (u: number, v: number) => {
      if (!channelRef.current || !user || !isActive) return;

      // Only send if within bounds (0-1)
      if (u < 0 || u > 1 || v < 0 || v > 1) return;

      await channelRef.current.track({
        user_id: user.id,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        cursor: { u, v },
        online_at: new Date().toISOString(),
      });
    }, 50),
    [user, profile, isActive]
  );

  // Send ping at normalized coordinates
  const sendPing = useCallback((u: number, v: number) => {
    if (!channelRef.current || !user || !isActive) return false;

    // Validate coordinates
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;

    const now = Date.now();
    // Cooldown: 2 seconds between pings
    if (now - lastPingTimeRef.current < 2000) {
      return false;
    }

    lastPingTimeRef.current = now;

    // Broadcast ping to all users
    channelRef.current.send({
      type: 'broadcast',
      event: 'ping',
      payload: {
        u,
        v,
        user_id: user.id,
        timestamp: now,
      },
    });

    // Also add to own pings for immediate feedback
    const pingData: PingPosition = {
      id: `${user.id}-${now}`,
      u,
      v,
      user_id: user.id,
      color: myColor,
      timestamp: now,
    };
    
    setPings(prev => {
      const updated = [...prev, pingData];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });

    return true;
  }, [user, isActive, myColor]);

  // Clear cursor when leaving
  const handleMouseLeave = useCallback(async () => {
    if (!channelRef.current || !user || !isActive) return;

    await channelRef.current.track({
      user_id: user.id,
      username: profile?.username || null,
      avatar_url: profile?.avatar_url || null,
      cursor: null,
      online_at: new Date().toISOString(),
    });
  }, [user, profile, isActive]);

  return {
    cursors: Array.from(cursors.values()),
    pings,
    isConnected,
    updateCursor,
    handleMouseLeave,
    sendPing,
    myColor,
    currentUserId: user?.id,
    mapState,
  };
};
