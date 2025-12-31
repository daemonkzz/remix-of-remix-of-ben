import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, AlertCircle, Lock, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
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

const BasvuruForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});

  // Password protection state
  const [accessCode, setAccessCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Load form template from secure view (accessCodes hidden)
  useEffect(() => {
    const loadFormTemplate = async () => {
      if (!formId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('form_templates_public')
          .select('*')
          .eq('id', formId)
          .maybeSingle();

        if (error) {
          console.error('Form template fetch error:', error);
          toast({
            title: "Hata",
            description: "Form yüklenirken bir hata oluştu.",
            variant: "destructive",
          });
        } else if (data) {
          const template = {
            ...data,
            questions: data.questions as FormQuestion[],
            settings: data.settings as FormSettings
          };
          setFormTemplate(template);
          
          if (!template.settings?.isPasswordProtected) {
            setIsCodeVerified(true);
          }
        }
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormTemplate();
  }, [formId, toast]);

  // Verify code via secure database function
  const handleCodeSubmit = async () => {
    if (!formId) return;
    
    const trimmedCode = accessCode.trim();
    
    try {
      const { data, error } = await supabase.rpc('verify_form_access_code', {
        p_form_id: formId,
        p_code: trimmedCode
      });

      if (error) {
        console.error('Code verification error:', error);
        setCodeError('Doğrulama sırasında bir hata oluştu');
        return;
      }

      if (data === true) {
        setIsCodeVerified(true);
        setCodeError('');
        toast({
          title: "Erişim Sağlandı",
          description: "Kod doğrulandı, forma erişebilirsiniz.",
        });
      } else {
        setCodeError('Geçersiz erişim kodu');
        toast({
          title: "Hatalı Kod",
          description: "Girdiğiniz erişim kodu geçersiz.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Code submit error:', error);
      setCodeError('Bir hata oluştu');
    }
  };

  const updateField = (questionId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = (formData[questionId] as string[]) || [];
    if (checked) {
      updateField(questionId, [...currentValues, option]);
    } else {
      updateField(questionId, currentValues.filter(v => v !== option));
    }
  };

  const isFormValid = () => {
    if (!formTemplate) return false;
    
    return formTemplate.questions.every(question => {
      if (!question.required) return true;
      const value = formData[question.id];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value.toString().trim() !== '';
    });
  };

  // Calculate form progress
  const calculateProgress = () => {
    if (!formTemplate) return 0;
    const totalRequired = formTemplate.questions.filter(q => q.required).length;
    if (totalRequired === 0) return 100;
    
    const filledRequired = formTemplate.questions.filter(q => {
      if (!q.required) return false;
      const value = formData[q.id];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    }).length;
    
    return Math.round((filledRequired / totalRequired) * 100);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Giriş Yapmalısınız",
        description: "Başvuru göndermek için giriş yapmanız gerekmektedir.",
        variant: "destructive",
      });
      return;
    }

    if (!formTemplate || !formId) {
      toast({
        title: "Hata",
        description: "Form bilgileri eksik.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedContent: Record<string, string> = {};
      formTemplate.questions.forEach(question => {
        const value = formData[question.id];
        const formattedValue = Array.isArray(value) ? value.join(', ') : (value || '');
        formattedContent[question.label || question.id] = formattedValue;
      });

      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          type: formId,
          content: formattedContent,
          status: 'pending'
        });

      if (error) {
        console.error('Application submit error:', error);
        throw error;
      }

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

  const renderQuestion = (question: FormQuestion, index: number) => {
    const value = formData[question.id];
    const totalQuestions = formTemplate?.questions.length || 0;
    const isFilled = Array.isArray(value) ? value.length > 0 : (value && value.toString().trim() !== '');

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group"
      >
        <div className={`
          relative p-6 rounded-xl border transition-all duration-300
          ${isFilled 
            ? 'bg-primary/5 border-primary/20 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.3)]' 
            : 'bg-card/40 border-border/30 hover:border-border/50 hover:bg-card/60'
          }
        `}>
          {/* Question number badge */}
          <div className="absolute -top-3 -left-1">
            <span className={`
              inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
              ${isFilled 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted border border-border text-muted-foreground'
              }
            `}>
              {index + 1}
            </span>
          </div>

          {/* Filled indicator */}
          {isFilled && (
            <div className="absolute -top-3 -right-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          )}

          <div className="pt-2 space-y-4">
            <Label className="text-foreground text-base font-medium leading-relaxed block">
              {question.label}
              {question.required && (
                <span className="text-primary ml-1.5 text-sm">*</span>
              )}
            </Label>

            {question.type === 'short_text' && (
              <Input
                value={(value as string) || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                placeholder={question.placeholder || 'Cevabınızı yazın...'}
                className="bg-background/50 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-12"
              />
            )}

            {question.type === 'paragraph' && (
              <Textarea
                value={(value as string) || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                placeholder={question.placeholder || 'Detaylı cevabınızı yazın...'}
                className="bg-background/50 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[140px] resize-none"
              />
            )}

            {question.type === 'number' && (
              <Input
                type="number"
                value={(value as string) || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                placeholder={question.placeholder || 'Sayı girin...'}
                className="bg-background/50 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-12 max-w-[200px]"
              />
            )}

            {question.type === 'discord_id' && (
              <Input
                value={(value as string) || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                placeholder={question.placeholder || 'Örn: 123456789012345678'}
                className="bg-background/50 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-12 max-w-[320px] font-mono"
              />
            )}

            {question.type === 'radio' && question.options && (
              <RadioGroup
                value={(value as string) || ''}
                onValueChange={(val) => updateField(question.id, val)}
                className="space-y-2"
              >
                {question.options.map((option, optionIndex) => (
                  <motion.div
                    key={optionIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 + optionIndex * 0.03 }}
                    className={`
                      flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer
                      ${value === option 
                        ? 'bg-primary/10 border-primary/40' 
                        : 'bg-background/30 border-border/30 hover:border-primary/30 hover:bg-primary/5'
                      }
                    `}
                    onClick={() => updateField(question.id, option)}
                  >
                    <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                    <Label
                      htmlFor={`${question.id}-${optionIndex}`}
                      className="text-foreground cursor-pointer flex-1"
                    >
                      {option}
                    </Label>
                  </motion.div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'checkbox' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isChecked = ((value as string[]) || []).includes(option);
                  return (
                    <motion.div
                      key={optionIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 + optionIndex * 0.03 }}
                      className={`
                        flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer
                        ${isChecked 
                          ? 'bg-primary/10 border-primary/40' 
                          : 'bg-background/30 border-border/30 hover:border-primary/30 hover:bg-primary/5'
                        }
                      `}
                      onClick={() => handleCheckboxChange(question.id, option, !isChecked)}
                    >
                      <Checkbox
                        id={`${question.id}-${optionIndex}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(question.id, option, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${question.id}-${optionIndex}`}
                        className="text-foreground cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

  // Form not found
  if (!formTemplate) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl text-foreground">Form Bulunamadı</h1>
            <p className="text-muted-foreground">Bu form mevcut değil veya aktif değil.</p>
            <Link to="/basvuru" className="inline-block text-primary hover:underline">
              Başvuru merkezine dön
            </Link>
          </div>
        </div>
        <Footer />
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

  // Password protection screen
  if (formTemplate.settings?.isPasswordProtected && !isCodeVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-[0]" />

        <Header />

        <main className="flex-1 pt-32 pb-24 relative z-10 flex items-center justify-center">
          <div className="container mx-auto px-4 md:px-6 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-8 shadow-xl"
            >
              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center"
                >
                  <Lock className="w-10 h-10 text-primary" />
                </motion.div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display text-foreground mb-2">
                  Şifreli Form
                </h1>
                <p className="text-muted-foreground text-sm">
                  Bu forma erişmek için erişim kodu gereklidir
                </p>
                <p className="text-primary font-medium mt-2">{formTemplate.title}</p>
              </div>

              {/* Code Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-code" className="text-foreground">
                    Erişim Kodu
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="access-code"
                      type="text"
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        setCodeError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCodeSubmit();
                      }}
                      placeholder="Erişim kodunuzu girin"
                      className={`bg-background/50 border-border/40 pl-10 h-12 ${
                        codeError ? 'border-destructive' : ''
                      }`}
                    />
                  </div>
                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {codeError}
                    </motion.p>
                  )}
                </div>

                <Button
                  onClick={handleCodeSubmit}
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                  disabled={!accessCode.trim()}
                >
                  Doğrula
                </Button>
              </div>

              {/* Back Link */}
              <div className="text-center mt-6">
                <Link
                  to="/basvuru"
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Başvuru merkezine dön
                </Link>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[150px] pointer-events-none z-[0]" />
      
      <Header />

      <main className="flex-1 pt-28 pb-24 relative z-10">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10"
          >
            {/* Back Button */}
            <Link
              to="/basvuru"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Başvuru Merkezi</span>
            </Link>

            {/* Cover Image */}
            {formTemplate.cover_image_url && (
              <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-8 border border-border/30">
                <img 
                  src={formTemplate.cover_image_url} 
                  alt={formTemplate.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-4xl font-display text-foreground tracking-tight"
                  >
                    {formTemplate.title}
                  </motion.h1>
                  {formTemplate.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-muted-foreground mt-3 text-lg leading-relaxed"
                    >
                      {formTemplate.description}
                    </motion.p>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Form Tamamlanma Durumu</span>
                  <span className={`text-sm font-medium ${progress === 100 ? 'text-primary' : 'text-foreground'}`}>
                    {progress}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formTemplate.questions.length} soru · {formTemplate.questions.filter(q => q.required).length} zorunlu
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Questions */}
          <div className="space-y-6 mb-10">
            {formTemplate.questions.map((question, index) => 
              renderQuestion(question, index)
            )}
          </div>

          {/* Submit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + formTemplate.questions.length * 0.05 }}
            className="sticky bottom-6 z-20"
          >
            <div className="bg-card/80 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  {!isFormValid() ? (
                    <p className="text-muted-foreground text-sm">
                      Lütfen tüm zorunlu alanları doldurun
                    </p>
                  ) : (
                    <p className="text-primary text-sm font-medium">
                      Form gönderilmeye hazır
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full sm:w-auto min-w-[200px] h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Başvuruyu Gönder
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BasvuruForm;