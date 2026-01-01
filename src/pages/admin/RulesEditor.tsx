import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  BookOpen,
  FolderOpen,
  Eye,
  Download,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RuleEditorCard, RuleFormatGuide } from '@/components/admin/rules';
import { RuleContentRenderer } from '@/components/rules/RuleContentRenderer';
import { NavigationGuard } from '@/components/admin/NavigationGuard';

import { UnsavedIndicator } from '@/components/admin/UnsavedIndicator';
import type { MainCategory, SubCategory, Rule } from '@/types/rules';
import { kazeRulesData } from '@/data/rulesData';
import { useDiscordNotification } from '@/hooks/useDiscordNotification';

// Default rules data to import
const defaultRulesData: MainCategory[] = kazeRulesData;

const DRAFT_KEY = 'ruleseditor_draft';

const RulesEditorContent = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const { sendRulesNotification, isSending: isDiscordSending } = useDiscordNotification();
  
  const [rulesId, setRulesId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<MainCategory[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Draft state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadRef = useRef(false);
  const lastSavedDataRef = useRef<string>('');
  
  // UI State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ type: 'category' | 'subcategory' | 'rule'; id: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'subcategory' | 'rule'; id: string; parentId?: string; subParentId?: string } | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);

  // Preview state
  const [previewExpandedCats, setPreviewExpandedCats] = useState<string[]>([]);
  const [previewExpandedSubs, setPreviewExpandedSubs] = useState<string[]>([]);

  // Auto-load draft on mount and load rules
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft) as MainCategory[];
        setCategories(parsedData);
        setHasUnsavedChanges(true);
        lastSavedDataRef.current = savedDraft;
        toast.info('Kaldığınız yerden devam ediyorsunuz', { duration: 2000 });
        // Load original from DB for comparison
        loadRules(true);
        return;
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    // No draft, load normally
    loadRules();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!initialLoadRef.current) return;
    
    const currentDataStr = JSON.stringify(categories);
    const originalDataStr = JSON.stringify(originalCategories);
    
    if (currentDataStr !== originalDataStr && currentDataStr !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
      
      const timeoutId = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, currentDataStr);
        lastSavedDataRef.current = currentDataStr;
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else if (currentDataStr === originalDataStr) {
      setHasUnsavedChanges(false);
    }
  }, [categories, originalCategories]);

  // Browser/tab close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleSaveRequest = () => {
      if (!isSaving) {
        handleSave();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRequest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, categories, rulesId, user?.id]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    lastSavedDataRef.current = '';
  }, []);

  const loadRules = async (skipDraftPrompt = false) => {
    if (!skipDraftPrompt) {
      setIsLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading rules:', error);
        toast.error('Kurallar yüklenirken hata oluştu');
        return;
      }

      if (data) {
        setRulesId(data.id);
        const loadedCategories = (data.data as MainCategory[]) || [];
        if (!skipDraftPrompt) {
          setCategories(loadedCategories);
        }
        setOriginalCategories(JSON.parse(JSON.stringify(loadedCategories)));
        setLastUpdated(data.updated_at);
        initialLoadRef.current = true;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Kurallar yüklenirken hata oluştu');
    } finally {
      if (!skipDraftPrompt) {
        setIsLoading(false);
      }
    }
  };

  const handleSave = useCallback(async () => {
    if (!rulesId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rules')
        .update({
          data: categories,
          updated_by: user?.id,
        })
        .eq('id', rulesId);

      if (error) {
        console.error('Save error:', error);
        toast.error('Kurallar kaydedilirken hata oluştu');
        return;
      }

      toast.success('Kurallar başarıyla kaydedildi');
      setLastUpdated(new Date().toISOString());
      setOriginalCategories(JSON.parse(JSON.stringify(categories)));
      setHasUnsavedChanges(false);
      clearDraft();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kurallar kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [categories, rulesId, user?.id, clearDraft]);

  // Find updated rules by comparing with original categories
  const updatedRules = useMemo(() => {
    const updated: Array<{ id: string; title: string; categoryTitle: string }> = [];
    
    categories.forEach(category => {
      const originalCategory = originalCategories.find(c => c.id === category.id);
      
      category.subCategories.forEach(subCategory => {
        const originalSubCategory = originalCategory?.subCategories.find(s => s.id === subCategory.id);
        
        subCategory.rules.forEach(rule => {
          const originalRule = originalSubCategory?.rules.find(r => r.id === rule.id);
          
          if (!originalRule || 
              originalRule.title !== rule.title || 
              originalRule.description !== rule.description) {
            updated.push({
              id: rule.id,
              title: rule.title,
              categoryTitle: `${category.title} > ${subCategory.title}`,
            });
          }
        });
      });
    });
    
    return updated;
  }, [categories, originalCategories]);

  const handleSendToDiscord = async () => {
    if (updatedRules.length === 0) {
      toast.error('Değişen kural bulunamadı. Önce değişiklik yapın ve kaydedin.');
      return;
    }
    await sendRulesNotification(updatedRules);
  };

  const handleImportDefaults = () => {
    setCategories(defaultRulesData);
    setOriginalCategories(JSON.parse(JSON.stringify(defaultRulesData)));
    setImportConfirm(false);
    toast.success('Varsayılan kurallar içe aktarıldı. Kaydetmeyi unutmayın!');
  };

  // Category operations
  const addCategory = () => {
    const newId = String(categories.length + 1);
    const newCategory: MainCategory = {
      id: newId,
      title: 'Yeni Kategori',
      subCategories: [],
    };
    setCategories([...categories, newCategory]);
    setExpandedCategories(new Set([...expandedCategories, newId]));
    setEditingItem({ type: 'category', id: newId });
  };

  const updateCategory = (id: string, updates: Partial<MainCategory>) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
    setDeleteConfirm(null);
  };

  // SubCategory operations
  const addSubCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newId = `${categoryId}.${category.subCategories.length + 1}`;
    const newSubCategory: SubCategory = {
      id: newId,
      title: 'Yeni Alt Kategori',
      description: 'Bu bölümdeki kurallar aşağıda listelenmiştir.',
      rules: [],
    };

    updateCategory(categoryId, {
      subCategories: [...category.subCategories, newSubCategory],
    });
    setExpandedSubCategories(new Set([...expandedSubCategories, newId]));
    setEditingItem({ type: 'subcategory', id: newId });
  };

  const updateSubCategory = (categoryId: string, subCategoryId: string, updates: Partial<SubCategory>) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      subCategories: category.subCategories.map(sub =>
        sub.id === subCategoryId ? { ...sub, ...updates } : sub
      ),
    });
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      subCategories: category.subCategories.filter(sub => sub.id !== subCategoryId),
    });
    setDeleteConfirm(null);
  };

  // Rule operations
  const addRule = (categoryId: string, subCategoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const subCategory = category.subCategories.find(s => s.id === subCategoryId);
    if (!subCategory) return;

    const newId = `${subCategoryId}.${subCategory.rules.length + 1}`;
    const newRule: Rule = {
      id: newId,
      title: 'Yeni Kural',
      description: 'Kural açıklaması...',
      lastUpdate: '',
    };

    updateSubCategory(categoryId, subCategoryId, {
      rules: [...subCategory.rules, newRule],
    });
    setEditingItem({ type: 'rule', id: newId });
  };

  const updateRule = (categoryId: string, subCategoryId: string, ruleId: string, updates: Partial<Rule>) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const subCategory = category.subCategories.find(s => s.id === subCategoryId);
    if (!subCategory) return;

    const updatesWithDate = {
      ...updates,
      lastUpdate: new Date().toISOString(),
    };

    updateSubCategory(categoryId, subCategoryId, {
      rules: subCategory.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updatesWithDate } : rule
      ),
    });
  };

  const deleteRule = (categoryId: string, subCategoryId: string, ruleId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const subCategory = category.subCategories.find(s => s.id === subCategoryId);
    if (!subCategory) return;

    updateSubCategory(categoryId, subCategoryId, {
      rules: subCategory.rules.filter(rule => rule.id !== ruleId),
    });
    setDeleteConfirm(null);
  };

  // Toggle functions
  const toggleCategory = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedCategories(newSet);
  };

  const toggleSubCategory = (id: string) => {
    const newSet = new Set(expandedSubCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubCategories(newSet);
  };

  // Preview toggles
  const togglePreviewCat = (id: string) => {
    setPreviewExpandedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const togglePreviewSub = (id: string) => {
    setPreviewExpandedSubs(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Count stats
  const totalCategories = categories.length;
  const totalSubCategories = categories.reduce((acc, cat) => acc + cat.subCategories.length, 0);
  const totalRules = categories.reduce((acc, cat) => 
    acc + cat.subCategories.reduce((subAcc, sub) => subAcc + sub.rules.length, 0), 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Navigation Guard */}
      <NavigationGuard when={hasUnsavedChanges} />


      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">Kurallar Düzenleyici</h2>
            <UnsavedIndicator hasUnsavedChanges={hasUnsavedChanges} />
          </div>
          <p className="text-muted-foreground">
            {totalCategories} kategori, {totalSubCategories} alt kategori, {totalRules} kural
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RuleFormatGuide
            trigger={
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Format Rehberi
              </Button>
            }
          />
          <Button
            variant="outline"
            onClick={handleSendToDiscord}
            disabled={isDiscordSending || updatedRules.length === 0}
            className="gap-2 text-[#5865F2] border-[#5865F2]/30 hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
            title={updatedRules.length === 0 ? 'Değişen kural yok' : `${updatedRules.length} güncellenen kural`}
          >
            {isDiscordSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Discord'a Bildir {updatedRules.length > 0 && `(${updatedRules.length})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportConfirm(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Varsayılanları Yükle
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">
            <Pencil className="w-4 h-4 mr-2" />
            Düzenleyici
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Önizleme
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Kategori Ekle
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pr-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-border rounded-lg bg-card">
                  <Collapsible
                    open={expandedCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <FolderOpen className="w-5 h-5 text-primary" />
                        
                        {editingItem?.type === 'category' && editingItem.id === category.id ? (
                          <Input
                            value={category.title}
                            onChange={(e) => updateCategory(category.id, { title: e.target.value })}
                            onBlur={() => setEditingItem(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                            autoFocus
                            className="max-w-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-semibold text-lg flex-1">{category.title}</span>
                        )}

                        <Badge variant="secondary">
                          {category.subCategories.length} alt kategori
                        </Badge>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem({ type: 'category', id: category.id });
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ type: 'category', id: category.id });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSubCategory(category.id)}
                          className="ml-10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Alt Kategori Ekle
                        </Button>

                        {category.subCategories.map((subCategory) => (
                          <div key={subCategory.id} className="ml-10 border border-border rounded-lg bg-muted/30">
                            <Collapsible
                              open={expandedSubCategories.has(subCategory.id)}
                              onOpenChange={() => toggleSubCategory(subCategory.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  {expandedSubCategories.has(subCategory.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                  <BookOpen className="w-4 h-4 text-primary" />

                                  {editingItem?.type === 'subcategory' && editingItem.id === subCategory.id ? (
                                    <Input
                                      value={subCategory.title}
                                      onChange={(e) => updateSubCategory(category.id, subCategory.id, { title: e.target.value })}
                                      onBlur={() => setEditingItem(null)}
                                      onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                                      autoFocus
                                      className="max-w-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="font-medium flex-1">{subCategory.title}</span>
                                  )}

                                  <Badge variant="outline">
                                    {subCategory.rules.length} kural
                                  </Badge>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItem({ type: 'subcategory', id: subCategory.id });
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ type: 'subcategory', id: subCategory.id, parentId: category.id });
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="px-3 pb-3 space-y-2">
                                  <Textarea
                                    value={subCategory.description}
                                    onChange={(e) => updateSubCategory(category.id, subCategory.id, { description: e.target.value })}
                                    placeholder="Alt kategori açıklaması..."
                                    className="ml-10 text-sm"
                                    rows={2}
                                  />

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addRule(category.id, subCategory.id)}
                                    className="ml-10"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Kural Ekle
                                  </Button>

                                  {subCategory.rules.map((rule) => (
                                    <div key={rule.id} className="ml-10">
                                      <RuleEditorCard
                                        rule={rule}
                                        isEditing={editingItem?.type === 'rule' && editingItem.id === rule.id}
                                        onEdit={() => setEditingItem({ type: 'rule', id: rule.id })}
                                        onCancelEdit={() => setEditingItem(null)}
                                        onUpdate={(updates) => updateRule(category.id, subCategory.id, rule.id, updates)}
                                        onDelete={() => setDeleteConfirm({ type: 'rule', id: rule.id, parentId: category.id, subParentId: subCategory.id })}
                                        formatDate={formatDate}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Henüz kural bulunmuyor</p>
                  <Button onClick={addCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Kategoriyi Oluştur
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-foreground">Kurallar Önizleme</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Bu önizleme sitedeki görünümle birebir aynıdır. Tüm formatlar (örnek kutuları, alıntılar, notlar, kalın yazı vb.) doğru şekilde görüntülenir.
            </p>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => togglePreviewCat(category.id)}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="font-semibold text-lg">{category.id}. {category.title}</span>
                    {previewExpandedCats.includes(category.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {previewExpandedCats.includes(category.id) && (
                    <div className="p-4 space-y-3">
                      {category.subCategories.map((subCategory) => (
                        <div key={subCategory.id} className="border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => togglePreviewSub(subCategory.id)}
                            className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/30 transition-colors"
                          >
                            <span className="font-medium">{subCategory.id} {subCategory.title}</span>
                            {previewExpandedSubs.includes(subCategory.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {previewExpandedSubs.includes(subCategory.id) && (
                            <div className="p-4 space-y-4">
                              {subCategory.description && (
                                <p className="text-sm text-muted-foreground">{subCategory.description}</p>
                              )}
                              {subCategory.rules.map((rule) => (
                                <div key={rule.id} className="p-4 bg-muted/20 rounded-xl border border-border/50">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-primary">{rule.id}</span>
                                      <span className="font-semibold text-foreground">{rule.title}</span>
                                    </div>
                                    {rule.lastUpdate && (
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {formatDate(rule.lastUpdate)}
                                      </Badge>
                                    )}
                                  </div>
                                  <RuleContentRenderer content={rule.description} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'category' && 'Bu kategori ve içindeki tüm alt kategoriler ve kurallar silinecektir.'}
              {deleteConfirm?.type === 'subcategory' && 'Bu alt kategori ve içindeki tüm kurallar silinecektir.'}
              {deleteConfirm?.type === 'rule' && 'Bu kural kalıcı olarak silinecektir.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'category') {
                  deleteCategory(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'subcategory' && deleteConfirm.parentId) {
                  deleteSubCategory(deleteConfirm.parentId, deleteConfirm.id);
                } else if (deleteConfirm?.type === 'rule' && deleteConfirm.parentId && deleteConfirm.subParentId) {
                  deleteRule(deleteConfirm.parentId, deleteConfirm.subParentId, deleteConfirm.id);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importConfirm} onOpenChange={setImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Varsayılan kuralları yükle</AlertDialogTitle>
            <AlertDialogDescription>
              Mevcut kurallar silinecek ve varsayılan kurallar yüklenecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportDefaults}>
              Yükle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const RulesEditor = () => {
  return (
    <AdminLayout activeTab="kurallar">
      <RulesEditorContent />
    </AdminLayout>
  );
};

export default RulesEditor;
