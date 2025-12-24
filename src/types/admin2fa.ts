export interface Admin2FASettings {
  id: string;
  user_id: string;
  totp_secret: string | null;
  is_provisioned: boolean;
  is_blocked: boolean;
  failed_attempts: number;
  last_failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  steam_id: string | null;
  twoFAStatus: 'not_added' | 'pending' | 'ready' | 'blocked';
}

export type Admin2FAStatus = 'pending' | 'ready' | 'blocked';
