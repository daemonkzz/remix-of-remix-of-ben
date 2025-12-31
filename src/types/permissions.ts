export interface AdminPermission {
  id: string;
  name: string;
  description: string | null;
  allowed_tabs: string[];
  can_manage_users: boolean;
  can_manage_applications: boolean;
  can_manage_forms: boolean;
  can_manage_updates: boolean;
  can_manage_rules: boolean;
  can_manage_gallery: boolean;
  can_manage_notifications: boolean;
  can_manage_whiteboard: boolean;
  can_manage_glossary: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UserAdminPermission {
  id: string;
  user_id: string;
  permission_id: string;
  assigned_by: string | null;
  assigned_at: string;
  permission?: AdminPermission;
}

export interface UserWithPermissions {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  steam_id: string | null;
  is_whitelist_approved: boolean | null;
  is_banned: boolean;
  banned_at: string | null;
  banned_by: string | null;
  ban_reason: string | null;
  created_at: string;
  permissions: AdminPermission[];
  roles: AppRole[];
}

export type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export const TAB_NAMES = {
  dashboard: 'Dashboard',
  basvurular: 'Başvurular',
  formlar: 'Form Şablonları',
  guncellemeler: 'Güncellemeler',
  bildirimler: 'Bildirimler',
  kurallar: 'Kurallar',
  sozluk: 'Terimler Sözlüğü',
  galeri: 'Medya Galeri',
  canliharita: 'Canlı Harita',
  kullanicilar: 'Kullanıcılar',
  yetkilendirme: 'Yetki Yönetimi',
} as const;

export type TabKey = keyof typeof TAB_NAMES;

export const ALL_TABS: TabKey[] = [
  'dashboard',
  'basvurular',
  'formlar',
  'guncellemeler',
  'bildirimler',
  'kurallar',
  'sozluk',
  'galeri',
  'canliharita',
  'kullanicilar',
  'yetkilendirme',
];
