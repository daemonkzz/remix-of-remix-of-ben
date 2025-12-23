import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Check, ArrowLeft, Clock, FileText, Users, Building2, Car, Hospital, Shield, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Application card types
type ApplicationStatus = "open" | "closed" | "approved" | "pending" | "draft";

interface ApplicationCardProps {
  title: string;
  status: ApplicationStatus;
  icon?: React.ReactNode;
  featured?: boolean;
  applicationNumber?: string;
}

interface HistoryItemProps {
  title: string;
  status: "approved" | "pending" | "draft" | "rejected";
  applicationNumber?: string;
}

const ApplicationCard = ({ title, status, icon, featured }: ApplicationCardProps) => {
  const getStatusContent = () => {
    switch (status) {
      case "open":
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-secondary/80 hover:bg-secondary text-foreground/80 hover:text-foreground rounded-lg font-medium transition-all duration-300 border border-border/30 hover:border-primary/30"
          >
            Başvuru Yap
          </motion.button>
        );
      case "closed":
        return (
          <div className="flex items-center gap-2 text-destructive/80">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Başvurular kapalı.</span>
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-lg">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Whitelist başvurunuz onaylandı.</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-amber-500/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Başvurunuz inceleniyor.</span>
          </div>
        );
      case "draft":
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-lg font-medium transition-all duration-300 border border-amber-500/30"
          >
            Devam Et
          </motion.button>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (status === "approved") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full border border-primary/30">
          ONAYLI
        </span>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative p-6 rounded-xl border transition-all duration-300 group ${
        featured 
          ? "bg-gradient-to-br from-card/80 to-card/40 border-primary/20 hover:border-primary/40" 
          : "bg-card/50 border-border/20 hover:border-border/40"
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Featured icon */}
      {featured && (
        <div className="absolute top-4 right-4 text-amber-500">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎁
          </motion.div>
        </div>
      )}

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-secondary/50 text-primary">
                {icon}
              </div>
            )}
            <h3 className="font-display text-xl tracking-wide text-foreground">
              {title}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Decorative dots */}
        <div className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="w-1 h-1 rounded-full bg-primary/20" />
        </div>

        {/* Status content */}
        <div className="pt-2">
          {getStatusContent()}
        </div>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-xl">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rotate-45" />
      </div>
    </motion.div>
  );
};

const HistoryItem = ({ title, status, applicationNumber }: HistoryItemProps) => {
  const getStatusIndicator = () => {
    switch (status) {
      case "approved":
        return <span className="text-primary text-xs">● Onaylandı</span>;
      case "pending":
        return <span className="text-amber-500 text-xs">● Beklemede</span>;
      case "draft":
        return <span className="text-muted-foreground text-xs">● Taslak</span>;
      case "rejected":
        return <span className="text-destructive text-xs">● Reddedildi</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -4 }}
      className="p-4 bg-card/30 border border-border/20 rounded-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </h4>
          {getStatusIndicator()}
        </div>
        {applicationNumber && (
          <span className="text-xs text-primary/60 font-mono">
            #{applicationNumber}
          </span>
        )}
      </div>
      
      {status === "draft" && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="mt-3 w-full py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md border border-amber-500/20 transition-all"
        >
          Devam Et
        </motion.button>
      )}
    </motion.div>
  );
};

const Basvuru = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Example data - replace with actual data
  const basicApplications: ApplicationCardProps[] = [
    { 
      title: "Whitelist Başvurusu", 
      status: "approved",
      icon: <Shield className="w-5 h-5" />
    },
  ];

  const roleApplications: ApplicationCardProps[] = [
    { 
      title: "Birlik Başvurusu", 
      status: "closed",
      icon: <Users className="w-5 h-5" />
    },
    { 
      title: "LSPD Akademi Başvurusu", 
      status: "open",
      icon: <Shield className="w-5 h-5" />,
      featured: true
    },
    { 
      title: "Alt Karakter Başvurusu", 
      status: "closed",
      icon: <User className="w-5 h-5" />
    },
    { 
      title: "Şirket Başvurusu", 
      status: "open",
      icon: <Building2 className="w-5 h-5" />,
      featured: true
    },
    { 
      title: "Taksici Başvurusu", 
      status: "open",
      icon: <Car className="w-5 h-5" />,
      featured: true
    },
    { 
      title: "LSFMD Hastane Birimi Başvurusu", 
      status: "open",
      icon: <Hospital className="w-5 h-5" />,
      featured: true
    },
  ];

  const applicationHistory: HistoryItemProps[] = [
    { title: "Şirket Başvurusu", status: "draft", applicationNumber: "2178" },
    { title: "Whitelist Başvuru", status: "approved", applicationNumber: "1139" },
    { title: "Ön Onay", status: "approved", applicationNumber: "576" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Ana Sayfa</span>
            </Link>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Main content */}
            <div className="flex-1 space-y-12">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="font-display text-5xl md:text-6xl tracking-wider text-glow">
                  Başvuru Merkezi
                </h1>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  Sunucuya katılım ve rol yetkileri için gerekli tüm başvurularını buradan yönetebilirsin.
                </p>
              </motion.div>

              {/* Basic Applications Section */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <h2 className="font-display text-lg tracking-widest text-primary/80">
                    TEMEL BAŞVURULAR
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </motion.div>

                <motion.div variants={itemVariants} className="max-w-md">
                  {basicApplications.map((app, index) => (
                    <ApplicationCard key={index} {...app} />
                  ))}
                </motion.div>
              </motion.section>

              {/* Role Applications Section */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <h2 className="font-display text-lg tracking-widest text-primary/80">
                    ROL BAŞVURULARI
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </motion.div>

                <motion.div 
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {roleApplications.map((app, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <ApplicationCard {...app} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            </div>

            {/* Sidebar - Application History */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:w-80 xl:w-96"
            >
              <div className="lg:sticky lg:top-32 space-y-4">
                {/* Section title */}
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-4 h-4 text-primary/60" />
                  <h2 className="font-display text-sm tracking-widest text-primary/60">
                    GEÇMİŞ BAŞVURULARIN
                  </h2>
                </div>

                {/* History items */}
                <div className="space-y-3">
                  {applicationHistory.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <HistoryItem {...item} />
                    </motion.div>
                  ))}
                </div>

                {/* Decorative element */}
                <div className="mt-8 pt-8 border-t border-border/10">
                  <div className="flex items-center gap-2 text-muted-foreground/50 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
                    <span>Aktif başvuru sistemi</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Basvuru;
