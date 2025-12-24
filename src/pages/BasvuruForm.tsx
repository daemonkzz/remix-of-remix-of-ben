import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Send, Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useApplicationForm, FormStep } from "@/hooks/useApplicationForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Form configurations for different application types
const formConfigs: Record<string, { title: string; steps: FormStep[] }> = {
  "whitelist": {
    title: "Whitelist Başvurusu",
    steps: [
      {
        id: "personal",
        title: "Kişisel Bilgiler",
        description: "Kendiniz hakkında bilgi verin",
        fields: [
          { id: "discordName", type: "text", label: "Discord Kullanıcı Adınız", placeholder: "Örn: username#1234", required: true },
          { id: "age", type: "text", label: "Gerçek Yaşınız", placeholder: "Örn: 18", required: true },
          { id: "howDidYouFind", type: "select", label: "Sunucuyu Nasıl Buldunuz?", options: ["Discord", "YouTube", "Arkadaş Tavsiyesi", "Sosyal Medya", "Diğer"], required: true },
        ],
      },
      {
        id: "experience",
        title: "Roleplay Deneyimi",
        description: "RP deneyiminiz hakkında bilgi verin",
        fields: [
          { id: "rpExperience", type: "textarea", label: "Daha Önce RP Deneyiminiz Var mı?", placeholder: "Hangi sunucularda, ne kadar süre oynadınız?", required: true },
          { id: "whatIsRp", type: "textarea", label: "Roleplay Nedir? Kısaca Açıklayın", placeholder: "RP kavramını nasıl anlıyorsunuz?", required: true },
          { id: "rules", type: "textarea", label: "Temel RP Kurallarını Biliyor musunuz?", placeholder: "RDM, VDM, Metagaming gibi kavramları açıklayın...", required: true },
        ],
      },
      {
        id: "character",
        title: "Karakter Bilgileri",
        description: "Oluşturmak istediğiniz karakter",
        fields: [
          { id: "characterName", type: "text", label: "Karakter Adı Soyadı", placeholder: "Örn: John Doe", required: true },
          { id: "characterAge", type: "text", label: "Karakter Yaşı", placeholder: "Örn: 25", required: true },
          { id: "characterBackstory", type: "textarea", label: "Karakter Hikayesi", placeholder: "Karakterinizin geçmişini, kişiliğini ve hedeflerini anlatın...", required: true },
        ],
      },
      {
        id: "scenario",
        title: "Senaryo Sorusu",
        description: "Aşağıdaki senaryoya nasıl tepki verirsiniz?",
        fields: [
          { id: "scenario1", type: "textarea", label: "Senaryo: Karakteriniz şehre yeni gelmiş ve bir iş arıyor. Bir kafede oturuyorken yanınıza biri yaklaşıp size iş teklif ediyor. Ne yaparsınız?", placeholder: "Karakteriniz olarak nasıl tepki verirsiniz? Detaylı anlatın...", required: true },
          { id: "scenario2", type: "textarea", label: "Senaryo: Arabanızla giderken bir kaza yapıyorsunuz ve karşı araçtaki kişi size bağırmaya başlıyor. Ne yaparsınız?", placeholder: "Karakteriniz olarak nasıl tepki verirsiniz?", required: true },
        ],
      },
    ],
  },
  "lspd-akademi": {
    title: "LSPD Akademi Başvurusu",
    steps: [
      {
        id: "personal",
        title: "Kişisel Bilgiler",
        description: "Karakter bilgilerinizi girin",
        fields: [
          { id: "characterName", type: "text", label: "Karakter Adı Soyadı", placeholder: "Örn: John Doe", required: true },
          { id: "age", type: "text", label: "Karakter Yaşı", placeholder: "Örn: 25", required: true },
          { id: "phone", type: "text", label: "Telefon Numarası", placeholder: "Örn: 555-1234", required: true },
        ],
      },
      {
        id: "background",
        title: "Geçmiş Bilgileri",
        description: "Karakterinizin geçmişi hakkında bilgi verin",
        fields: [
          { id: "previousJob", type: "text", label: "Önceki Mesleğiniz", placeholder: "Varsa belirtin", required: false },
          { id: "criminalRecord", type: "radio", label: "Sabıka Kaydınız Var mı?", options: ["Evet", "Hayır"], required: true },
          { id: "backstory", type: "textarea", label: "Karakter Hikayeniz", placeholder: "Karakterinizin geçmişini kısaca anlatın...", required: true },
        ],
      },
      {
        id: "motivation",
        title: "Motivasyon",
        description: "LSPD'ye katılma nedenleriniz",
        fields: [
          { id: "whyJoin", type: "textarea", label: "Neden LSPD'ye Katılmak İstiyorsunuz?", placeholder: "Motivasyonunuzu açıklayın...", required: true },
          { id: "experience", type: "textarea", label: "Roleplay Deneyiminiz", placeholder: "Daha önce RP sunucularında deneyiminiz var mı?", required: true },
          { id: "availability", type: "select", label: "Haftalık Aktiflik Süreniz", options: ["1-5 saat", "5-10 saat", "10-20 saat", "20+ saat"], required: true },
        ],
      },
      {
        id: "scenario",
        title: "Senaryo Soruları",
        description: "Aşağıdaki senaryolara nasıl tepki verirsiniz?",
        fields: [
          { id: "scenario1", type: "textarea", label: "Senaryo 1: Bir trafik kontrolü sırasında sürücü kaçmaya çalışıyor. Ne yaparsınız?", placeholder: "Cevabınızı yazın...", required: true },
          { id: "scenario2", type: "textarea", label: "Senaryo 2: Bir banka soygunu ihbarı alıyorsunuz. Nasıl müdahale edersiniz?", placeholder: "Cevabınızı yazın...", required: true },
        ],
      },
    ],
  },
  "sirket": {
    title: "Şirket Başvurusu",
    steps: [
      {
        id: "company",
        title: "Şirket Bilgileri",
        description: "Kurmak istediğiniz şirket hakkında bilgi verin",
        fields: [
          { id: "companyName", type: "text", label: "Şirket Adı", placeholder: "Örn: Los Santos Lojistik", required: true },
          { id: "companyType", type: "select", label: "Şirket Türü", options: ["Lojistik", "Emlak", "Oto Galeri", "Restaurant", "Diğer"], required: true },
          { id: "location", type: "text", label: "Şirket Lokasyonu", placeholder: "Örn: Vinewood Blvd.", required: true },
        ],
      },
      {
        id: "owner",
        title: "Sahip Bilgileri",
        description: "Şirket sahibi olarak bilgileriniz",
        fields: [
          { id: "ownerName", type: "text", label: "Karakter Adı Soyadı", placeholder: "Örn: John Doe", required: true },
          { id: "ownerPhone", type: "text", label: "Telefon Numarası", placeholder: "Örn: 555-1234", required: true },
          { id: "capital", type: "text", label: "Başlangıç Sermayeniz", placeholder: "Örn: $50,000", required: true },
        ],
      },
      {
        id: "plan",
        title: "İş Planı",
        description: "Şirketinizin iş planını açıklayın",
        fields: [
          { id: "businessPlan", type: "textarea", label: "İş Planınız", placeholder: "Şirketinizin nasıl çalışacağını açıklayın...", required: true },
          { id: "employees", type: "text", label: "Planlanan Çalışan Sayısı", placeholder: "Örn: 5-10", required: true },
          { id: "uniqueness", type: "textarea", label: "Şirketinizi Özel Kılan Nedir?", placeholder: "Diğer şirketlerden farkınız...", required: true },
        ],
      },
    ],
  },
  "taksici": {
    title: "Taksici Başvurusu",
    steps: [
      {
        id: "personal",
        title: "Kişisel Bilgiler",
        description: "Karakter bilgilerinizi girin",
        fields: [
          { id: "characterName", type: "text", label: "Karakter Adı Soyadı", placeholder: "Örn: John Doe", required: true },
          { id: "age", type: "text", label: "Karakter Yaşı", placeholder: "Örn: 25", required: true },
          { id: "phone", type: "text", label: "Telefon Numarası", placeholder: "Örn: 555-1234", required: true },
        ],
      },
      {
        id: "driving",
        title: "Sürüş Bilgileri",
        description: "Sürüş deneyiminiz hakkında bilgi verin",
        fields: [
          { id: "license", type: "radio", label: "Ehliyet Durumunuz", options: ["Var", "Yok"], required: true },
          { id: "accidents", type: "radio", label: "Trafik Kazası Geçmişi", options: ["Evet", "Hayır"], required: true },
          { id: "cityKnowledge", type: "select", label: "Şehir Bilginiz", options: ["Çok İyi", "İyi", "Orta", "Zayıf"], required: true },
        ],
      },
      {
        id: "availability",
        title: "Çalışma Saatleri",
        description: "Ne zaman çalışabileceğinizi belirtin",
        fields: [
          { id: "workHours", type: "select", label: "Haftalık Çalışma Saati", options: ["1-10 saat", "10-20 saat", "20-30 saat", "30+ saat"], required: true },
          { id: "whyTaxi", type: "textarea", label: "Neden Taksici Olmak İstiyorsunuz?", placeholder: "Motivasyonunuzu açıklayın...", required: true },
        ],
      },
    ],
  },
  "hastane": {
    title: "LSFMD Hastane Birimi Başvurusu",
    steps: [
      {
        id: "personal",
        title: "Kişisel Bilgiler",
        description: "Karakter bilgilerinizi girin",
        fields: [
          { id: "characterName", type: "text", label: "Karakter Adı Soyadı", placeholder: "Örn: John Doe", required: true },
          { id: "age", type: "text", label: "Karakter Yaşı", placeholder: "Örn: 25", required: true },
          { id: "phone", type: "text", label: "Telefon Numarası", placeholder: "Örn: 555-1234", required: true },
        ],
      },
      {
        id: "medical",
        title: "Tıbbi Bilgiler",
        description: "Tıbbi geçmişiniz ve eğitiminiz",
        fields: [
          { id: "education", type: "textarea", label: "Tıbbi Eğitiminiz", placeholder: "Karakterinizin aldığı tıbbi eğitimi açıklayın...", required: true },
          { id: "department", type: "select", label: "Başvurmak İstediğiniz Birim", options: ["Acil Servis", "Paramedik", "Hemşirelik", "Doktor"], required: true },
          { id: "experience", type: "textarea", label: "RP Deneyiminiz", placeholder: "Daha önce tıbbi RP deneyiminiz var mı?", required: true },
        ],
      },
      {
        id: "scenario",
        title: "Senaryo Soruları",
        description: "Aşağıdaki senaryolara nasıl tepki verirsiniz?",
        fields: [
          { id: "scenario1", type: "textarea", label: "Senaryo 1: Çoklu yaralı bir kaza ihbarı alıyorsunuz. Nasıl müdahale edersiniz?", placeholder: "Cevabınızı yazın...", required: true },
          { id: "scenario2", type: "textarea", label: "Senaryo 2: Bir hasta agresif davranıyor ve tedaviyi reddediyor. Ne yaparsınız?", placeholder: "Cevabınızı yazın...", required: true },
        ],
      },
    ],
  },
};

