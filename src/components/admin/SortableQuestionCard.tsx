import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Type,
  AlignLeft,
  Hash,
  CircleDot,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { FormQuestion, QuestionType } from '@/types/formBuilder';

interface SortableQuestionCardProps {
  question: FormQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (question: FormQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStopEditing: () => void;
}

const questionTypeInfo: Record<QuestionType, { label: string; icon: React.ElementType }> = {
  short_text: { label: 'Kısa Metin', icon: Type },
  paragraph: { label: 'Paragraf', icon: AlignLeft },
  number: { label: 'Sayısal Değer', icon: Hash },
  radio: { label: 'Tekli Seçim', icon: CircleDot },
  checkbox: { label: 'Çoklu Seçim', icon: CheckSquare },
  discord_id: { label: 'Discord ID', icon: MessageSquare },
};

export const SortableQuestionCard = ({
  question,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  onStopEditing,
}: SortableQuestionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo = questionTypeInfo[question.type];
  const TypeIcon = typeInfo.icon;

  const handleAddOption = () => {
    if (!question.options) return;
    onUpdate({
      ...question,
      options: [...question.options, `Seçenek ${question.options.length + 1}`],
    });
  };

  const handleUpdateOption = (optionIndex: number, value: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate({ ...question, options: newOptions });
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (!question.options || question.options.length <= 1) return;
    onUpdate({
      ...question,
      options: question.options.filter((_, i) => i !== optionIndex),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border border-border rounded-lg transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isEditing ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <Badge variant="secondary" className="gap-1">
          <TypeIcon className="w-3 h-3" />
          {typeInfo.label}
        </Badge>

        <span className="text-sm text-muted-foreground">#{index + 1}</span>

        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium truncate">
            {question.label || 'Başlıksız Soru'}
          </p>
        </div>

        {question.required && (
          <Badge variant="destructive" className="text-xs">
            Zorunlu
          </Badge>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            className="h-8 w-8"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isEditing ? onStopEditing : onEdit}
            className="h-8 w-8"
          >
            {isEditing ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div className="p-4 space-y-4">
          {/* Question Label */}
          <div className="space-y-2">
            <Label className="text-foreground">Soru Başlığı</Label>
            <Input
              value={question.label}
              onChange={(e) => onUpdate({ ...question, label: e.target.value })}
              placeholder="Sorunuzu yazın..."
              className="bg-card border-border"
            />
          </div>

          {/* Placeholder */}
          {(question.type === 'short_text' ||
            question.type === 'paragraph' ||
            question.type === 'number' ||
            question.type === 'discord_id') && (
            <div className="space-y-2">
              <Label className="text-foreground">Yer Tutucu (Placeholder)</Label>
              <Input
                value={question.placeholder || ''}
                onChange={(e) =>
                  onUpdate({ ...question, placeholder: e.target.value })
                }
                placeholder="Örn: Cevabınızı buraya yazın..."
                className="bg-card border-border"
              />
            </div>
          )}

          {/* Options for Radio/Checkbox */}
          {(question.type === 'radio' || question.type === 'checkbox') && (
            <div className="space-y-2">
              <Label className="text-foreground">Seçenekler</Label>
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) =>
                        handleUpdateOption(optionIndex, e.target.value)
                      }
                      placeholder={`Seçenek ${optionIndex + 1}`}
                      className="bg-card border-border"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(optionIndex)}
                      disabled={question.options?.length === 1}
                      className="h-10 w-10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                Seçenek Ekle
              </Button>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
            <div className="space-y-0.5">
              <Label className="text-foreground">Zorunlu Alan</Label>
              <p className="text-xs text-muted-foreground">
                Bu alanın doldurulması zorunlu olsun
              </p>
            </div>
            <Switch
              checked={question.required}
              onCheckedChange={(checked) =>
                onUpdate({ ...question, required: checked })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
