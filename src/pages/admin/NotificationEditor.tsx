import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminEditorState } from '@/contexts/AdminEditorStateContext';
import { toast } from 'sonner';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Search,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { NavigationGuard } from '@/components/admin/NavigationGuard';
import { UnsavedIndicator } from '@/components/admin/UnsavedIndicator';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const NotificationEditorContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getNotificationEditorState, setNotificationEditorState, clearNotificationEditorState } = useAdminEditorState();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const initialLoadRef = useRef(false);

  // Load from context on mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    const contextState = getNotificationEditorState();
    if (contextState) {
      setTitle(contextState.title);
      setContent(contextState.content);
      setTargetType(contextState.targetType);
      setSelectedUsers(contextState.selectedUsers);
      setHasUnsavedChanges(true);
    }
  }, [getNotificationEditorState]);

  // Save to context on every change
  useEffect(() => {
    if (!initialLoadRef.current) return;
    
    const hasContent = !!(title.trim() || content.trim() || selectedUsers.length > 0);
    setHasUnsavedChanges(hasContent);
    
    if (hasContent) {
      setNotificationEditorState({
        title,
        content,
        targetType,
        selectedUsers,
      });
    }
  }, [title, content, targetType, selectedUsers, setNotificationEditorState]);

  // Browser close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const sanitizeSearchInput = (input: string): string => {
    return input.replace(/[^a-zA-Z0-9\s_\-]/g, '').substring(0, 100);
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || targetType !== 'selected') {
        setSearchResults([]);
        return;
      }

      const sanitizedQuery = sanitizeSearchInput(searchQuery.trim());
      if (!sanitizedQuery) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${sanitizedQuery}%`)
          .limit(10);

        if (error) throw error;

        const filtered = (data || []).filter(
          u => !selectedUsers.some(s => s.id === u.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, targetType, selectedUsers]);

  const addUser = (userProfile: UserProfile) => {
    setSelectedUsers(prev => [...prev, userProfile]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSend = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }
    if (!content.trim()) {
      toast.error('Lütfen bildirim içeriği girin');
      return;
    }
    if (targetType === 'selected' && selectedUsers.length === 0) {
      toast.error('Lütfen en az bir kullanıcı seçin');
      return;
    }

    setIsSending(true);
    try {
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: title.trim(),
          content: content.trim(),
          is_global: targetType === 'all',
          created_by: user?.id
        })
        .select()
        .single();

      if (notifError) throw notifError;

      if (targetType === 'selected' && notification) {
        const recipients = selectedUsers.map(u => ({
          notification_id: notification.id,
          user_id: u.id,
          is_read: false
        }));

        const { error: recipientError } = await supabase
          .from('notification_recipients')
          .insert(recipients);

        if (recipientError) throw recipientError;
      }

      clearNotificationEditorState();
      setHasUnsavedChanges(false);
      
      toast.success(
        targetType === 'all' 
          ? 'Bildirim tüm kullanıcılara gönderildi' 
          : `Bildirim ${selectedUsers.length} kullanıcıya gönderildi`
      );
      navigate('/admin?tab=guncellemeler');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Send error:', error);
      toast.error('Bildirim gönderilirken hata oluştu');
    } finally {
      setIsSending(false);
    }
  }, [title, content, targetType, selectedUsers, user?.id, navigate, clearNotificationEditorState]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <NavigationGuard when={hasUnsavedChanges} />

      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">Yeni Bildirim</h2>
            <UnsavedIndicator hasUnsavedChanges={hasUnsavedChanges} />
          </div>
          <p className="text-muted-foreground">Kullanıcılara bildirim gönder</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            placeholder="Bildirim başlığı..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">İçerik</Label>
          <Textarea
            id="content"
            placeholder="Bildirim içeriği..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <Label>Hedef Kitle</Label>
          <RadioGroup
            value={targetType}
            onValueChange={(v) => setTargetType(v as 'all' | 'selected')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex items-center gap-3 cursor-pointer flex-1">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Tüm Kullanıcılar</p>
                  <p className="text-sm text-muted-foreground">Bildirimi herkese gönder</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="selected" id="selected" />
              <Label htmlFor="selected" className="flex items-center gap-3 cursor-pointer flex-1">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Seçili Kullanıcılar</p>
                  <p className="text-sm text-muted-foreground">Belirli kullanıcılara gönder</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {targetType === 'selected' && (
          <div className="space-y-4">
            <Label>Kullanıcı Seç</Label>
            
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {selectedUsers.map((userProfile) => (
                  <Badge key={userProfile.id} variant="secondary" className="pl-1 pr-2 py-1 gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={userProfile.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(userProfile.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{userProfile.username || 'Bilinmeyen'}</span>
                    <button onClick={() => removeUser(userProfile.id)} className="ml-1 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchResults.length > 0 && (
              <ScrollArea className="h-48 rounded-lg border border-border">
                <div className="p-2 space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => addUser(result)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={result.avatar_url || undefined} />
                        <AvatarFallback>{(result.username || 'U')[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{result.username || 'Bilinmeyen'}</span>
                      <Check className="w-4 h-4 ml-auto text-primary opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-4">Kullanıcı bulunamadı</p>
            )}
          </div>
        )}

        <Button className="w-full gap-2" size="lg" onClick={handleSend} disabled={isSending}>
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {isSending ? 'Gönderiliyor...' : 'Bildirim Gönder'}
        </Button>
      </div>
    </div>
  );
};

const NotificationEditor = () => {
  return (
    <AdminLayout activeTab="bildirimler">
      <NotificationEditorContent />
    </AdminLayout>
  );
};

export default NotificationEditor;
