import { useMemo, useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, CheckCircle, Clock, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Application card types
type ApplicationStatus = "open" | "closed" | "approved" | "pending" | "draft" | "rejected" | "locked";

interface ApplicationCardProps {
  title: string;
  status: ApplicationStatus;
  formId?: string;
  featured?: boolean;
  delay?: number;
  applicationId?: number;
}

interface HistoryItemProps {
  id: number;
  title: string;
  status: "approved" | "pending" | "draft" | "rejected";
  type: string;
  delay?: number;
}

interface UserApplication {
  id: number;
  type: string;
  status: string;
  created_at: string;
}

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

const ApplicationCard = ({ title, status, formId, featured, delay = 0, applicationId }: ApplicationCardProps) => {
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
          <div className="py-3 text-center text-destructive text-sm border border-destructive/20 rounded-md bg-destructive/5 flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" />
            Başvurunuz reddedildi
          </div>
        );
      case "draft":
        return (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 rounded-md font-medium transition-all duration-300 border border-amber-500/20 text-sm"
          >
            Devam Et
          </motion.button>
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
      className={`relative p-5 rounded-lg border transition-all duration-300 group ${
        featured 
          ? "bg-card/60 border-primary/20 hover:border-primary/40" 
          : "bg-card/30 border-border/20 hover:border-border/40"
      } ${status === "locked" ? "opacity-60" : ""}`}
    >
      <div className="space-y-4">
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

        {/* Subtle divider */}
        <div className="h-px bg-border/20" />

        {/* Status content */}
        {getStatusContent()}
      </div>
    </motion.div>
  );
};

const HistoryItem = ({ id, title, status, type, delay = 0 }: HistoryItemProps) => {
  const statusConfig = {
    approved: { color: "text-primary", label: "Onaylandı", icon: CheckCircle },
    pending: { color: "text-amber-500", label: "Beklemede", icon: Clock },
    draft: { color: "text-muted-foreground", label: "Taslak", icon: Clock },
    rejected: { color: "text-destructive", label: "Reddedildi", icon: XCircle },
  };
  const config = statusConfig[status];
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
        <span className="text-[10px] text-muted-foreground font-mono">
          #{id}
        </span>
      </div>
    </motion.div>
  );
};

const formTypeNames: Record<string, string> = {
  'whitelist': 'Whitelist Başvurusu',
  'lspd-akademi': 'LSPD Akademi Başvurusu',
  'sirket': 'Şirket Başvurusu',
  'taksici': 'Taksici Başvurusu',
  'hastane': 'LSFMD Hastane Başvurusu',
};

