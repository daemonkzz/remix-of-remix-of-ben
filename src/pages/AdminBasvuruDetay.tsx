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
  MessageSquare,
  Edit,
  History,
  Bot,
  Brain,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { AIEvaluation, AIDecision } from '@/types/application';

interface ApplicationDetail {
  id: number;
  user_id: string;
  type: string;
  content: Record<string, string>;
  status: string;
  created_at: string;
  admin_note: string | null;
  revision_requested_fields: string[] | null;
  revision_notes: Record<string, string> | null;
  content_history: Array<{ timestamp: string; content: Record<string, string> }>;
  profile?: {
    username: string | null;
    discord_id: string | null;
    steam_id: string | null;
  };
  // AI evaluation fields
  ai_evaluation: AIEvaluation | null;
  ai_decision: AIDecision | null;
  ai_confidence_score: number | null;
  ai_evaluated_at: string | null;
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
  
  // Revision state
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [selectedForRevision, setSelectedForRevision] = useState<string[]>([]);
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({});

  // Check if user has admin role
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız');
        navigate('/');
        return;
      }

      try {
        // Check if user can manage applications
        const { data: canManageApps, error: roleError } = await supabase
          .rpc('can_manage', { _user_id: user.id, _feature: 'applications' });

        if (roleError) {
          console.error('Permission check error:', roleError);
          toast.error('Yetki kontrolü yapılırken hata oluştu');
          navigate('/');
          return;
        }

        if (!canManageApps) {
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
          revision_requested_fields: data.revision_requested_fields as string[] | null,
          revision_notes: data.revision_notes as Record<string, string> | null,
          content_history: (data.content_history || []) as Array<{ timestamp: string; content: Record<string, string> }>,
          profile: profile || undefined,
          // AI evaluation fields
          ai_evaluation: data.ai_evaluation as AIEvaluation | null,
          ai_decision: data.ai_decision as AIDecision | null,
          ai_confidence_score: data.ai_confidence_score,
          ai_evaluated_at: data.ai_evaluated_at
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

  // Bildirim gönderme yardımcı fonksiyonu
  const sendNotification = async (userId: string, title: string, content: string) => {
    try {
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title,
          content,
          is_global: false,
          created_by: user?.id
        })
        .select()
        .single();

      if (notifError) {
        console.error('Notification create error:', notifError);
        return;
      }

      if (notifData) {
        await supabase.from('notification_recipients').insert({
          notification_id: notifData.id,
          user_id: userId,
          is_read: false
        });
      }
    } catch (error) {
      console.error('Send notification error:', error);
    }
  };

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!application) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status,
          admin_note: adminNote || null,
          revision_requested_fields: null,
          revision_notes: null
        })
        .eq('id', application.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Durum güncellenirken hata oluştu');
        return;
      }

      // Bildirim gönder
      const appNumber = (application as any).application_number || `#${application.id}`;
      if (status === 'approved') {
        await sendNotification(
          application.user_id,
          'Başvuru Onaylandı!',
          `Tebrikler! Başvurunuz (${appNumber}) onaylandı. Sunucuya hoş geldiniz!`
        );
      } else {
        await sendNotification(
          application.user_id,
          'Başvuru Sonucu',
          `Başvurunuz (${appNumber}) değerlendirildi ve maalesef kabul edilemedi. Detaylar için başvuru merkezini ziyaret edebilirsiniz.`
        );
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

  const requestRevision = async () => {
    if (!application || selectedForRevision.length === 0) {
      toast.error('Lütfen en az bir soru seçin');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'revision_requested',
          revision_requested_fields: selectedForRevision,
          revision_notes: revisionNotes,
          admin_note: adminNote || null
        })
        .eq('id', application.id);

      if (error) {
        console.error('Revision request error:', error);
        toast.error('Revizyon isteği gönderilirken hata oluştu');
        return;
      }

      // Revizyon bildirimi gönder
      const appNumber = (application as any).application_number || `#${application.id}`;
      await sendNotification(
        application.user_id,
        'Başvurunuzda Düzenleme İstendi',
        `Başvurunuz (${appNumber}) için ${selectedForRevision.length} soruda düzenleme yapmanız istendi. Lütfen başvuru merkezini ziyaret edin.`
      );

      toast.success('Revizyon isteği gönderildi');
      navigate('/admin');
    } catch (error) {
      console.error('Revision request error:', error);
      toast.error('Revizyon isteği gönderilirken hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRevisionQuestion = (questionKey: string) => {
    setSelectedForRevision(prev => 
      prev.includes(questionKey) 
        ? prev.filter(k => k !== questionKey)
        : [...prev, questionKey]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Onaylandı</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Reddedildi</Badge>;
      case 'revision_requested':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Revizyon Bekleniyor</Badge>;
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

  const getOldValue = (questionKey: string): string | null => {
    if (!application?.content_history || application.content_history.length === 0) return null;
    const lastHistory = application.content_history[application.content_history.length - 1];
    return lastHistory?.content?.[questionKey] || null;
  };

  const hasValueChanged = (questionKey: string): boolean => {
    const oldValue = getOldValue(questionKey);
    if (oldValue === null) return false;
    return oldValue !== application?.content[questionKey];
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

  const canTakeAction = application.status === 'pending' || application.status === 'revision_requested';

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

        {/* AI Evaluation Card */}
        {application.ai_evaluated_at && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Değerlendirmesi
              <Badge variant="outline" className="ml-auto text-xs">
                {formatDate(application.ai_evaluated_at)}
              </Badge>
            </h2>
            
            {/* AI Decision and Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* AI Decision */}
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">AI Kararı</p>
                </div>
                {application.ai_decision && (
                  <Badge className={`text-sm ${
                    application.ai_decision === 'approved' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : application.ai_decision === 'rejected'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {application.ai_decision === 'approved' && 'Onay Önerisi'}
                    {application.ai_decision === 'rejected' && 'Red Önerisi'}
                    {application.ai_decision === 'interview' && 'Mülakat Önerisi'}
                  </Badge>
                )}
              </div>
              
              {/* Confidence Score */}
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Güven Skoru</p>
                </div>
                {application.ai_confidence_score !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-2xl font-bold ${
                        application.ai_confidence_score >= 80 ? 'text-emerald-400' :
                        application.ai_confidence_score >= 60 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {application.ai_confidence_score}%
                      </span>
                    </div>
                    <Progress 
                      value={application.ai_confidence_score} 
                      className={`h-2 ${
                        application.ai_confidence_score >= 80 ? '[&>div]:bg-emerald-500' :
                        application.ai_confidence_score >= 60 ? '[&>div]:bg-amber-500' :
                        '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Evaluation Details */}
            {application.ai_evaluation && (
              <div className="space-y-4">
                {/* Player Profile */}
                {application.ai_evaluation.player_profile && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Oyuncu Profili</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {application.ai_evaluation.player_profile.experience_level && (
                        <div>
                          <p className="text-muted-foreground">Deneyim Seviyesi</p>
                          <p className="text-foreground capitalize">{application.ai_evaluation.player_profile.experience_level}</p>
                        </div>
                      )}
                      {application.ai_evaluation.player_profile.roleplay_style && (
                        <div>
                          <p className="text-muted-foreground">RP Tarzı</p>
                          <p className="text-foreground capitalize">{application.ai_evaluation.player_profile.roleplay_style}</p>
                        </div>
                      )}
                      {application.ai_evaluation.player_profile.character_depth !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Karakter Derinliği</p>
                          <p className="text-foreground">{application.ai_evaluation.player_profile.character_depth}/10</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mentality Analysis */}
                {application.ai_evaluation.mentality_analysis && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Mentalite Analizi</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {application.ai_evaluation.mentality_analysis.maturity_score !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Olgunluk Skoru</p>
                          <p className="text-foreground">{application.ai_evaluation.mentality_analysis.maturity_score}/100</p>
                        </div>
                      )}
                      {application.ai_evaluation.mentality_analysis.conflict_handling && (
                        <div>
                          <p className="text-muted-foreground">Çatışma Yönetimi</p>
                          <p className="text-foreground capitalize">{application.ai_evaluation.mentality_analysis.conflict_handling}</p>
                        </div>
                      )}
                      {application.ai_evaluation.mentality_analysis.team_player !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Takım Oyuncusu</p>
                          <p className="text-foreground">{application.ai_evaluation.mentality_analysis.team_player ? 'Evet' : 'Hayır'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.ai_evaluation.strengths && application.ai_evaluation.strengths.length > 0 && (
                    <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm font-medium text-emerald-400">Güçlü Yönler</p>
                      </div>
                      <ul className="space-y-1 text-sm text-foreground">
                        {application.ai_evaluation.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {application.ai_evaluation.weaknesses && application.ai_evaluation.weaknesses.length > 0 && (
                    <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-sm font-medium text-red-400">Zayıf Yönler</p>
                      </div>
                      <ul className="space-y-1 text-sm text-foreground">
                        {application.ai_evaluation.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommendation Notes */}
                {application.ai_evaluation.recommendation_notes && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">AI Yorumu</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.ai_evaluation.recommendation_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {canTakeAction && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Revizyon Modu</p>
                  <p className="text-sm text-muted-foreground">Belirli sorular için düzenleme isteyin</p>
                </div>
              </div>
              <Button
                variant={isRevisionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsRevisionMode(!isRevisionMode);
                  if (isRevisionMode) {
                    setSelectedForRevision([]);
                    setRevisionNotes({});
                  }
                }}
              >
                {isRevisionMode ? 'Kapat' : 'Aç'}
              </Button>
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
            {Object.entries(application.content).map(([key, value]) => {
              const oldValue = getOldValue(key);
              const valueChanged = hasValueChanged(key);
              const isSelected = selectedForRevision.includes(key);

              return (
                <div 
                  key={key} 
                  className={`border-b border-border/50 pb-4 last:border-0 last:pb-0 p-4 rounded-lg transition-all ${
                    isSelected ? 'bg-amber-500/10 border-amber-500/30' : ''
                  } ${valueChanged ? 'bg-emerald-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm text-primary font-medium">
                      {fieldLabels[key] || key}
                    </p>
                    {isRevisionMode && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`revision-${key}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleRevisionQuestion(key)}
                        />
                        <Label htmlFor={`revision-${key}`} className="text-xs text-muted-foreground cursor-pointer">
                          Revizyon İste
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* Show old value if it exists and changed */}
                  {valueChanged && oldValue && (
                    <div className="mb-2 p-2 bg-muted/50 rounded border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <History className="w-3 h-3" />
                        Önceki Cevap:
                      </div>
                      <p className="text-foreground/60 text-sm line-through whitespace-pre-wrap">
                        {oldValue}
                      </p>
                    </div>
                  )}

                  {/* Current value */}
                  <div className={valueChanged ? 'p-2 bg-emerald-500/10 rounded border border-emerald-500/20' : ''}>
                    {valueChanged && (
                      <div className="flex items-center gap-2 text-xs text-emerald-500 mb-1">
                        <Check className="w-3 h-3" />
                        Güncel Cevap:
                      </div>
                    )}
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {value || '-'}
                    </p>
                  </div>

                  {/* Revision Note Input */}
                  {isRevisionMode && isSelected && (
                    <div className="mt-3">
                      <Label className="text-xs text-amber-500 mb-1 block">Revizyon Notu (isteğe bağlı)</Label>
                      <Textarea
                        placeholder="Bu soru için düzenleme notunuz..."
                        value={revisionNotes[key] || ''}
                        onChange={(e) => setRevisionNotes({ ...revisionNotes, [key]: e.target.value })}
                        className="bg-background min-h-[60px] text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
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
            disabled={!canTakeAction}
          />
        </div>

        {/* Action Buttons */}
        {canTakeAction && (
          <div className="space-y-4">
            {/* Revision Request Button */}
            {isRevisionMode && selectedForRevision.length > 0 && (
              <Button
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={requestRevision}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Edit className="w-5 h-5 mr-2" />
                )}
                Revizyon İste ({selectedForRevision.length} soru)
              </Button>
            )}

            {/* Approve / Reject Buttons */}
            {!isRevisionMode && (
              <div className="space-y-4">
                {/* Approve Confirmation */}
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <Checkbox 
                    id="confirm-approve" 
                    checked={confirmApprove} 
                    onCheckedChange={(checked) => setConfirmApprove(checked as boolean)} 
                  />
                  <Label htmlFor="confirm-approve" className="text-sm text-foreground cursor-pointer">
                    Bu başvuruyu onayladığımı ve kullanıcının whitelist'e ekleneceğini kabul ediyorum
                  </Label>
                </div>

                {/* Reject Confirmation */}
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <Checkbox 
                    id="confirm-reject" 
                    checked={confirmReject} 
                    onCheckedChange={(checked) => setConfirmReject(checked as boolean)} 
                  />
                  <Label htmlFor="confirm-reject" className="text-sm text-foreground cursor-pointer">
                    Bu başvuruyu reddettiğimi onaylıyorum
                  </Label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    onClick={() => updateStatus('approved')}
                    disabled={isUpdating || !confirmApprove}
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
                    className="flex-1 disabled:opacity-50"
                    onClick={() => updateStatus('rejected')}
                    disabled={isUpdating || !confirmReject}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <X className="w-5 h-5 mr-2" />
                    )}
                    Başvuruyu Reddet
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Already processed message */}
        {!canTakeAction && (
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
