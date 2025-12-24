import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Type,
  AlignLeft,
  Hash,
  CircleDot,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';
import type { QuestionType } from '@/types/formBuilder';

interface AddQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: QuestionType) => void;
}

const questionTypes: {
  type: QuestionType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: 'short_text',
    label: 'Kısa Metin',
    description: 'Tek satırlık metin girişi',
    icon: Type,
  },
  {
    type: 'paragraph',
    label: 'Paragraf',
    description: 'Çok satırlı metin girişi',
    icon: AlignLeft,
  },
  {
    type: 'number',
    label: 'Sayısal Değer',
    description: 'Sadece sayı girişi',
    icon: Hash,
  },
  {
    type: 'radio',
    label: 'Tekli Seçim',
    description: 'Bir seçenek seçilebilir',
    icon: CircleDot,
  },
  {
    type: 'checkbox',
    label: 'Çoklu Seçim',
    description: 'Birden fazla seçenek seçilebilir',
    icon: CheckSquare,
  },
  {
    type: 'discord_id',
    label: 'Discord ID',
    description: 'Discord kullanıcı ID doğrulaması',
    icon: MessageSquare,
  },
];

export const AddQuestionDialog = ({
  open,
  onClose,
  onAdd,
}: AddQuestionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Soru Tipi Seçin</DialogTitle>
          <DialogDescription>
            Eklemek istediğiniz soru tipini seçin
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {questionTypes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => onAdd(item.type)}
                className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/50 transition-all text-left"
              >
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
