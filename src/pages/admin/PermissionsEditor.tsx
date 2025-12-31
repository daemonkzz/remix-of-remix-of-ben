import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  Users,
  Loader2,
  Save,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TAB_NAMES, type AdminPermission, type TabKey, ALL_TABS } from '@/types/permissions';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const PermissionsEditor = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<AdminPermission | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTabs, setFormTabs] = useState<TabKey[]>([]);
  const [formCanManageUsers, setFormCanManageUsers] = useState(false);
  const [formCanManageApplications, setFormCanManageApplications] = useState(false);
  const [formCanManageForms, setFormCanManageForms] = useState(false);
  const [formCanManageUpdates, setFormCanManageUpdates] = useState(false);
  const [formCanManageRules, setFormCanManageRules] = useState(false);
  const [formCanManageGallery, setFormCanManageGallery] = useState(false);
  const [formCanManageNotifications, setFormCanManageNotifications] = useState(false);
  const [formCanManageWhiteboard, setFormCanManageWhiteboard] = useState(false);
  const [formCanManageGlossary, setFormCanManageGlossary] = useState(false);
  
  // User assignment
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!permLoading && !isSuperAdmin) {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/admin');
    }
  }, [isSuperAdmin, permLoading, navigate]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Fetch permissions error:', error);
      toast.error('Yetkiler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .order('username');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchAssignedUsers = async (permissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_admin_permissions')
        .select('user_id')
        .eq('permission_id', permissionId);

      if (error) throw error;
      setAssignedUsers(data?.map(d => d.user_id) || []);
    } catch (error) {
      console.error('Fetch assigned users error:', error);
    }
  };

  const openEditModal = (permission?: AdminPermission) => {
    if (permission) {
      setSelectedPermission(permission);
      setFormName(permission.name);
      setFormDescription(permission.description || '');
      setFormTabs(permission.allowed_tabs as TabKey[]);
      setFormCanManageUsers(permission.can_manage_users);
      setFormCanManageApplications(permission.can_manage_applications);
      setFormCanManageForms(permission.can_manage_forms);
      setFormCanManageUpdates(permission.can_manage_updates);
      setFormCanManageRules(permission.can_manage_rules);
      setFormCanManageGallery(permission.can_manage_gallery);
      setFormCanManageNotifications(permission.can_manage_notifications);
      setFormCanManageWhiteboard(permission.can_manage_whiteboard);
      setFormCanManageGlossary(permission.can_manage_glossary);
    } else {
      setSelectedPermission(null);
      setFormName('');
      setFormDescription('');
      setFormTabs([]);
      setFormCanManageUsers(false);
      setFormCanManageApplications(false);
      setFormCanManageForms(false);
      setFormCanManageUpdates(false);
      setFormCanManageRules(false);
      setFormCanManageGallery(false);
      setFormCanManageNotifications(false);
      setFormCanManageWhiteboard(false);
      setFormCanManageGlossary(false);
    }
    setEditModalOpen(true);
  };

  const handleSavePermission = async () => {
    if (!formName.trim()) {
      toast.error('Yetki adı gerekli');
      return;
    }

    setIsSaving(true);
    try {
      const permissionData = {
        name: formName,
        description: formDescription || null,
        allowed_tabs: formTabs,
        can_manage_users: formCanManageUsers,
        can_manage_applications: formCanManageApplications,
        can_manage_forms: formCanManageForms,
        can_manage_updates: formCanManageUpdates,
        can_manage_rules: formCanManageRules,
        can_manage_gallery: formCanManageGallery,
        can_manage_notifications: formCanManageNotifications,
        can_manage_whiteboard: formCanManageWhiteboard,
        can_manage_glossary: formCanManageGlossary,
      };

      if (selectedPermission) {
        const { error } = await supabase
          .from('admin_permissions')
          .update(permissionData)
          .eq('id', selectedPermission.id);

        if (error) throw error;
        toast.success('Yetki güncellendi');
      } else {
        const { error } = await supabase
          .from('admin_permissions')
          .insert(permissionData);

        if (error) throw error;
        toast.success('Yetki oluşturuldu');
      }

      setEditModalOpen(false);
      fetchPermissions();
    } catch (error: any) {
      console.error('Save permission error:', error);
      if (error.code === '23505') {
        toast.error('Bu isimde bir yetki zaten mevcut');
      } else {
        toast.error('Yetki kaydedilirken hata oluştu');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!selectedPermission) return;

    try {
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('id', selectedPermission.id);

      if (error) throw error;
      toast.success('Yetki silindi');
      setDeleteDialogOpen(false);
      setSelectedPermission(null);
      fetchPermissions();
    } catch (error) {
      console.error('Delete permission error:', error);
      toast.error('Yetki silinirken hata oluştu');
    }
  };

  const openAssignModal = async (permission: AdminPermission) => {
    setSelectedPermission(permission);
    await Promise.all([fetchAllUsers(), fetchAssignedUsers(permission.id)]);
    setAssignModalOpen(true);
  };

  const handleToggleUserAssignment = async (userId: string) => {
    if (!selectedPermission) return;

    const isAssigned = assignedUsers.includes(userId);

    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('user_admin_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('permission_id', selectedPermission.id);

        if (error) throw error;
        setAssignedUsers(prev => prev.filter(id => id !== userId));
        toast.success('Yetki kaldırıldı');
      } else {
        const { error } = await supabase
          .from('user_admin_permissions')
          .insert({
            user_id: userId,
            permission_id: selectedPermission.id,
          });

        if (error) throw error;
        setAssignedUsers(prev => [...prev, userId]);
        toast.success('Yetki atandı');
      }
    } catch (error) {
      console.error('Toggle assignment error:', error);
      toast.error('İşlem başarısız');
    }
  };

  const toggleTab = (tab: TabKey) => {
    setFormTabs(prev => 
      prev.includes(tab) 
        ? prev.filter(t => t !== tab)
        : [...prev, tab]
    );
  };

  const filteredUsers = allUsers.filter(user => 
    !userSearch || 
    user.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (permLoading || isLoading) {
    return (
      <AdminRouteGuard>
        <AdminLayout activeTab="yetkilendirme">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </AdminRouteGuard>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AdminRouteGuard>
      <AdminLayout activeTab="yetkilendirme">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Yetki Yönetimi</h1>
              <p className="text-muted-foreground">Dinamik yetki rolleri oluşturun ve kullanıcılara atayın</p>
            </div>
            <Button onClick={() => openEditModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Yetki
            </Button>
          </div>

          {/* Info Card */}
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Super Admin Bilgisi</p>
                  <p className="text-sm text-amber-400/80">
                    Super Admin rolü veritabanından atanır ve tüm yetkilere sahiptir. 
                    Bu sayfadaki yetkiler diğer kullanıcılar içindir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {permissions.map((permission) => (
              <Card key={permission.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{permission.name}</CardTitle>
                      <CardDescription>{permission.description || 'Açıklama yok'}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditModal(permission)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedPermission(permission);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Erişilebilir Sekmeler</p>
                    <div className="flex flex-wrap gap-1">
                      {permission.allowed_tabs.length === 0 ? (
                        <Badge variant="outline" className="text-muted-foreground">Yok</Badge>
                      ) : (
                        permission.allowed_tabs.slice(0, 3).map(tab => (
                          <Badge key={tab} variant="secondary" className="text-xs">
                            {TAB_NAMES[tab as TabKey] || tab}
                          </Badge>
                        ))
                      )}
                      {permission.allowed_tabs.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{permission.allowed_tabs.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openAssignModal(permission)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Kullanıcı Ata
                  </Button>
                </CardContent>
              </Card>
            ))}

            {permissions.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Henüz yetki oluşturulmamış</p>
                  <Button onClick={() => openEditModal()} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Yetkiyi Oluştur
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit/Create Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPermission ? 'Yetkiyi Düzenle' : 'Yeni Yetki Oluştur'}
              </DialogTitle>
              <DialogDescription>
                Yetki ayarlarını yapılandırın ve hangi sekmelere erişebileceğini belirleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="perm-name">Yetki Adı</Label>
                  <Input
                    id="perm-name"
                    placeholder="örn: Moderatör"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="perm-desc">Açıklama</Label>
                  <Textarea
                    id="perm-desc"
                    placeholder="Bu yetkinin ne işe yaradığını açıklayın..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Tab Access */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                  <span>Sekme Erişimi</span>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_TABS.filter(tab => tab !== 'yetkilendirme').map(tab => (
                      <div
                        key={tab}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          formTabs.includes(tab) 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => toggleTab(tab)}
                      >
                        <Checkbox checked={formTabs.includes(tab)} />
                        <span className="text-sm">{TAB_NAMES[tab]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Not: Yetki Yönetimi sekmesi sadece Super Admin'e açıktır.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {/* Management Permissions */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                  <span>Yönetim Yetkileri</span>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-users">Kullanıcı Yönetimi</Label>
                    <Switch id="manage-users" checked={formCanManageUsers} onCheckedChange={setFormCanManageUsers} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-apps">Başvuru Yönetimi</Label>
                    <Switch id="manage-apps" checked={formCanManageApplications} onCheckedChange={setFormCanManageApplications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-forms">Form Yönetimi</Label>
                    <Switch id="manage-forms" checked={formCanManageForms} onCheckedChange={setFormCanManageForms} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-updates">Güncelleme Yönetimi</Label>
                    <Switch id="manage-updates" checked={formCanManageUpdates} onCheckedChange={setFormCanManageUpdates} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-rules">Kural Yönetimi</Label>
                    <Switch id="manage-rules" checked={formCanManageRules} onCheckedChange={setFormCanManageRules} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-gallery">Galeri Yönetimi</Label>
                    <Switch id="manage-gallery" checked={formCanManageGallery} onCheckedChange={setFormCanManageGallery} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-notif">Bildirim Yönetimi</Label>
                    <Switch id="manage-notif" checked={formCanManageNotifications} onCheckedChange={setFormCanManageNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-board">Canlı Harita Yönetimi</Label>
                    <Switch id="manage-board" checked={formCanManageWhiteboard} onCheckedChange={setFormCanManageWhiteboard} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-glossary">Sözlük Yönetimi</Label>
                    <Switch id="manage-glossary" checked={formCanManageGlossary} onCheckedChange={setFormCanManageGlossary} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSavePermission} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {selectedPermission ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yetkiyi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedPermission?.name}" yetkisini silmek istediğinize emin misiniz? 
                Bu yetkiye sahip kullanıcılar bu yetkileri kaybedecek.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePermission} className="bg-red-500 hover:bg-red-600">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Users Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcı Ata</DialogTitle>
              <DialogDescription>
                "{selectedPermission?.name}" yetkisini kullanıcılara atayın.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Kullanıcı ara..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />

              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      assignedUsers.includes(user.id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                    onClick={() => handleToggleUserAssignment(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.username?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{user.username || 'İsimsiz'}</span>
                    {assignedUsers.includes(user.id) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Kullanıcı bulunamadı</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRouteGuard>
  );
};

export default PermissionsEditor;
