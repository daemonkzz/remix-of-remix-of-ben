import { useEffect, useCallback, useContext, useState } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface NavigationGuardProps {
  /** Whether to block navigation */
  when: boolean;
  /** Custom message to show */
  message?: string;
}

export const NavigationGuard = ({
  when,
  message = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?',
}: NavigationGuardProps) => {
  const { navigator } = useContext(NavigationContext);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Block navigation using navigator.block (works with BrowserRouter)
  useEffect(() => {
    if (!when) return;

    // @ts-expect-error - block exists on navigator but not in types
    const unblock = navigator.block?.((tx: { retry: () => void }) => {
      setShowDialog(true);
      setPendingNavigation(() => () => {
        unblock?.();
        tx.retry();
      });
    });

    return () => {
      unblock?.();
    };
  }, [when, navigator]);

  // Handle browser beforeunload
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when, message]);

  const handleStay = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const handleLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
    setPendingNavigation(null);
  }, [pendingNavigation]);

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Kaydedilmemiş Değişiklikler
          </AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleStay}>
            Sayfada Kal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Kaydetmeden Çık
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
