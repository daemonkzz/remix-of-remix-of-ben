import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldX,
  QrCode,
  Trash2,
  Unlock,
  Loader2,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { generateTOTP, getTOTPAuthUri } from '@epic-web/totp';
import QRCode from 'qrcode';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Admin2FASettings, AdminUser } from '@/types/admin2fa';

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  steam_id: string | null;
}

interface AdminListItem {
  id: string;
  user_id: string;
  is_provisioned: boolean;
  is_blocked: boolean;
  failed_attempts: number;
  profile: ProfileData | null;
}

const ManageAccessContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ProfileData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [adminList, setAdminList] = useState<AdminListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [provisioningUserId, setProvisioningUserId] = useState<string | null>(null);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [secretWarningShown, setSecretWarningShown] = useState(false);
  const [viewingQrUserId, setViewingQrUserId] = useState<string | null>(null);
  const [qrModalUsername, setQrModalUsername] = useState<string | null>(null);

  // Modal kapandığında hassas verileri temizle
  const handleQrModalClose = (open: boolean) => {
    if (!open) {
      // Güvenlik için tüm hassas state'leri temizle
      setQrCodeUrl(null);
      setTotpSecret(null);
      setSecretCopied(false);
      setSecretWarningShown(false);
      setViewingQrUserId(null);
      setQrModalUsername(null);
    }
    setQrModalOpen(open);
  };

  // Secret'ı maskele (ilk ve son 4 karakter görünsün)
  const getMaskedSecret = (secret: string): string => {
    if (secret.length <= 8) return secret;
    const first4 = secret.slice(0, 4);
    const last4 = secret.slice(-4);
    const masked = '*'.repeat(Math.min(secret.length - 8, 16));
    return `${first4}${masked}${last4}`;
  };

  // Fetch admin list
  const fetchAdminList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      // First get all 2FA settings
      const { data: settings, error: settingsError } = await supabase
        .from('admin_2fa_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (settingsError) {
        if (import.meta.env.DEV) console.error('Error fetching admin list:', settingsError);
        toast.error('Yetki listesi yüklenirken hata oluştu');
        return;
      }

      if (!settings || settings.length === 0) {
        setAdminList([]);
        return;
      }

      // Get profiles for all users
      const userIds = settings.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, discord_id, steam_id')
        .in('id', userIds);

      if (profilesError) {
        if (import.meta.env.DEV) console.error('Error fetching profiles:', profilesError);
      }

      // Merge data
      const list: AdminListItem[] = settings.map(setting => ({
        id: setting.id,
        user_id: setting.user_id,
        is_provisioned: setting.is_provisioned ?? false,
        is_blocked: setting.is_blocked ?? false,
        failed_attempts: setting.failed_attempts ?? 0,
        profile: profiles?.find(p => p.id === setting.user_id) || null,
      }));

      setAdminList(list);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching admin list:', error);
      toast.error('Yetki listesi yüklenirken hata oluştu');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminList();
  }, [fetchAdminList]);

  // Sanitize search input to prevent SQL injection
  const sanitizeSearchInput = (input: string): string => {
    // Remove special characters that could be used for SQL injection
    // Allow only alphanumeric, spaces, underscores, and hyphens
    return input.replace(/[^a-zA-Z0-9\s_\-]/g, '').substring(0, 100);
  };

  // Search user
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Lütfen kullanıcı adı, Discord ID veya Steam ID girin');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);

    try {
      const rawQuery = searchQuery.trim();
      const sanitizedQuery = sanitizeSearchInput(rawQuery);

      if (!sanitizedQuery) {
        setSearchError('Geçersiz arama sorgusu');
        setIsSearching(false);
        return;
      }

      // Use separate filter calls instead of string interpolation to prevent SQL injection
      // First try exact match on discord_id or steam_id
      let data = null;
      let error = null;

      // Try username search with ilike
      const usernameResult = await supabase
        .from('profiles')
        .select('id, username, avatar_url, discord_id, steam_id')
        .ilike('username', `%${sanitizedQuery}%`)
        .limit(1)
        .maybeSingle();

      if (usernameResult.data) {
        data = usernameResult.data;
      } else if (!usernameResult.error) {
        // Try exact match on discord_id
        const discordResult = await supabase
          .from('profiles')
          .select('id, username, avatar_url, discord_id, steam_id')
          .eq('discord_id', sanitizedQuery)
          .limit(1)
          .maybeSingle();

        if (discordResult.data) {
          data = discordResult.data;
        } else if (!discordResult.error) {
          // Try exact match on steam_id
          const steamResult = await supabase
            .from('profiles')
            .select('id, username, avatar_url, discord_id, steam_id')
            .eq('steam_id', sanitizedQuery)
            .limit(1)
            .maybeSingle();

          data = steamResult.data;
          error = steamResult.error;
        } else {
          error = discordResult.error;
        }
      } else {
        error = usernameResult.error;
      }

      if (error) {
        if (import.meta.env.DEV) console.error('Search error:', error);
        setSearchError('Arama yapılırken hata oluştu');
        return;
      }

      if (!data) {
        setSearchError('Kullanıcı bulunamadı');
        return;
      }

      // Check if already in admin list
      const alreadyAdmin = adminList.some(a => a.user_id === data.id);
      if (alreadyAdmin) {
        setSearchError('Bu kullanıcı zaten yetki listesinde');
        return;
      }

      setSearchResult(data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Search error:', error);
      setSearchError('Arama yapılırken hata oluştu');
    } finally {
      setIsSearching(false);
    }
  };

  // Add user to admin list
  const handleAddUser = async (userId: string) => {
    setAddingUserId(userId);
    try {
      // Not: user_roles'a ekleme yapmıyoruz artık
      // Yetkiler admin_permissions tablosu üzerinden yönetiliyor
      // Sadece admin_2fa_settings kaydı oluşturuyoruz

      // 2. Sonra admin_2fa_settings tablosuna kayıt ekle
      const { error } = await supabase
        .from('admin_2fa_settings')
        .insert({
          user_id: userId,
          is_provisioned: false,
          is_blocked: false,
          failed_attempts: 0,
        });

      if (error) {
        if (import.meta.env.DEV) console.error('Add user error:', error);
        // Duplicate key hatası (PostgreSQL error code: 23505)
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          toast.info('Bu kullanıcı zaten yetki listesinde');
          fetchAdminList(); // Listeyi yenile
          setSearchResult(null);
          setSearchQuery('');
          return;
        }
        toast.error('Kullanıcı eklenirken hata oluştu');
        return;
      }

      toast.success('Kullanıcı yetki listesine eklendi');
      setSearchResult(null);
      setSearchQuery('');
      fetchAdminList();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Add user error:', error);
      toast.error('Kullanıcı eklenirken hata oluştu');
    } finally {
      setAddingUserId(null);
    }
  };

  // Remove user from admin list
  const handleRemoveUser = async () => {
    if (!removingUserId) return;

    try {
      // 1. admin_2fa_settings'den sil
      const { error } = await supabase
        .from('admin_2fa_settings')
        .delete()
        .eq('user_id', removingUserId);

      if (error) {
        if (import.meta.env.DEV) console.error('Remove user error:', error);
        toast.error('Kullanıcı silinirken hata oluştu');
        return;
      }

      // Not: user_roles'dan silme yapmıyoruz artık
      // Yetkiler admin_permissions tablosu üzerinden yönetiliyor

      toast.success('Kullanıcı yetki listesinden kaldırıldı');
      fetchAdminList();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Remove user error:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Provision 2FA (generate secret and show QR)
  const handleProvision = async (userId: string, username: string | null) => {
    setProvisioningUserId(userId);
    try {
      // Generate TOTP secret
      const { secret, otp, ...totpConfig } = await generateTOTP({
        algorithm: 'SHA-1',
        period: 30,
        digits: 6,
      });

      // Create OTP Auth URI using the library function
      const otpAuthUri = getTOTPAuthUri({
        secret,
        issuer: 'HayalRP Admin',
        accountName: username || 'Admin',
        algorithm: 'SHA-1',
        digits: 6,
        period: 30,
      });

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(otpAuthUri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      });

      // Save secret to database
      const { error } = await supabase
        .from('admin_2fa_settings')
        .update({
          totp_secret: secret,
          is_provisioned: true,
        })
        .eq('user_id', userId);

      if (error) {
        if (import.meta.env.DEV) console.error('Provision error:', error);
        toast.error('2FA kurulumu yapılırken hata oluştu');
        return;
      }

      // Show QR modal
      setQrCodeUrl(qrDataUrl);
      setTotpSecret(secret);
      setQrModalUsername(username);
      setQrModalOpen(true);


      toast.success('2FA kurulumu tamamlandı');
      fetchAdminList();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Provision error:', error);
      toast.error('2FA kurulumu yapılırken hata oluştu');
    } finally {
      setProvisioningUserId(null);
    }
  };

  // View existing QR code (for already provisioned users)
  const handleViewQR = async (userId: string, username: string | null) => {
    setViewingQrUserId(userId);
    try {
      // Get the existing secret from database
      const { data, error } = await supabase
        .from('admin_2fa_settings')
        .select('totp_secret')
        .eq('user_id', userId)
        .single();

      if (error || !data?.totp_secret) {
        toast.error('2FA bilgisi bulunamadı');
        return;
      }

      const secret = data.totp_secret;

      // Create OTP Auth URI using the library function
      const otpAuthUri = getTOTPAuthUri({
        secret,
        issuer: 'HayalRP Admin',
        accountName: username || 'Admin',
        algorithm: 'SHA-1',
        digits: 6,
        period: 30,
      });

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(otpAuthUri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      });

      // Show QR modal
      setQrCodeUrl(qrDataUrl);
      setTotpSecret(secret);
      setQrModalUsername(username);
      setQrModalOpen(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error('View QR error:', error);
      toast.error('QR kodu görüntülenirken hata oluştu');
    } finally {
      setViewingQrUserId(null);
    }
  };
  // Unblock user
  const handleUnblock = async () => {
    if (!unblockingUserId) return;

    try {
      const { error } = await supabase
        .from('admin_2fa_settings')
        .update({
          is_blocked: false,
          failed_attempts: 0,
          last_failed_at: null,
        })
        .eq('user_id', unblockingUserId);

      if (error) {
        if (import.meta.env.DEV) console.error('Unblock error:', error);
        toast.error('Blokaj kaldırılırken hata oluştu');
        return;
      }

      toast.success('Kullanıcı blokajı kaldırıldı');
      fetchAdminList();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Unblock error:', error);
      toast.error('Blokaj kaldırılırken hata oluştu');
    } finally {
      setUnblockingUserId(null);
    }
  };

  // Copy secret to clipboard
  const copySecret = async () => {
    if (totpSecret) {
      await navigator.clipboard.writeText(totpSecret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);

      // Güvenlik uyarısı göster (sadece bir kez)
      if (!secretWarningShown) {
        toast.warning('Bu secret\'ı güvenli bir yerde saklayın. Modal kapandıktan sonra tekrar gösterilmeyecek!', {
          duration: 5000,
        });
        setSecretWarningShown(true);
      } else {
        toast.success('Secret kopyalandı');
      }
    }
  };

  // Get status badge
  const getStatusBadge = (item: AdminListItem) => {
    if (item.is_blocked) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bloklu</Badge>;
    }
    if (!item.is_provisioned) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">QR Bekliyor</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Hazır</Badge>;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Yetki Yönetimi
        </h2>
        <p className="text-muted-foreground">Admin erişimi yönetimi ve 2FA kurulumu</p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Kullanıcı Ara
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Kullanıcı adı, Discord ID veya Steam ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Ara'
              )}
            </Button>
          </div>

          {/* Search Error */}
          {searchError && (
            <p className="text-sm text-destructive mt-3">{searchError}</p>
          )}

          {/* Search Result */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 border border-border rounded-lg bg-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={searchResult.avatar_url || undefined} />
                  <AvatarFallback>{searchResult.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{searchResult.username || 'İsimsiz'}</p>
                  <p className="text-xs text-muted-foreground">
                    {searchResult.discord_id && `Discord: ${searchResult.discord_id}`}
                    {searchResult.steam_id && ` | Steam: ${searchResult.steam_id}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleAddUser(searchResult.id)}
                disabled={addingUserId === searchResult.id}
                size="sm"
              >
                {addingUserId === searchResult.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Yetki Listesine Ekle
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Admin List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Yetkili Listesi
          </h3>

          {isLoadingList ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : adminList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz yetkili kullanıcı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={item.profile?.avatar_url || undefined} />
                          <AvatarFallback>{item.profile?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.profile?.username || 'İsimsiz'}</p>
                          {item.profile?.discord_id && (
                            <p className="text-xs text-muted-foreground">Discord: {item.profile.discord_id}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View QR Button - for provisioned users */}
                        {item.is_provisioned && !item.is_blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewQR(item.user_id, item.profile?.username || null)}
                            disabled={viewingQrUserId === item.user_id}
                          >
                            {viewingQrUserId === item.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                QR Görüntüle
                              </>
                            )}
                          </Button>
                        )}

                        {/* Provision Button - for not provisioned users */}
                        {!item.is_provisioned && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProvision(item.user_id, item.profile?.username || null)}
                            disabled={provisioningUserId === item.user_id}
                          >
                            {provisioningUserId === item.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <QrCode className="w-4 h-4 mr-1" />
                                QR Oluştur
                              </>
                            )}
                          </Button>
                        )}

                        {/* Unblock Button */}
                        {item.is_blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnblockingUserId(item.user_id)}
                          >
                            <Unlock className="w-4 h-4 mr-1" />
                            Blokajı Kaldır
                          </Button>
                        )}

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemovingUserId(item.user_id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={handleQrModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              2FA Kurulumu
              {qrModalUsername && (
                <Badge variant="outline" className="ml-2">{qrModalUsername}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Bu bilgileri kullanıcıyla paylaşın. Kullanıcı bu secret'ı authenticator uygulamasına ekleyecek.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl && (
              <div className="p-4 bg-muted rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}

            {totpSecret && (
              <div className="w-full space-y-4">
                {/* Secret Key - Full Display for Sharing */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">
                    🔑 TOTP Secret Key
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono text-center break-all border select-all">
                      {totpSecret}
                    </code>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={copySecret}
                      title="Secret'ı kopyala"
                    >
                      {secretCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Instructions for Admin */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">
                    📋 Kullanıcıya Paylaşım Talimatları:
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Yukarıdaki secret key'i kullanıcıyla güvenli bir şekilde paylaşın</li>
                    <li>Kullanıcı bu kodu Google Authenticator veya benzeri uygulamaya eklesin</li>
                    <li>Kullanıcı artık admin paneline giriş yapabilir</li>
                  </ol>
                </div>

                <p className="text-xs text-destructive text-center font-medium">
                  ⚠️ Bu secret'ı sadece ilgili kullanıcıyla paylaşın!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      {/* Remove User Confirmation */}
      <AlertDialog open={!!removingUserId} onOpenChange={() => setRemovingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcıyı yetki listesinden kaldırmak istediğinize emin misiniz?
              Admin paneline erişimi kaybolacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveUser}
            >
              Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock User Confirmation */}
      <AlertDialog open={!!unblockingUserId} onOpenChange={() => setUnblockingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blokajı Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcının blokajını kaldırmak istediğinize emin misiniz?
              Başarısız deneme sayısı sıfırlanacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock}>
              Blokajı Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ManageAccess = () => {
  return (
    <AdminLayout activeTab="yetkilendirme">
      <ManageAccessContent />
    </AdminLayout>
  );
};

export default ManageAccess;
