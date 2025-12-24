import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableQuestionCard } from './SortableQuestionCard';
import { AddQuestionDialog } from './AddQuestionDialog';
import type { FormQuestion, QuestionType } from '@/types/formBuilder';

interface FormBuilderQuestionsProps {
  questions: FormQuestion[];
  setQuestions: (questions: FormQuestion[]) => void;
}

export const FormBuilderQuestions = ({
  questions,
  setQuestions,
}: FormBuilderQuestionsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      setQuestions(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: FormQuestion = {
      id: crypto.randomUUID(),
      type,
      label: '',
      placeholder: '',
      required: false,
      options: type === 'radio' || type === 'checkbox' ? ['Seçenek 1'] : undefined,
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
    setIsAddDialogOpen(false);
  };

  const handleUpdateQuestion = (updatedQuestion: FormQuestion) => {
    setQuestions(
      questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
    }
  };

  const handleDuplicateQuestion = (question: FormQuestion) => {
    const duplicated: FormQuestion = {
      ...question,
      id: crypto.randomUUID(),
      label: `${question.label} (Kopya)`,
    };
    const index = questions.findIndex((q) => q.id === question.id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Form Soruları</CardTitle>
          <CardDescription>
            Soruları sürükleyerek sırasını değiştirebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-4">Henüz soru eklenmemiş</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                İlk Soruyu Ekle
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      isEditing={editingQuestion?.id === question.id}
                      onEdit={() => setEditingQuestion(question)}
                      onUpdate={handleUpdateQuestion}
                      onDelete={() => handleDeleteQuestion(question.id)}
                      onDuplicate={() => handleDuplicateQuestion(question)}
                      onStopEditing={() => setEditingQuestion(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {questions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full gap-2 border-dashed"
            >
              <Plus className="w-4 h-4" />
              Soru Ekle
            </Button>
          )}
        </CardContent>
      </Card>

      <AddQuestionDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddQuestion}
      />
    </div>
  );
};
