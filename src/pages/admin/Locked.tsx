import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { toast } from 'sonner';

const Locked: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { verify2FA, admin2FASettings, isLoading } = useAdminSession();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || '/admin';

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Lütfen 6 haneli kodu girin');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verify2FA(code);

    if (result.success) {
      toast.success('Giriş başarılı');
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Doğrulama başarısız');
      setCode('');
      
      // If blocked, redirect to home after a delay
      if (result.error?.includes('bloklandı')) {
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    }

    setIsVerifying(false);
  };

  const handleCodeComplete = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      // Auto-verify when code is complete
      setTimeout(() => {
        const submitBtn = document.getElementById('verify-btn');
        submitBtn?.click();
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If blocked, show blocked message
  if (admin2FASettings?.is_blocked) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center max-w-md px-4"
        >
          <AlertTriangle className="w-20 h-20 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Hesap Bloklandı</h1>
          <p className="text-muted-foreground">
            Çok fazla başarısız giriş denemesi nedeniyle hesabınız bloklanmıştır. 
            Lütfen yönetici ile iletişime geçin.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-1">Oturum Zaman Aşımı</h1>
            <p className="text-sm text-muted-foreground">
              Devam etmek için kimliğinizi doğrulayın
            </p>
          </div>

          {/* User Avatar */}
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <p className="text-sm text-muted-foreground">
            {user?.user_metadata?.name || user?.email || 'Admin'}
          </p>

          {/* OTP Input */}
          <div className="flex flex-col items-center gap-4 w-full">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeComplete}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {error}
              </motion.p>
            )}

            {/* Failed Attempts Warning */}
            {admin2FASettings && admin2FASettings.failed_attempts > 0 && admin2FASettings.failed_attempts < 5 && (
              <p className="text-xs text-amber-500">
                {5 - admin2FASettings.failed_attempts} deneme hakkınız kaldı
              </p>
            )}
          </div>

          {/* Verify Button */}
          <Button
            id="verify-btn"
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              'Doğrula'
            )}
          </Button>

          {/* Back to Home */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Locked;
