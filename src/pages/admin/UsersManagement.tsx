import { useState, useEffect } from 'react';
import type { AdminPermission } from '@/types/permissions';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Ban, 
  MessageSquare, 
  Eye, 
  Shield, 
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserWithPermissions } from '@/types/permissions';

const UsersManagement = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useUserPermissions();
  const { 
    users, 
    isLoading, 
    totalCount, 
    fetchUsers, 
    banUser, 
    unbanUser, 
    updateWhitelistStatus,
    sendNotification,
  } = useUsersManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [onlyBanned, setOnlyBanned] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [discordDmModalOpen, setDiscordDmModalOpen] = useState(false);
  const [discordMessage, setDiscordMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchUsers({
      search: searchQuery,
      onlyAdmins,
      onlyBanned,
      page: currentPage,
      pageSize,
    });
  }, [searchQuery, onlyAdmins, onlyBanned, currentPage, fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers({
      search: searchQuery,
      onlyAdmins,
      onlyBanned,
      page: 1,
      pageSize,
    });
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setIsSending(true);
    const success = await banUser(selectedUser.id, banReason);
    if (success) {
      setBanModalOpen(false);
      setBanReason('');
      setSelectedUser(null);
      fetchUsers({ search: searchQuery, onlyAdmins, onlyBanned, page: currentPage, pageSize });
    }
    setIsSending(false);
  };

  const handleUnban = async (user: UserWithPermissions) => {
    const success = await unbanUser(user.id);
    if (success) {
      fetchUsers({ search: searchQuery, onlyAdmins, onlyBanned, page: currentPage, pageSize });
    }
  };

  const handleWhitelistToggle = async (user: UserWithPermissions) => {
    const success = await updateWhitelistStatus(user.id, !user.is_whitelist_approved);
    if (success) {
      fetchUsers({ search: searchQuery, onlyAdmins, onlyBanned, page: currentPage, pageSize });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageTitle.trim() || !messageContent.trim()) return;
    setIsSending(true);
    const success = await sendNotification(selectedUser.id, messageTitle, messageContent);
    if (success) {
      setMessageModalOpen(false);
      setMessageTitle('');
      setMessageContent('');
      setSelectedUser(null);
    }
    setIsSending(false);
  };

  const handleSendDiscordDm = async () => {
    if (!selectedUser?.discord_id || !discordMessage.trim()) return;
    
    // Discord ID numeric olmalı (snowflake ID)
    const discordId = selectedUser.discord_id;
    const isNumericId = /^\d{17,19}$/.test(discordId);
    
    if (!isNumericId) {
      toast.error('Discord ID geçersiz formatı. Numeric Discord ID gerekli (örn: 123456789012345678). Kullanıcı adı (örn: daemonkz#0) değil, numeric ID kullanılmalı.');
      return;
    }
    
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-discord-dm', {
        body: {
          discord_id: discordId,
          message: discordMessage,
        },
      });

      if (error) throw error;
      toast.success('Discord DM gönderildi');
      setDiscordDmModalOpen(false);
      setDiscordMessage('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Discord DM error:', error);
      toast.error('Discord DM gönderilemedi');
    }
    setIsSending(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleBadge = (roles: string[], permissions: AdminPermission[]) => {
    if (roles.includes('super_admin')) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>;
    }
    if (permissions.length > 0) {
      // Show first permission name as badge
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{permissions[0].name}</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">Kullanıcı</Badge>;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminRouteGuard>
      <AdminLayout activeTab="kullanicilar">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h1>
              <p className="text-muted-foreground">Toplam {totalCount} kullanıcı</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Kullanıcı adı veya Discord ID ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="only-admins"
                  checked={onlyAdmins}
                  onCheckedChange={setOnlyAdmins}
                />
                <Label htmlFor="only-admins" className="text-sm">Sadece Yetkililer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="only-banned"
                  checked={onlyBanned}
                  onCheckedChange={setOnlyBanned}
                />
                <Label htmlFor="only-banned" className="text-sm">Sadece Yasaklılar</Label>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Whitelist</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className={user.is_banned ? 'bg-red-500/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.username?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username || 'İsimsiz'}</p>
                            {user.discord_id && (
                              <p className="text-xs text-muted-foreground">Discord: {user.discord_id}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.roles, user.permissions)}</TableCell>
                      <TableCell>
                        {user.is_whitelist_approved ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Onaylı
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            Onaysız
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <Ban className="w-3 h-3 mr-1" />
                            Yasaklı
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin?tab=basvurular&user=${user.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Başvurularını Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setMessageModalOpen(true);
                            }}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Mesaj Gönder
                            </DropdownMenuItem>
                            {user.discord_id && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setDiscordDmModalOpen(true);
                              }}>
                                <Send className="w-4 h-4 mr-2" />
                                Discord DM Gönder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleWhitelistToggle(user)}>
                              {user.is_whitelist_approved ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Whitelist Kaldır
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Whitelist Onayla
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_banned ? (
                              <DropdownMenuItem 
                                onClick={() => handleUnban(user)}
                                className="text-emerald-500"
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Yasağı Kaldır
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanModalOpen(true);
                                }}
                                className="text-red-500"
                              >
                                <ShieldX className="w-4 h-4 mr-2" />
                                Yasakla
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Ban Modal */}
        <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kullanıcıyı Yasakla</DialogTitle>
              <DialogDescription>
                {selectedUser?.username || 'Bu kullanıcı'} yasaklanacak ve siteye giriş yapamayacak.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Yasaklama Sebebi</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Yasaklama sebebini yazın..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanModalOpen(false)}>
                İptal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBan}
                disabled={!banReason.trim() || isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                Yasakla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Modal */}
        <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mesaj Gönder</DialogTitle>
              <DialogDescription>
                {selectedUser?.username || 'Bu kullanıcıya'} site içi bildirim gönder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message-title">Başlık</Label>
                <Input
                  id="message-title"
                  placeholder="Bildirim başlığı..."
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message-content">Mesaj</Label>
                <Textarea
                  id="message-content"
                  placeholder="Mesaj içeriği..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!messageTitle.trim() || !messageContent.trim() || isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discord DM Modal */}
        <Dialog open={discordDmModalOpen} onOpenChange={setDiscordDmModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discord DM Gönder</DialogTitle>
              <DialogDescription>
                {selectedUser?.username || 'Bu kullanıcıya'} Discord üzerinden özel mesaj gönder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discord-message">Mesaj</Label>
                <Textarea
                  id="discord-message"
                  placeholder="Discord mesajı..."
                  value={discordMessage}
                  onChange={(e) => setDiscordMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDiscordDmModalOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleSendDiscordDm}
                disabled={!discordMessage.trim() || isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Discord'a Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRouteGuard>
  );
};

export default UsersManagement;
