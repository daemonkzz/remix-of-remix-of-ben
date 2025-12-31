import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserWithPermissions, AppRole } from '@/types/permissions';

interface UseUsersManagementReturn {
  users: UserWithPermissions[];
  isLoading: boolean;
  totalCount: number;
  fetchUsers: (options?: FetchUsersOptions) => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<boolean>;
  unbanUser: (userId: string) => Promise<boolean>;
  updateWhitelistStatus: (userId: string, approved: boolean) => Promise<boolean>;
  sendNotification: (userId: string, title: string, content: string) => Promise<boolean>;
}

interface FetchUsersOptions {
  search?: string;
  onlyAdmins?: boolean;
  onlyBanned?: boolean;
  page?: number;
  pageSize?: number;
}

export const useUsersManagement = (): UseUsersManagementReturn => {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async (options: FetchUsersOptions = {}) => {
    const { search = '', onlyAdmins = false, onlyBanned = false, page = 1, pageSize = 50 } = options;
    setIsLoading(true);

    try {
      // Build base query
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`username.ilike.%${search}%,discord_id.ilike.%${search}%`);
      }

      // Apply banned filter
      if (onlyBanned) {
        query = query.eq('is_banned', true);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: profilesData, error: profilesError, count } = await query;

      if (profilesError) {
        console.error('Fetch users error:', profilesError);
        toast.error('Kullanıcılar yüklenirken hata oluştu');
        return;
      }

      if (!profilesData) {
        setUsers([]);
        setTotalCount(0);
        return;
      }

      // Fetch roles for all users
      const userIds = profilesData.map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Fetch permissions for all users
      const { data: userPermsData } = await supabase
        .from('user_admin_permissions')
        .select('user_id, permission_id, admin_permissions(*)')
        .in('user_id', userIds);

      // Map users with their roles and permissions
      let mappedUsers: UserWithPermissions[] = profilesData.map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role as AppRole);
        
        const userPermissions = (userPermsData || [])
          .filter(up => up.user_id === profile.id)
          .map(up => up.admin_permissions as any)
          .filter(Boolean);

        return {
          ...profile,
          is_banned: profile.is_banned ?? false,
          roles: userRoles,
          permissions: userPermissions,
        };
      });

      // Filter only admins if requested (super_admin or has permissions)
      if (onlyAdmins) {
        mappedUsers = mappedUsers.filter(u => 
          u.roles.includes('super_admin') || 
          u.permissions.length > 0
        );
      }

      setUsers(mappedUsers);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const banUser = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: reason,
        })
        .eq('id', userId);

      if (error) {
        console.error('Ban user error:', error);
        toast.error('Kullanıcı yasaklanırken hata oluştu');
        return false;
      }

      toast.success('Kullanıcı yasaklandı');
      return true;
    } catch (error) {
      console.error('Ban user error:', error);
      toast.error('Kullanıcı yasaklanırken hata oluştu');
      return false;
    }
  }, []);

  const unbanUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null,
        })
        .eq('id', userId);

      if (error) {
        console.error('Unban user error:', error);
        toast.error('Yasak kaldırılırken hata oluştu');
        return false;
      }

      toast.success('Kullanıcı yasağı kaldırıldı');
      return true;
    } catch (error) {
      console.error('Unban user error:', error);
      toast.error('Yasak kaldırılırken hata oluştu');
      return false;
    }
  }, []);

  const updateWhitelistStatus = useCallback(async (userId: string, approved: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_whitelist_approved: approved })
        .eq('id', userId);

      if (error) {
        console.error('Update whitelist error:', error);
        toast.error('Whitelist durumu güncellenirken hata oluştu');
        return false;
      }

      toast.success(approved ? 'Whitelist onaylandı' : 'Whitelist kaldırıldı');
      return true;
    } catch (error) {
      console.error('Update whitelist error:', error);
      toast.error('Whitelist durumu güncellenirken hata oluştu');
      return false;
    }
  }, []);

  const sendNotification = useCallback(async (userId: string, title: string, content: string): Promise<boolean> => {
    try {
      // Create notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title,
          content,
          is_global: false,
        })
        .select()
        .single();

      if (notifError) {
        console.error('Create notification error:', notifError);
        toast.error('Bildirim oluşturulurken hata oluştu');
        return false;
      }

      // Create recipient
      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert({
          notification_id: notification.id,
          user_id: userId,
        });

      if (recipientError) {
        console.error('Create recipient error:', recipientError);
        toast.error('Bildirim gönderilirken hata oluştu');
        return false;
      }

      toast.success('Bildirim gönderildi');
      return true;
    } catch (error) {
      console.error('Send notification error:', error);
      toast.error('Bildirim gönderilirken hata oluştu');
      return false;
    }
  }, []);

  return {
    users,
    isLoading,
    totalCount,
    fetchUsers,
    banUser,
    unbanUser,
    updateWhitelistStatus,
    sendNotification,
  };
};
