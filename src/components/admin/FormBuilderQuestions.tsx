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
import type { FormQuestion, QuestionType, FormPage } from '@/types/formBuilder';

interface FormBuilderQuestionsProps {
  questions: FormQuestion[];
  setQuestions: (questions: FormQuestion[]) => void;
  pages: FormPage[];
}

export const FormBuilderQuestions = ({
  questions,
  setQuestions,
  pages,
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
      pageId: pages.length > 0 ? pages[0].id : undefined,
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

  // Group questions by page
  const getQuestionsByPage = () => {
    if (pages.length === 0) {
      return [{ page: null, questions }];
    }

    const grouped: { page: FormPage | null; questions: FormQuestion[] }[] = [];
    
    // Add questions for each page
    pages.forEach((page) => {
      grouped.push({
        page,
        questions: questions.filter((q) => q.pageId === page.id),
      });
    });

    // Add unassigned questions
    const unassigned = questions.filter(
      (q) => !q.pageId || !pages.find((p) => p.id === q.pageId)
    );
    if (unassigned.length > 0) {
      grouped.push({ page: null, questions: unassigned });
    }

    return grouped;
  };

  const groupedQuestions = getQuestionsByPage();

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Form Soruları</CardTitle>
          <CardDescription>
            Soruları sürükleyerek sırasını değiştirebilirsiniz
            {pages.length > 0 && ' • Her soruyu bir sayfaya atayabilirsiniz'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                {groupedQuestions.map(({ page, questions: pageQuestions }, groupIndex) => (
                  <div key={page?.id || 'unassigned'} className="space-y-3">
                    {pages.length > 0 && (
                      <div className="flex items-center gap-2 pt-4 first:pt-0">
                        <span className="text-sm font-medium text-primary">
                          {page ? page.title : 'Atanmamış Sorular'}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                    )}
                    {pageQuestions.map((question, index) => (
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
                        pages={pages}
                      />
                    ))}
                  </div>
                ))}
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
