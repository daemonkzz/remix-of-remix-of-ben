import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  content: string;
  is_global: boolean;
  created_at: string;
  is_read: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch global notifications
      const { data: globalNotifications, error: globalError } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_global', true)
        .order('created_at', { ascending: false });

      if (globalError) {
        console.error('Error fetching global notifications:', globalError);
      }

      // Fetch user-specific notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notification_recipients')
        .select(`
          notification_id,
          is_read,
          read_at,
          notifications (
            id,
            title,
            content,
            is_global,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching user notifications:', userError);
      }

      // Fetch read status for global notifications
      const { data: globalReads, error: readsError } = await supabase
        .from('user_global_notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) {
        console.error('Error fetching global reads:', readsError);
      }

      const globalReadIds = new Set(globalReads?.map(r => r.notification_id) || []);

      // Combine and format notifications
      const formattedGlobal: Notification[] = (globalNotifications || []).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        is_global: true,
        created_at: n.created_at,
        is_read: globalReadIds.has(n.id)
      }));

      const formattedUser: Notification[] = (userNotifications || [])
        .filter(n => n.notifications)
        .map(n => {
          const notif = n.notifications as any;
          return {
            id: notif.id,
            title: notif.title,
            content: notif.content,
            is_global: false,
            created_at: notif.created_at,
            is_read: n.is_read
          };
        });

      // Merge and sort by date (newest first)
      const allNotifications = [...formattedGlobal, ...formattedUser]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Remove duplicates (in case a global notification also has a recipient entry)
      const uniqueNotifications = allNotifications.filter(
        (n, index, self) => index === self.findIndex(t => t.id === n.id)
      );

      setNotifications(uniqueNotifications);
      setUnreadCount(uniqueNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.is_read) return;

    try {
      if (notification.is_global) {
        // For global notifications, insert into user_global_notification_reads
        await supabase
          .from('user_global_notification_reads')
          .upsert({
            notification_id: notificationId,
            user_id: user.id,
            read_at: new Date().toISOString()
          }, { onConflict: 'notification_id,user_id' });
      } else {
        // For user-specific notifications, update notification_recipients
        await supabase
          .from('notification_recipients')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('notification_id', notificationId)
          .eq('user_id', user.id);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user, notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      const globalUnread = unreadNotifications.filter(n => n.is_global);
      const userUnread = unreadNotifications.filter(n => !n.is_global);

      // Mark global notifications as read
      if (globalUnread.length > 0) {
        const globalInserts = globalUnread.map(n => ({
          notification_id: n.id,
          user_id: user.id,
          read_at: new Date().toISOString()
        }));

        await supabase
          .from('user_global_notification_reads')
          .upsert(globalInserts, { onConflict: 'notification_id,user_id' });
      }

      // Mark user-specific notifications as read
      if (userUnread.length > 0) {
        await supabase
          .from('notification_recipients')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_read', false);
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
