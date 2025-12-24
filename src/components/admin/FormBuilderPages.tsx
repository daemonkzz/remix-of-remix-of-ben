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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2, Edit2, Check, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormPage, FormQuestion } from '@/types/formBuilder';

interface FormBuilderPagesProps {
  pages: FormPage[];
  setPages: (pages: FormPage[]) => void;
  questions: FormQuestion[];
  setQuestions: (questions: FormQuestion[]) => void;
}

interface SortablePageCardProps {
  page: FormPage;
  index: number;
  questions: FormQuestion[];
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const SortablePageCard = ({ page, index, questions, onEdit, onDelete }: SortablePageCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pageQuestions = questions.filter(q => q.pageId === page.id);

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(page.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(page.title);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border border-border/50 rounded-lg bg-card/50 transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <Badge variant="outline" className="shrink-0">
          Sayfa {index + 1}
        </Badge>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8 bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
              <Check className="w-4 h-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 font-medium text-foreground">{page.title}</span>
            <span className="text-xs text-muted-foreground">
              {pageQuestions.length} soru
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(page.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const FormBuilderPages = ({
  pages,
  setPages,
  questions,
  setQuestions,
}: FormBuilderPagesProps) => {
  const [newPageTitle, setNewPageTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      setPages(arrayMove(pages, oldIndex, newIndex));
    }
  };

  const handleAddPage = () => {
    const title = newPageTitle.trim() || `Sayfa ${pages.length + 1}`;
    const newPage: FormPage = {
      id: crypto.randomUUID(),
      title,
      questionIds: [],
    };
    setPages([...pages, newPage]);
    setNewPageTitle('');
  };

  const handleEditPage = (id: string, title: string) => {
    setPages(pages.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  const handleDeletePage = (id: string) => {
    // Remove page and unassign questions from this page
    setPages(pages.filter((p) => p.id !== id));
    setQuestions(
      questions.map((q) => (q.pageId === id ? { ...q, pageId: undefined } : q))
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle className="text-foreground">Form Sayfaları</CardTitle>
        </div>
        <CardDescription>
          Formunuzu birden fazla sayfaya bölebilirsiniz. Her soru bir sayfaya atanabilir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-2">Henüz sayfa eklenmemiş</p>
            <p className="text-xs text-muted-foreground mb-4">
              Sayfa eklemezseniz tüm sorular tek sayfada gösterilir
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {pages.map((page, index) => (
                  <SortablePageCard
                    key={page.id}
                    page={page}
                    index={index}
                    questions={questions}
                    onEdit={handleEditPage}
                    onDelete={handleDeletePage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex gap-2 pt-2">
          <Input
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            placeholder="Yeni sayfa başlığı (opsiyonel)"
            className="bg-background border-border"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPage();
            }}
          />
          <Button onClick={handleAddPage} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Sayfa Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