// Floating particles generator
const generateFloatingParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 8,
  }));
};

const BasvuruForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const particles = useMemo(() => generateFloatingParticles(15), []);

  const formConfig = formId ? formConfigs[formId] : null;

  const {
    currentStep,
    totalSteps,
    formData,
    updateField,
    saveField,
    saveAll,
    clearSaved,
    nextStep,
    prevStep,
    goToStep,
    isCurrentStepValid,
    isFieldSaved,
    currentStepData,
  } = useApplicationForm(formId || "", formConfig?.steps || []);

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-foreground mb-4">Form bulunamadı</h1>
          <Link to="/basvuru" className="text-primary hover:underline">
            Başvuru merkezine dön
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveAll = () => {
    saveAll();
    toast({
      title: "Kaydedildi",
      description: "Tüm cevaplarınız kaydedildi.",
    });
  };

  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Giriş Yapmalısınız",
        description: "Başvuru göndermek için giriş yapmanız gerekmektedir.",
        variant: "destructive",
      });
      return;
    }

    // Validate form ID
    if (!formId || !['whitelist', 'lspd-akademi', 'sirket', 'taksici', 'hastane'].includes(formId)) {
      toast({
        title: "Hata",
        description: "Geçersiz başvuru türü.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          type: formId,
          content: formData,
          status: 'pending'
        });

      if (error) {
        console.error('Application submit error:', error);
        throw error;
      }

      // Clear localStorage after successful submission
      clearSaved();
      
      toast({
        title: "Başvurunuz Gönderildi",
        description: "Başvurunuz incelemeye alınacaktır.",
      });
      navigate("/basvuru");
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Hata",
        description: "Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: typeof currentStepData.fields[0]) => {
    const value = formData[field.id] || "";
    const isSaved = isFieldSaved(field.id);

    const handleFieldSave = () => {
      saveField(field.id);
      toast({
        title: "Kaydedildi",
        description: `${field.label} kaydedildi.`,
      });
    };

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground/80">
            {field.label}
            {field.required && <span className="text-primary ml-1">*</span>}
          </label>
          <button
            onClick={handleFieldSave}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all ${
              isSaved
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {isSaved ? "Kaydedildi" : "Kaydet"}
          </button>
        </div>

        {field.type === "text" && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 bg-card/40 border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        )}

        {field.type === "textarea" && (
          <textarea
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 bg-card/40 border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />
        )}

        {field.type === "select" && field.options && (
          <select
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            className="w-full px-4 py-3 bg-card/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Seçiniz...</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {field.type === "radio" && field.options && (
          <div className="flex gap-4">
            {field.options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  value === option
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/30 bg-card/40 text-foreground/70 hover:border-border/50"
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    value === option ? "border-primary" : "border-muted-foreground/50"
                  }`}
                >
                  {value === option && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                {option}
              </label>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0.2, 0.5, 0.2],
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

      {/* Background gradient */}
      <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />

      <Header />

      <main className="flex-1 pt-28 pb-20 relative z-10">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              to="/basvuru"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Geri Dön</span>
            </Link>
          </motion.div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wide mb-3">
              {formConfig.title}
            </h1>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </motion.div>

          {/* Step Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            {formConfig.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className="flex items-center gap-2 group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index === currentStep
                      ? "bg-primary text-background"
                      : index < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-card/50 text-muted-foreground border border-border/30"
                  }`}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < formConfig.steps.length - 1 && (
                  <div
                    className={`w-8 h-px ${
                      index < currentStep ? "bg-primary/50" : "bg-border/30"
                    }`}
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/30 backdrop-blur-sm border border-border/20 rounded-xl p-6 md:p-8"
          >
            {/* Step Title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-8"
              >
                <h2 className="text-xl text-foreground font-medium mb-2">
                  {currentStepData?.title}
                </h2>
                {currentStepData?.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Fields */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {currentStepData?.fields.map(renderField)}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/20">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Geri
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/50 rounded-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </button>

                {currentStep === totalSteps - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!isCurrentStepValid() || isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-background rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Gönder
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    İleri
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Progress text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            Adım {currentStep + 1} / {totalSteps}
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BasvuruForm;
