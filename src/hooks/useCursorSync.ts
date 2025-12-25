import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { throttle } from 'lodash';

export interface MapState {
  scale: number;
  position: { x: number; y: number };
}

export interface CursorPosition {
  x: number; // viewport percentage (0-100)
  y: number; // viewport percentage (0-100)
  worldX: number; // world/map coordinate
  worldY: number; // world/map coordinate
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  color: string;
  lastUpdate: number;
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
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mapStateRef = useRef(mapState);
  const myColor = user ? generateUserColor(user.id) : '#fff';

  // Keep mapState ref updated
  useEffect(() => {
    mapStateRef.current = mapState;
  }, [mapState]);

  // Cleanup stale cursors (inactive for more than 3 seconds)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
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
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!user || !isActive) {
      setCursors(new Map());
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

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newCursors = new Map<string, CursorPosition>();

        Object.keys(state).forEach((key) => {
          if (key === user.id) return; // Skip own cursor
          
          const presences = state[key] as unknown as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            if (presence.cursor && typeof presence.cursor.worldX === 'number') {
              // Store world coordinates - CursorOverlay will do the viewport conversion
              newCursors.set(key, {
                x: 0, // Will be calculated by CursorOverlay
                y: 0, // Will be calculated by CursorOverlay
                worldX: presence.cursor.worldX,
                worldY: presence.cursor.worldY,
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

  // Throttled cursor update function - sends WORLD coordinates
  const updateCursor = useCallback(
    throttle(async (viewportX: number, viewportY: number, containerWidth: number, containerHeight: number) => {
      if (!channelRef.current || !user || !isActive) return;

      const { scale, position } = mapStateRef.current;
      
      // Convert viewport coordinates to world coordinates (center-anchored)
      // Scale transforms around center (50%, 50%), so we need center-relative math
      // position is in pixels, convert to percentage of container
      const offsetXPercent = (position.x / containerWidth) * 100;
      const offsetYPercent = (position.y / containerHeight) * 100;
      
      // Center-anchored: worldX = 50 + (viewportX - 50 - offset) / scale
      const worldX = 50 + (viewportX - 50 - offsetXPercent) / scale;
      const worldY = 50 + (viewportY - 50 - offsetYPercent) / scale;

      await channelRef.current.track({
        user_id: user.id,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        cursor: { worldX, worldY },
        online_at: new Date().toISOString(),
      });
    }, 50),
    [user, profile, isActive]
  );

  // Handle mouse move on container
  const handleMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!containerRef.current || !isActive) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Only send if within bounds
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      updateCursor(x, y, rect.width, rect.height);
    }
  }, [updateCursor, isActive]);

  // Handle touch move on container
  const handleTouchMove = useCallback((
    e: React.TouchEvent<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!containerRef.current || !isActive || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      updateCursor(x, y, rect.width, rect.height);
    }
  }, [updateCursor, isActive]);

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
    isConnected,
    handleMouseMove,
    handleTouchMove,
    handleMouseLeave,
    myColor,
    currentUserId: user?.id,
  };
};
