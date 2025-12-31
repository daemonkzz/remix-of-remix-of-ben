import { useMemo, useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, CheckCircle, Clock, XCircle, FileText, Edit } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { FormQuestion, FormSettings, FormType } from "@/types/formBuilder";

// Application card types
type ApplicationStatus = "open" | "closed" | "approved" | "pending" | "rejected" | "locked" | "revision_requested";

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  questions: FormQuestion[];
  settings: FormSettings;
  created_at: string;
}

interface ApplicationCardProps {
  title: string;
  description?: string | null;
  status: ApplicationStatus;
  formId?: string;
  featured?: boolean;
  delay?: number;
  coverImage?: string | null;
  rejectionReason?: string | null;
  onReapply?: () => void;
  revisionCount?: number;
  onRevisionEdit?: () => void;
}

interface HistoryItemProps {
  id: number;
  applicationNumber: string | null;
  title: string;
  status: "approved" | "pending" | "rejected" | "revision_requested";
  type: string;
  delay?: number;
}

interface UserApplication {
  id: number;
  type: string;
  status: string;
  created_at: string;
  admin_note: string | null;
  revision_requested_fields: string[] | null;
  revision_notes: Record<string, string> | null;
  application_number: string | null;
}

const normalizeStringArray = (value: unknown): string[] | null => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return null;
};

const normalizeStringRecord = (value: unknown): Record<string, string> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v === "string");
  return Object.fromEntries(entries) as Record<string, string>;
};

// Floating particles generator
const generateFloatingParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 15 + Math.random() * 25,
    delay: Math.random() * 8
  }));
};

