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
import { FileText } from 'lucide-react';

interface DraftPromptProps {
  open: boolean;
  onLoadDraft: () => void;
  onIgnoreDraft: () => void;
}

export const DraftPrompt = ({
  open,
  onLoadDraft,
  onIgnoreDraft,
}: DraftPromptProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Kaydedilmemiş Taslak Bulundu
          </AlertDialogTitle>
          <AlertDialogDescription>
            Daha önce kaydetmediğiniz değişiklikler bulundu. Taslağı yüklemek ister misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onIgnoreDraft}>
            Taslağı Sil
          </AlertDialogCancel>
          <AlertDialogAction onClick={onLoadDraft}>
            Taslağı Yükle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
