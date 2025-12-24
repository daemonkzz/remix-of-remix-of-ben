import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FormTemplate, FormQuestion } from '@/types/formBuilder';

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formTemplate: FormTemplate;
}

const QuestionPreview = ({ question }: { question: FormQuestion }) => {
  return (
    <div className="space-y-2">
      <Label className="text-foreground">
        {question.label || 'Başlıksız Soru'}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {question.type === 'short_text' && (
        <Input
          placeholder={question.placeholder || ''}
          className="bg-background border-border"
          disabled
        />
      )}

      {question.type === 'paragraph' && (
        <Textarea
          placeholder={question.placeholder || ''}
          className="bg-background border-border resize-none"
          rows={4}
          disabled
        />
      )}

      {question.type === 'number' && (
        <Input
          type="number"
          placeholder={question.placeholder || ''}
          className="bg-background border-border max-w-[200px]"
          disabled
        />
      )}

      {question.type === 'discord_id' && (
        <Input
          placeholder={question.placeholder || 'Örn: 123456789012345678'}
          className="bg-background border-border max-w-[300px]"
          disabled
        />
      )}

      {question.type === 'radio' && (
        <RadioGroup disabled className="space-y-2">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${question.id}-${index}`} />
              <Label
                htmlFor={`${question.id}-${index}`}
                className="text-foreground cursor-pointer"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === 'checkbox' && (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox id={`${question.id}-${index}`} disabled />
              <Label
                htmlFor={`${question.id}-${index}`}
                className="text-foreground cursor-pointer"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FormPreviewModal = ({
  open,
  onClose,
  formTemplate,
}: FormPreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 bg-card border-border">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-foreground text-xl">
                Form Önizleme
              </DialogTitle>
            </DialogHeader>

            {/* Cover Image */}
            {formTemplate.coverImageUrl && (
              <div className="mb-6 -mx-6 -mt-2">
                <img
                  src={formTemplate.coverImageUrl}
                  alt="Kapak görseli"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Form Title & Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {formTemplate.title || 'Form Başlığı'}
              </h2>
              {formTemplate.description && (
                <p className="text-muted-foreground">{formTemplate.description}</p>
              )}
            </div>

            {/* Questions */}
            {formTemplate.questions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Henüz soru eklenmemiş</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formTemplate.questions.map((question) => (
                  <QuestionPreview key={question.id} question={question} />
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-border">
              <Button className="w-full" disabled>
                Başvuruyu Gönder
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Bu bir önizlemedir, form gönderilemez
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
