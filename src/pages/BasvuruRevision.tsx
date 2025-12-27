import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, AlertCircle, Edit } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { FormQuestion, FormSettings } from "@/types/formBuilder";

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  questions: FormQuestion[];
  settings: FormSettings;
}

interface Application {
  id: number;
  user_id: string;
  type: string;
  content: Record<string, string>;
  status: string;
  revision_requested_fields: string[] | null;
  revision_notes: Record<string, string> | null;
  content_history: Array<{ timestamp: string; content: Record<string, string> }>;
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

const normalizeContent = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string").join(", ");
    else if (v == null) out[k] = "";
    else out[k] = String(v);
  }
  return out;
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

const BasvuruRevision = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const particles = useMemo(() => generateFloatingParticles(15), []);

  // Load form template and application
  useEffect(() => {
    const loadData = async () => {
      if (!formId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch form template
        // Güvenli view kullan - accessCodes gibi hassas bilgileri gizler
        const { data: templateData, error: templateError } = await supabase
          .from('form_templates_public')
          .select('*')
          .eq('id', formId)
          .maybeSingle();

        if (templateError) {
          console.error('Form template fetch error:', templateError);
          toast({
            title: "Hata",
            description: "Form yüklenirken bir hata oluştu.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (templateData) {
          const template = {
            ...templateData,
            questions: templateData.questions as FormQuestion[],
            settings: templateData.settings as FormSettings
          };
          setFormTemplate(template);
        }

        // Fetch user's revision_requested application
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', formId)
          .eq('status', 'revision_requested')
          .maybeSingle();

        if (appError) {
          console.error('Application fetch error:', appError);
        } else if (appData) {
          const app: Application = {
            ...appData,
            content: normalizeContent(appData.content),
            revision_requested_fields: normalizeStringArray(appData.revision_requested_fields),
            revision_notes: normalizeStringRecord(appData.revision_notes),
            content_history: (Array.isArray(appData.content_history) ? appData.content_history : []) as Array<{ timestamp: string; content: Record<string, string> }>
          };
          setApplication(app);

          // Initialize form data with current content
          const initialData: Record<string, string | string[]> = {};
          Object.entries(app.content).forEach(([key, value]) => {
            initialData[key] = value;
          });
          setFormData(initialData);
        }
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [formId, user, authLoading, toast]);

  const updateField = (questionLabel: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [questionLabel]: value
    }));
  };

  const handleCheckboxChange = (questionLabel: string, option: string, checked: boolean) => {
    const currentValue = formData[questionLabel];
    const currentValues = typeof currentValue === 'string' 
      ? currentValue.split(', ').filter(v => v) 
      : (currentValue as string[]) || [];
    
    if (checked) {
      updateField(questionLabel, [...currentValues, option]);
    } else {
      updateField(questionLabel, currentValues.filter(v => v !== option));
    }
  };

  const isFieldRevisionRequested = (questionLabel: string): boolean => {
    const fields = application?.revision_requested_fields;
    return Array.isArray(fields) && fields.includes(questionLabel);
  };

  const getRevisionNote = (questionLabel: string): string | null => {
    const notes = application?.revision_notes;
    if (!notes) return null;
    return notes[questionLabel] || null;
  };

  const handleSubmit = async () => {
    if (!user || !application || !formTemplate) return;

    setIsSubmitting(true);

    try {
      // Save current content to history
      const newHistory = [
        ...application.content_history,
        {
          timestamp: new Date().toISOString(),
          content: application.content
        }
      ];

      // Prepare updated content
      const updatedContent: Record<string, string> = {};
      Object.entries(formData).forEach(([key, value]) => {
        updatedContent[key] = Array.isArray(value) ? value.join(', ') : (value || '');
      });

      const { error, data } = await supabase
        .from('applications')
        .update({
          content: updatedContent,
          content_history: newHistory,
          status: 'pending',
          revision_requested_fields: null,
          revision_notes: null
        })
        .eq('id', application.id)
        .eq('user_id', user?.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // Check if any row was actually updated
      if (!data || data.length === 0) {
        throw new Error('Güncelleme yapılamadı. Lütfen tekrar deneyin.');
      }

      setIsSubmitted(true);
      toast({
        title: "Revizyon Gönderildi",
        description: "Başvurunuz tekrar incelemeye alınacaktır.",
      });
      navigate("/basvuru");
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Hata",
        description: "Revizyon gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: FormQuestion, index: number) => {
    const questionLabel = question.label;
    const value = formData[questionLabel];
    const isRevisionRequired = isFieldRevisionRequested(questionLabel);
    const revisionNote = getRevisionNote(questionLabel);

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`space-y-3 p-4 rounded-lg border transition-all ${
          isRevisionRequired 
            ? 'border-amber-500/40 bg-amber-500/5' 
            : 'border-border/20 bg-card/20'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <Label className="text-foreground">
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {isRevisionRequired && (
            <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
              <Edit className="w-3 h-3" />
              Revizyon İstendi
            </span>
          )}
        </div>

        {/* Revision Note */}
        {revisionNote && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <p className="text-xs text-amber-500 font-medium mb-1">Admin Notu:</p>
            <p className="text-sm text-foreground">{revisionNote}</p>
          </div>
        )}

        {/* Input Fields - Disabled if not revision requested */}
        {question.type === 'short_text' && (
          <Input
            value={(typeof value === 'string' ? value : '') || ''}
            onChange={(e) => updateField(questionLabel, e.target.value)}
            placeholder={question.placeholder || ''}
            className="bg-card/40 border-border/30"
            disabled={!isRevisionRequired}
          />
        )}

        {question.type === 'paragraph' && (
          <Textarea
            value={(typeof value === 'string' ? value : '') || ''}
            onChange={(e) => updateField(questionLabel, e.target.value)}
            placeholder={question.placeholder || ''}
            className="bg-card/40 border-border/30 min-h-[120px] resize-none"
            disabled={!isRevisionRequired}
          />
        )}

        {question.type === 'number' && (
          <Input
            type="number"
            value={(typeof value === 'string' ? value : '') || ''}
            onChange={(e) => updateField(questionLabel, e.target.value)}
            placeholder={question.placeholder || ''}
            className="bg-card/40 border-border/30 max-w-[200px]"
            disabled={!isRevisionRequired}
          />
        )}

        {question.type === 'discord_id' && (
          <Input
            value={(typeof value === 'string' ? value : '') || ''}
            onChange={(e) => updateField(questionLabel, e.target.value)}
            placeholder={question.placeholder || 'Örn: 123456789012345678'}
            className="bg-card/40 border-border/30 max-w-[300px] font-mono"
            disabled={!isRevisionRequired}
          />
        )}

        {question.type === 'radio' && question.options && (
          <RadioGroup
            value={(typeof value === 'string' ? value : '') || ''}
            onValueChange={(val) => updateField(questionLabel, val)}
            className="space-y-2"
            disabled={!isRevisionRequired}
          >
            {question.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className={`flex items-center space-x-3 p-3 rounded-lg border border-border/30 bg-card/40 ${
                  isRevisionRequired ? 'hover:border-primary/30' : 'opacity-60'
                } transition-colors`}
              >
                <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} disabled={!isRevisionRequired} />
                <Label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="text-foreground cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'checkbox' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const currentValue = typeof value === 'string'
                ? value.split(', ').filter(v => v)
                : Array.isArray(value) ? value : [];
              const isChecked = currentValue.includes(option);
              return (
                <div
                  key={optionIndex}
                  className={`flex items-center space-x-3 p-3 rounded-lg border border-border/30 bg-card/40 ${
                    isRevisionRequired ? 'hover:border-primary/30' : 'opacity-60'
                  } transition-colors`}
                >
                  <Checkbox
                    id={`${question.id}-${optionIndex}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(questionLabel, option, checked as boolean)
                    }
                    disabled={!isRevisionRequired}
                  />
                  <Label
                    htmlFor={`${question.id}-${optionIndex}`}
                    className="text-foreground cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  // Loading state
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

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-display text-foreground">Giriş Yapmalısınız</h1>
            <p className="text-muted-foreground">Devam etmek için giriş yapmanız gerekmektedir.</p>
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

  // No revision requested application found
  if (!application || !formTemplate) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl text-foreground">Revizyon Bulunamadı</h1>
            <p className="text-muted-foreground">Bu form için revizyon bekleyen başvuru bulunamadı.</p>
            <Link to="/basvuru" className="inline-block text-primary hover:underline">
              Başvuru merkezine dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const revisionCount = application.revision_requested_fields?.length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-amber-500/30"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 0.5, 0],
              scale: [0.5, 1, 0.5],
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

      {/* Background */}
      <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-[0]" />

      <Header />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/basvuru"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Başvuru Merkezine Dön</span>
            </Link>
          </motion.div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Edit className="w-6 h-6 text-amber-500" />
              <span className="text-amber-500 text-sm font-medium">Revizyon Modu</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-3">
              {formTemplate.title}
            </h1>
            <p className="text-muted-foreground">
              {revisionCount} soru için revizyon istendi. Lütfen sarı ile işaretlenmiş alanları düzenleyip gönderin.
            </p>
          </motion.div>

          {/* Questions */}
          <div className="space-y-4 mb-8">
            {formTemplate.questions.map((question, index) => renderQuestion(question, index))}
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isSubmitted}
              size="lg"
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : isSubmitted ? (
                <>
                  <Send className="w-5 h-5" />
                  Gönderildi
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Revizyonu Gönder
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BasvuruRevision;
