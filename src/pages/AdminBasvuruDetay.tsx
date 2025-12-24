import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Loader2,
  User,
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface ApplicationDetail {
  id: number;
  user_id: string;
  type: string;
  content: Record<string, string>;
  status: string;
  created_at: string;
  admin_note: string | null;
  profile?: {
    username: string | null;
    discord_id: string | null;
    steam_id: string | null;
  };
}

const formTypeNames: Record<string, string> = {
  'whitelist': 'Whitelist Başvurusu',
  'lspd-akademi': 'LSPD Akademi Başvurusu',
  'sirket': 'Şirket Başvurusu',
  'taksici': 'Taksici Başvurusu',
  'hastane': 'LSFMD Hastane Başvurusu',
};

const fieldLabels: Record<string, string> = {
  // Whitelist
  discordName: 'Discord Kullanıcı Adı',
  age: 'Yaş',
  howDidYouFind: 'Sunucuyu Nasıl Buldu',
  rpExperience: 'RP Deneyimi',
  whatIsRp: 'RP Nedir Açıklaması',
  rules: 'Temel RP Kuralları Bilgisi',
  characterName: 'Karakter Adı',
  characterAge: 'Karakter Yaşı',
  characterBackstory: 'Karakter Hikayesi',
  scenario1: 'Senaryo 1 Cevabı',
  scenario2: 'Senaryo 2 Cevabı',
  // LSPD
  phone: 'Telefon Numarası',
  previousJob: 'Önceki Meslek',
  criminalRecord: 'Sabıka Kaydı',
  backstory: 'Karakter Hikayesi',
  whyJoin: 'Katılma Nedeni',
  experience: 'RP Deneyimi',
  availability: 'Haftalık Aktiflik',
  // Şirket
  companyName: 'Şirket Adı',
  companyType: 'Şirket Türü',
  location: 'Lokasyon',
  ownerName: 'Sahip Adı',
  ownerPhone: 'Sahip Telefonu',
  capital: 'Sermaye',
  businessPlan: 'İş Planı',
  employees: 'Planlanan Çalışan Sayısı',
  uniqueness: 'Özellik',
  // Taksici
  license: 'Ehliyet Durumu',
  accidents: 'Kaza Geçmişi',
  cityKnowledge: 'Şehir Bilgisi',
  workHours: 'Çalışma Saatleri',
  whyTaxi: 'Taksici Olma Nedeni',
  // Hastane
  education: 'Tıbbi Eğitim',
  department: 'Başvurulan Birim',
};

const AdminBasvuruDetay = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız');
        navigate('/');
        return;
      }

      try {
        const { data: hasAdminRole, error: roleError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (roleError) {
          console.error('Role check error:', roleError);
          toast.error('Yetki kontrolü yapılırken hata oluştu');
          navigate('/');
          return;
        }

        // Also check for moderator role
        const { data: hasModRole } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'moderator' });

        if (!hasAdminRole && !hasModRole) {
          toast.error('Bu sayfaya erişim yetkiniz yok');
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Yetki kontrolü yapılırken hata oluştu');
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      if (!isAuthorized || !id) return;

      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', parseInt(id))
          .maybeSingle();

        if (error) {
          console.error('Fetch error:', error);
          toast.error('Başvuru yüklenirken hata oluştu');
          return;
        }

        if (!data) {
          toast.error('Başvuru bulunamadı');
          navigate('/admin');
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, discord_id, steam_id')
          .eq('id', data.user_id)
          .maybeSingle();

        setApplication({
          ...data,
          content: data.content as Record<string, string>,
          profile: profile || undefined
        });
        setAdminNote(data.admin_note || '');
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Başvuru yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized) {
      fetchApplication();
    }
  }, [isAuthorized, id, navigate]);

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!application) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status,
          admin_note: adminNote || null
        })
        .eq('id', application.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Durum güncellenirken hata oluştu');
        return;
      }

      toast.success(status === 'approved' ? 'Başvuru onaylandı' : 'Başvuru reddedildi');
      navigate('/admin');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Durum güncellenirken hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Onaylandı</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Reddedildi</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Beklemede</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading while checking auth
  if (authLoading || isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !application) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/admin"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Admin Paneline Dön</span>
            </Link>
            <div className="flex items-center gap-3">
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Application Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {formTypeNames[application.type] || application.type}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Başvuru #{application.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(application.created_at)}</span>
            </div>
            {application.profile?.username && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{application.profile.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Info Card */}
        {application.profile && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Kullanıcı Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {application.profile.username && (
                <div>
                  <p className="text-sm text-muted-foreground">Kullanıcı Adı</p>
                  <p className="text-foreground font-medium">{application.profile.username}</p>
                </div>
              )}
              {application.profile.discord_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Discord ID</p>
                  <p className="text-foreground font-medium">{application.profile.discord_id}</p>
                </div>
              )}
              {application.profile.steam_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Steam ID</p>
                  <p className="text-foreground font-medium">{application.profile.steam_id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Başvuru İçeriği
          </h2>
          <div className="space-y-6">
            {Object.entries(application.content).map(([key, value]) => (
              <div key={key} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <p className="text-sm text-primary font-medium mb-2">
                  {fieldLabels[key] || key}
                </p>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {value || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Note */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Admin Notu
          </h2>
          <Textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Başvuru hakkında not ekleyin (isteğe bağlı)..."
            className="min-h-[100px] bg-background"
            disabled={application.status !== 'pending'}
          />
        </div>

        {/* Action Buttons */}
        {application.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => updateStatus('approved')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              Başvuruyu Onayla
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="flex-1"
              onClick={() => updateStatus('rejected')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <X className="w-5 h-5 mr-2" />
              )}
              Başvuruyu Reddet
            </Button>
          </div>
        )}

        {/* Already processed message */}
        {application.status !== 'pending' && (
          <div className={`p-4 rounded-lg text-center ${
            application.status === 'approved' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            <p>
              Bu başvuru {application.status === 'approved' ? 'onaylanmış' : 'reddedilmiş'} durumda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBasvuruDetay;