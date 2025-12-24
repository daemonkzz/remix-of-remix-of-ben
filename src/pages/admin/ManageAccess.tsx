import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Copy,
  Check
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
import { generateTOTP } from '@epic-web/totp';
import QRCode from 'qrcode';
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

const ManageAccess: React.FC = () => {
  const navigate = useNavigate();
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
        console.error('Error fetching admin list:', settingsError);
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
        console.error('Error fetching profiles:', profilesError);
      }

      // Merge data
      const list: AdminListItem[] = settings.map(setting => ({
        id: setting.id,
        user_id: setting.user_id,
        is_provisioned: setting.is_provisioned,
        is_blocked: setting.is_blocked,
        failed_attempts: setting.failed_attempts,
        profile: profiles?.find(p => p.id === setting.user_id) || null,
      }));

      setAdminList(list);
    } catch (error) {
      console.error('Error fetching admin list:', error);
      toast.error('Yetki listesi yüklenirken hata oluştu');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminList();
  }, [fetchAdminList]);

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
      const query = searchQuery.trim();
      
      // Search by username, discord_id, or steam_id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, discord_id, steam_id')
        .or(`username.ilike.%${query}%,discord_id.eq.${query},steam_id.eq.${query}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Search error:', error);
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
      console.error('Search error:', error);
      setSearchError('Arama yapılırken hata oluştu');
    } finally {
      setIsSearching(false);
    }
  };

  // Add user to admin list
  const handleAddUser = async (userId: string) => {
    setAddingUserId(userId);
    try {
      const { error } = await supabase
        .from('admin_2fa_settings')
        .insert({
          user_id: userId,
          is_provisioned: false,
          is_blocked: false,
          failed_attempts: 0,
        });

      if (error) {
        console.error('Add user error:', error);
        toast.error('Kullanıcı eklenirken hata oluştu');
        return;
      }

      toast.success('Kullanıcı yetki listesine eklendi');
      setSearchResult(null);
      setSearchQuery('');
      fetchAdminList();
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Kullanıcı eklenirken hata oluştu');
    } finally {
      setAddingUserId(null);
    }
  };

  // Remove user from admin list
  const handleRemoveUser = async () => {
    if (!removingUserId) return;

    try {
      const { error } = await supabase
        .from('admin_2fa_settings')
        .delete()
        .eq('user_id', removingUserId);

      if (error) {
        console.error('Remove user error:', error);
        toast.error('Kullanıcı silinirken hata oluştu');
        return;
      }

      toast.success('Kullanıcı yetki listesinden kaldırıldı');
      fetchAdminList();
    } catch (error) {
      console.error('Remove user error:', error);
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
        algorithm: 'SHA1',
        period: 30,
        digits: 6,
      });

      // Create OTP Auth URI
      const issuer = 'HayalRP Admin';
      const accountName = username || 'Admin';
      const otpAuthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

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
        console.error('Provision error:', error);
        toast.error('2FA kurulumu yapılırken hata oluştu');
        return;
      }

      // Show QR modal
      setQrCodeUrl(qrDataUrl);
      setTotpSecret(secret);
      setQrModalOpen(true);
      
      toast.success('2FA kurulumu tamamlandı');
      fetchAdminList();
    } catch (error) {
      console.error('Provision error:', error);
      toast.error('2FA kurulumu yapılırken hata oluştu');
    } finally {
      setProvisioningUserId(null);
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
        console.error('Unblock error:', error);
        toast.error('Blokaj kaldırılırken hata oluştu');
        return;
      }

      toast.success('Kullanıcı blokajı kaldırıldı');
      fetchAdminList();
    } catch (error) {
      console.error('Unblock error:', error);
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
      toast.success('Secret kopyalandı');
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Yetki Yönetimi
            </h1>
            <p className="text-sm text-muted-foreground">Admin erişimi yönetimi ve 2FA kurulumu</p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Kullanıcı Ara
            </h2>
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
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Yetkili Listesi
            </h2>

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
                          {/* Provision Button */}
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
                                  QR Aktifleştir
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

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemovingUserId(item.user_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removingUserId} onOpenChange={() => setRemovingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yetkiyi Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcının admin yetkisini kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yetkiyi Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockingUserId} onOpenChange={() => setUnblockingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blokajı Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcının blokajını kaldırmak istediğinize emin misiniz? Kullanıcı tekrar giriş yapabilecektir.
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

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              2FA Kurulum QR Kodu
            </DialogTitle>
            <DialogDescription>
              Bu QR kodu kullanıcıya gönderin. Google Authenticator veya benzeri bir uygulama ile taratılmalıdır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl && (
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            
            {totpSecret && (
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2">Manuel giriş için secret:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {totpSecret}
                  </code>
                  <Button variant="outline" size="sm" onClick={copySecret}>
                    {secretCopied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => setQrModalOpen(false)} className="w-full">
            Kapat
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAccess;