const Basvuru = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const particles = useMemo(() => generateFloatingParticles(25), []);
  
  const [isWhitelistApproved, setIsWhitelistApproved] = useState(false);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
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
          .select('id, type, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (appError) {
          console.error('Applications fetch error:', appError);
        } else {
          setUserApplications(applications || []);
        }
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserData();
    }
  }, [user, authLoading]);

  // Get application status for a specific form type
  const getApplicationStatus = (formType: string): ApplicationStatus => {
    const app = userApplications.find(a => a.type === formType);
    if (app) {
      return app.status as ApplicationStatus;
    }
    return "open";
  };

  // Get application ID for a specific form type
  const getApplicationId = (formType: string): number | undefined => {
    const app = userApplications.find(a => a.type === formType);
    return app?.id;
  };

  // Check if user has pending whitelist application
  const hasPendingWhitelist = userApplications.some(
    a => a.type === 'whitelist' && a.status === 'pending'
  );

  // Check if user has rejected whitelist application (can reapply)
  const hasRejectedWhitelist = userApplications.some(
    a => a.type === 'whitelist' && a.status === 'rejected'
  );

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

  // Whitelist application card status
  const getWhitelistStatus = (): ApplicationStatus => {
    if (isWhitelistApproved) return "approved";
    if (hasPendingWhitelist) return "pending";
    if (hasRejectedWhitelist) return "open"; // Can reapply after rejection
    return "open";
  };

  // Role applications - locked if not whitelist approved
  const roleApplications: ApplicationCardProps[] = [
    { 
      title: "Birlik Başvurusu", 
      status: isWhitelistApproved ? "closed" : "locked" 
    },
    { 
      title: "LSPD Akademi Başvurusu", 
      status: isWhitelistApproved ? getApplicationStatus('lspd-akademi') : "locked",
      formId: "lspd-akademi", 
      featured: isWhitelistApproved,
      applicationId: getApplicationId('lspd-akademi')
    },
    { 
      title: "Alt Karakter Başvurusu", 
      status: isWhitelistApproved ? "closed" : "locked" 
    },
    { 
      title: "Şirket Başvurusu", 
      status: isWhitelistApproved ? getApplicationStatus('sirket') : "locked",
      formId: "sirket", 
      featured: isWhitelistApproved,
      applicationId: getApplicationId('sirket')
    },
    { 
      title: "Taksici Başvurusu", 
      status: isWhitelistApproved ? getApplicationStatus('taksici') : "locked",
      formId: "taksici", 
      featured: isWhitelistApproved,
      applicationId: getApplicationId('taksici')
    },
    { 
      title: "LSFMD Hastane Birimi Başvurusu", 
      status: isWhitelistApproved ? getApplicationStatus('hastane') : "locked",
      formId: "hastane", 
      featured: isWhitelistApproved,
      applicationId: getApplicationId('hastane')
    },
  ];

  // Application history from database
  const applicationHistory: HistoryItemProps[] = userApplications.map((app, index) => ({
    id: app.id,
    title: formTypeNames[app.type] || app.type,
    status: app.status as "approved" | "pending" | "draft" | "rejected",
    type: app.type,
    delay: 0.5 + index * 0.1
  }));

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
              {" "}
              <span className="text-foreground/40">MERKEZİ</span>
            </h1>
            
            <motion.div 
              className="w-40 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-8 mb-6"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              {isWhitelistApproved 
                ? "Sunucuya katılım ve rol yetkileri için gerekli tüm başvurularını buradan yönetebilirsin."
                : "Sunucuya katılmak için önce Whitelist başvurusu yapmalısın. Onaylandıktan sonra diğer başvuruları yapabilirsin."
              }
            </p>

            {/* User Status Badge */}
            <div className="mt-6 flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                isWhitelistApproved 
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {isWhitelistApproved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Onaylı Üye
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Onaysız Üye
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Left Column - Applications */}
            <div className="space-y-14">
              {/* Whitelist Application Section - Only for non-approved users */}
              {!isWhitelistApproved && (
                <motion.section variants={itemVariants} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    <h2 className="font-display text-base tracking-[0.25em] text-primary/90 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      WHITELIST BAŞVURUSU
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  </div>

                  <div className="max-w-lg">
                    <ApplicationCard 
                      title="Whitelist Başvurusu" 
                      status={getWhitelistStatus()}
                      formId="whitelist"
                      featured={true}
                      delay={0.1}
                    />
                  </div>

                  {hasPendingWhitelist && (
                    <p className="text-sm text-muted-foreground">
                      Whitelist başvurunuz inceleniyor. Onaylandığında diğer başvuruları yapabilirsiniz.
                    </p>
                  )}
                </motion.section>
              )}

              {/* Approved Whitelist Status */}
              {isWhitelistApproved && (
                <motion.section variants={itemVariants} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    <h2 className="font-display text-base tracking-[0.25em] text-primary/90 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      TEMEL BAŞVURULAR
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  </div>

                  <div className="max-w-lg">
                    <ApplicationCard 
                      title="Whitelist Başvurusu" 
                      status="approved"
                      delay={0.1}
                    />
                  </div>
                </motion.section>
              )}

              {/* Role Applications Section */}
              <motion.section variants={itemVariants} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <h2 className="font-display text-base tracking-[0.25em] text-primary/90 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ROL BAŞVURULARI
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roleApplications.map((app, index) => (
                    <ApplicationCard key={index} {...app} delay={0.15 + index * 0.08} />
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Right Column - Sidebar */}
            <motion.aside
              variants={itemVariants}
              className="lg:sticky lg:top-32 self-start"
            >
              <div className="relative p-6 rounded-2xl bg-card/20 backdrop-blur-sm border border-border/20 overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-5">
                  {/* Section title */}
                  <div className="pb-4 border-b border-border/20">
                    <h2 className="font-display text-sm tracking-[0.2em] text-primary/80">
                      GEÇMİŞ BAŞVURULARIN
                    </h2>
                  </div>

                  {/* History items */}
                  <div className="space-y-3">
                    {applicationHistory.length > 0 ? (
                      applicationHistory.map((item) => (
                        <HistoryItem key={item.id} {...item} />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz başvuru yapmadınız
                      </p>
                    )}
                  </div>

                  {/* Footer decoration */}
                  <div className="pt-5 mt-5 border-t border-border/10">
                    <motion.div 
                      className="flex items-center gap-2.5 text-muted-foreground/40 text-xs"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      <span className="tracking-wide">Aktif başvuru sistemi</span>
                    </motion.div>
                  </div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
                  <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-primary/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8">
                  <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-primary/40 to-transparent" />
                  <div className="absolute bottom-0 right-0 h-full w-[1px] bg-gradient-to-t from-primary/40 to-transparent" />
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Basvuru;