const ApplicationCard = ({ title, description, status, formId, featured, delay = 0, coverImage, rejectionReason, onReapply, revisionCount, onRevisionEdit }: ApplicationCardProps) => {
  const getStatusContent = () => {
    switch (status) {
      case "open":
        return (
          <Link to={`/basvuru/${formId}`}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-medium transition-all duration-300 border border-primary/20 hover:border-primary/40 text-sm tracking-wide text-center"
            >
              Başvuru Yap
            </motion.div>
          </Link>
        );
      case "closed":
        return (
          <div className="py-3 text-center text-muted-foreground/60 text-sm border border-border/20 rounded-md bg-muted/5">
            Başvurular şu an kapalı
          </div>
        );
      case "locked":
        return (
          <div className="py-3 text-center text-muted-foreground/60 text-sm border border-border/20 rounded-md bg-muted/5 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Whitelist onayı gerekli
          </div>
        );
      case "approved":
        return (
          <div className="py-3 text-center text-primary text-sm border border-primary/20 rounded-md bg-primary/5 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Başvurunuz onaylandı
          </div>
        );
      case "pending":
        return (
          <div className="py-3 text-center text-amber-500 text-sm border border-amber-500/20 rounded-md bg-amber-500/5 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Başvurunuz inceleniyor
          </div>
        );
      case "rejected":
        return (
          <div className="space-y-3">
            <div className="py-3 text-center text-destructive text-sm border border-destructive/20 rounded-md bg-destructive/5 flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" />
              Başvurunuz reddedildi
            </div>
            {rejectionReason && (
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Ret Sebebi:</p>
                <p className="text-sm text-foreground">{rejectionReason}</p>
              </div>
            )}
            {onReapply && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onReapply}
                className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-medium transition-all duration-300 border border-primary/20 hover:border-primary/40 text-sm tracking-wide"
              >
                Tekrar Başvur
              </motion.button>
            )}
          </div>
        );
      case "revision_requested":
        return (
          <div className="space-y-3">
            <div className="py-3 text-center text-amber-600 text-sm border border-amber-500/20 rounded-md bg-amber-500/5 flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" />
              Revizyon bekleniyor
            </div>
            {revisionCount !== undefined && revisionCount > 0 && (
              <p className="text-xs text-muted-foreground text-center">{revisionCount} soru için düzenleme bekleniyor</p>
            )}
            {onRevisionEdit && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onRevisionEdit}
                className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-md font-medium transition-all duration-300 border border-amber-500/20 hover:border-amber-500/40 text-sm tracking-wide"
              >
                Düzenle
              </motion.button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative rounded-lg border transition-all duration-300 group overflow-hidden ${
        featured 
          ? "bg-card/60 border-primary/20 hover:border-primary/40" 
          : "bg-card/30 border-border/20 hover:border-border/40"
      } ${status === "locked" ? "opacity-60" : ""}`}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className="w-full h-32 overflow-hidden">
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors duration-300 tracking-wide">
            {title}
          </h3>
          {status === "approved" && (
            <span className="text-[10px] text-primary font-medium tracking-widest uppercase">
              Onaylı
            </span>
          )}
          {status === "pending" && (
            <span className="text-[10px] text-amber-500 font-medium tracking-widest uppercase">
              Beklemede
            </span>
          )}
          {status === "rejected" && (
            <span className="text-[10px] text-destructive font-medium tracking-widest uppercase">
              Reddedildi
            </span>
          )}
          {featured && status === "open" && (
            <span className="text-[10px] text-primary/60 font-medium tracking-widest uppercase">
              Açık
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {/* Subtle divider */}
        <div className="h-px bg-border/20" />

        {/* Status content */}
        {getStatusContent()}
      </div>
    </motion.div>
  );
};

const HistoryItem = ({ id, applicationNumber, title, status, type, delay = 0 }: HistoryItemProps) => {
  const statusConfig = {
    approved: { color: "text-primary", label: "Onaylandı", icon: CheckCircle },
    pending: { color: "text-amber-500", label: "Beklemede", icon: Clock },
    rejected: { color: "text-destructive", label: "Reddedildi", icon: XCircle },
    revision_requested: { color: "text-amber-600", label: "Revizyon Bekleniyor", icon: Edit },
  };
  const config = statusConfig[status] || { color: "text-muted-foreground", label: status, icon: Clock };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ x: -2 }}
      className="p-4 bg-card/20 border border-border/15 rounded-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h4>
          <div className={`text-xs ${config.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        </div>
        <span className="text-[10px] text-primary/80 font-mono bg-primary/10 px-2 py-0.5 rounded">
          {applicationNumber || `#${id}`}
        </span>
      </div>
    </motion.div>
  );
};

const Basvuru = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const particles = useMemo(() => generateFloatingParticles(25), []);
  
  const [isWhitelistApproved, setIsWhitelistApproved] = useState(false);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active form templates
        // Güvenli view kullan - accessCodes gibi hassas bilgileri gizler
        const { data: templates, error: templatesError } = await supabase
          .from('form_templates_public')
          .select('*')
          .order('created_at', { ascending: false });

        if (templatesError) {
          console.error('Templates fetch error:', templatesError);
        } else {
          // Type assertion for JSON fields
          const typedTemplates = (templates || []).map(t => ({
            ...t,
            questions: t.questions as FormQuestion[],
            settings: t.settings as FormSettings
          }));
          setFormTemplates(typedTemplates);
        }

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch profile to check whitelist status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_whitelist_approved')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else if (profile) {
          setIsWhitelistApproved(profile.is_whitelist_approved || false);
        }

        // Fetch user's applications
        const { data: applications, error: appError } = await supabase
          .from('applications')
          .select('id, type, status, created_at, admin_note, revision_requested_fields, revision_notes, application_number')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (appError) {
          console.error('Applications fetch error:', appError);
        } else {
          const typedApplications: UserApplication[] = (applications || []).map((app) => ({
            ...app,
            status: typeof app.status === "string" ? app.status : String(app.status ?? ""),
            revision_requested_fields: normalizeStringArray(app.revision_requested_fields),
            revision_notes: normalizeStringRecord(app.revision_notes),
            application_number: app.application_number as string | null,
          }));
          setUserApplications(typedApplications);
        }
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Get application status for a specific form
  const getApplicationStatus = (formId: string, template: FormTemplate): ApplicationStatus => {
    const formType = (template.settings as any)?.formType as FormType || 'other';
    
    // Check if user has existing pending application for this form type
    const pendingApp = userApplications.find(a => a.type === formId && a.status === 'pending');
    if (pendingApp) {
      return "pending";
    }

    // Check if revision is requested
    const revisionApp = userApplications.find(a => a.type === formId && a.status === 'revision_requested');
    if (revisionApp) {
      return "revision_requested";
    }

    // Check for approved/rejected status
    const app = userApplications.find(a => a.type === formId);
    if (app) {
      if (app.status === 'approved') return "approved";
      if (app.status === 'rejected') return "rejected";
    }

    // Whitelist forms are only for unverified users
    if (formType === 'whitelist') {
      if (isWhitelistApproved) {
        return "locked"; // Already verified, can't apply to whitelist
      }
      return "open";
    }

    // Other forms - check user access types
    const userAccessTypes = (template.settings as any)?.userAccessTypes || ['verified'];
    
    // Check if user can access based on their verification status
    if (isWhitelistApproved) {
      // User is verified, check if form allows verified users
      if (!userAccessTypes.includes('verified')) {
        return "locked";
      }
    } else {
      // User is unverified, check if form allows unverified users
      if (!userAccessTypes.includes('unverified')) {
        return "locked";
      }
    }

    // Check max applications limit
    const maxApps = template.settings?.maxApplications || 0;
    if (maxApps > 0) {
      // TODO: Check total application count for this form
    }

    return "open";
  };

  // Separate whitelist and other forms
  const whitelistForms = formTemplates.filter(t => (t.settings as any)?.formType === 'whitelist');
  const otherForms = formTemplates.filter(t => (t.settings as any)?.formType !== 'whitelist');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
  };

  // Application history from database
  const applicationHistory: HistoryItemProps[] = userApplications.map((app, index) => {
    // Find form title from templates
    const template = formTemplates.find(t => t.id === app.type);
    return {
      id: app.id,
      applicationNumber: app.application_number,
      title: template?.title || app.type,
      status: app.status as "approved" | "pending" | "rejected" | "revision_requested",
      type: app.type,
      delay: 0.5 + index * 0.1
    };
  });

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-display text-foreground">Giriş Yapmalısınız</h1>
            <p className="text-muted-foreground">Başvuru yapabilmek için önce giriş yapmanız gerekmektedir.</p>
            <Link 
              to="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary/30"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Hero gradient background */}
      <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />
      
      {/* Animated light rays */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        <motion.div 
          className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3], x: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.div 
          className="absolute top-0 left-2/3 w-[1px] h-full bg-gradient-to-b from-primary/8 via-transparent to-transparent"
          animate={{ opacity: [0.15, 0.4, 0.15], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Large ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-[0]" />

      <Header />
      
      <main className="flex-1 pt-32 pb-24 relative z-10">
        <motion.div 
          className="container mx-auto px-4 md:px-6 max-w-7xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Back Button */}
          <motion.div variants={itemVariants} className="mb-10">
            <Link 
              to="/"
              className="inline-flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <motion.div
                whileHover={{ x: -4 }}
                className="p-2 rounded-lg bg-card/50 border border-border/30 group-hover:border-primary/30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.div>
              <span className="text-sm tracking-wide">Ana Sayfa</span>
            </Link>
          </motion.div>

          {/* Page Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="text-primary/60 text-xs tracking-[0.4em] uppercase font-medium mb-5 block">
              Yönetim Paneli
            </span>
            
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-foreground leading-[0.9] tracking-tight">
              <motion.span 
                className="text-primary inline-block"
                animate={{
                  textShadow: [
                    "0 0 20px hsl(var(--primary) / 0.3)",
                    "0 0 50px hsl(var(--primary) / 0.6)",
                    "0 0 20px hsl(var(--primary) / 0.3)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                BAŞVURU
              </motion.span>
              <br />
              <span className="text-foreground/90">MERKEZİ</span>
            </h1>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-10">
            {/* Left Column - Application Cards */}
            <motion.div variants={itemVariants} className="space-y-8">
              {/* Status Banner for non-whitelisted users */}
              {!isWhitelistApproved && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-lg border border-amber-500/20 bg-amber-500/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Whitelist Onayı Gerekli</h3>
                      <p className="text-sm text-muted-foreground">
                        Diğer başvuruları yapabilmek için önce whitelist başvurunuzun onaylanması gerekmektedir.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Forms from Database */}
              {formTemplates.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 border border-dashed border-border/30 rounded-lg"
                >
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Henüz aktif başvuru formu bulunmuyor</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Whitelist Forms Section */}
                  {whitelistForms.length > 0 && !isWhitelistApproved && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-primary tracking-wide">Whitelist Başvurusu</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {whitelistForms.map((template, index) => {
                          const appStatus = getApplicationStatus(template.id, template);
                          const revisionApp = userApplications.find(a => a.type === template.id && a.status === 'revision_requested');
                          const revisionCount = Array.isArray(revisionApp?.revision_requested_fields)
                            ? revisionApp?.revision_requested_fields.length
                            : undefined;
                          return (
                            <ApplicationCard
                              key={template.id}
                              title={template.title}
                              description={template.description}
                              status={appStatus}
                              formId={template.id}
                              featured={true}
                              delay={0.1 + index * 0.1}
                              coverImage={template.cover_image_url}
                              rejectionReason={userApplications.find(a => a.type === template.id && a.status === 'rejected')?.admin_note}
                              onReapply={appStatus === 'rejected' ? () => navigate(`/basvuru/${template.id}`) : undefined}
                              revisionCount={revisionCount}
                              onRevisionEdit={appStatus === 'revision_requested' ? () => navigate(`/basvuru/${template.id}/revision`) : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other Forms Section */}
                  {otherForms.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground tracking-wide">Diğer Başvurular</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {otherForms.map((template, index) => {
                          const appStatus = getApplicationStatus(template.id, template);
                          const revisionApp = userApplications.find(a => a.type === template.id && a.status === 'revision_requested');
                          const revisionCount = Array.isArray(revisionApp?.revision_requested_fields)
                            ? revisionApp?.revision_requested_fields.length
                            : undefined;
                          return (
                            <ApplicationCard
                              key={template.id}
                              title={template.title}
                              description={template.description}
                              status={appStatus}
                              formId={template.id}
                              featured={true}
                              delay={0.2 + index * 0.1}
                              coverImage={template.cover_image_url}
                              rejectionReason={userApplications.find(a => a.type === template.id && a.status === 'rejected')?.admin_note}
                              onReapply={appStatus === 'rejected' ? () => navigate(`/basvuru/${template.id}`) : undefined}
                              revisionCount={revisionCount}
                              onRevisionEdit={appStatus === 'revision_requested' ? () => navigate(`/basvuru/${template.id}/revision`) : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Right Column - Application History */}
            <motion.div variants={itemVariants}>
              <div className="sticky top-32">
                <div className="p-6 rounded-lg bg-card/20 border border-border/15">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg text-foreground tracking-wide">
                      Başvuru Geçmişi
                    </h3>
                    <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                      Son {Math.min(applicationHistory.length, 5)}
                    </span>
                  </div>

                  {applicationHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-8">
                      Henüz başvuru yok
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {applicationHistory.slice(0, 5).map((item) => (
                        <HistoryItem key={item.id} {...item} />
                      ))}
                    </div>
                  )}

                  {/* User Stats */}
                  <div className="mt-8 pt-6 border-t border-border/15">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-card/30">
                        <span className="text-2xl font-display text-primary">
                          {applicationHistory.filter(a => a.status === "approved").length}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">
                          Onaylanan
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-card/30">
                        <span className="text-2xl font-display text-amber-500">
                          {applicationHistory.filter(a => a.status === "pending").length}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">
                          Bekleyen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Basvuru;
