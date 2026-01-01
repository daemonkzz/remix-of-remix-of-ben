import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminEditorState } from '@/contexts/AdminEditorStateContext';
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

const RulesEditorContent = () => {
  const { user } = useAuth();
  const { getRulesEditorState, setRulesEditorState, clearRulesEditorState } = useAdminEditorState();
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
  
  // UI State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ type: 'category' | 'subcategory' | 'rule'; id: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'subcategory' | 'rule'; id: string; parentId?: string; subParentId?: string } | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);

  // Preview state
  const [previewExpandedCats, setPreviewExpandedCats] = useState<string[]>([]);
  const [previewExpandedSubs, setPreviewExpandedSubs] = useState<string[]>([]);

  // Load from context or DB on mount
  useEffect(() => {
    const contextState = getRulesEditorState();
    if (contextState) {
      setCategories(contextState.categories);
      setHasUnsavedChanges(true);
      // Load original from DB for comparison
      loadRules(true);
      return;
    }
    // No context state, load normally
    loadRules();
  }, []);

  // Save to context on every change
  useEffect(() => {
    if (!initialLoadRef.current) return;
    
    const currentDataStr = JSON.stringify(categories);
    const originalDataStr = JSON.stringify(originalCategories);
    
    if (currentDataStr !== originalDataStr) {
      setHasUnsavedChanges(true);
      setRulesEditorState({ categories });
    } else {
      setHasUnsavedChanges(false);
    }
  }, [categories, originalCategories, setRulesEditorState]);

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

  const loadRules = async (skipSetCategories = false) => {
    if (!skipSetCategories) {
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
        if (!skipSetCategories) {
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
      if (!skipSetCategories) {
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
      clearRulesEditorState();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kurallar kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [categories, rulesId, user?.id, clearRulesEditorState]);

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
            Varsayılanları İçe Aktar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-sm text-muted-foreground mb-4">
          Son güncelleme: {formatDate(lastUpdated)}
        </p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="editor" className="gap-2">
            <Pencil className="w-4 h-4" />
            Düzenleyici
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Önizleme
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={addCategory} className="gap-2">
              <Plus className="w-4 h-4" />
              Kategori Ekle
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-4 pr-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-border rounded-lg bg-card overflow-hidden"
                >
                  {/* Category Header */}
                  <Collapsible
                    open={expandedCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
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
                          <span className="font-semibold text-lg">{category.title}</span>
                        )}
                        
                        <Badge variant="secondary" className="ml-auto">
                          {category.subCategories.length} alt kategori
                        </Badge>
                        
                        <div className="flex gap-1">
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
                      <div className="p-4 pt-0 space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSubCategory(category.id)}
                          className="gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          Alt Kategori Ekle
                        </Button>

                        {/* SubCategories */}
                        {category.subCategories.map((subCategory) => (
                          <div
                            key={subCategory.id}
                            className="ml-6 border border-border/50 rounded-lg bg-background"
                          >
                            <Collapsible
                              open={expandedSubCategories.has(subCategory.id)}
                              onOpenChange={() => toggleSubCategory(subCategory.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                                  {expandedSubCategories.has(subCategory.id) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  
                                  {editingItem?.type === 'subcategory' && editingItem.id === subCategory.id ? (
                                    <Input
                                      value={subCategory.title}
                                      onChange={(e) => updateSubCategory(category.id, subCategory.id, { title: e.target.value })}
                                      onBlur={() => setEditingItem(null)}
                                      onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                                      autoFocus
                                      className="max-w-xs h-8"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="font-medium">{subCategory.title}</span>
                                  )}
                                  
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    {subCategory.rules.length} kural
                                  </Badge>
                                  
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
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
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ 
                                          type: 'subcategory', 
                                          id: subCategory.id, 
                                          parentId: category.id 
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="p-3 pt-0 space-y-2">
                                  {/* SubCategory Description */}
                                  <div className="ml-6">
                                    <Textarea
                                      value={subCategory.description}
                                      onChange={(e) => updateSubCategory(category.id, subCategory.id, { description: e.target.value })}
                                      placeholder="Alt kategori açıklaması..."
                                      className="text-sm h-16 resize-none"
                                    />
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addRule(category.id, subCategory.id)}
                                    className="gap-2 ml-6"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Kural Ekle
                                  </Button>

                                  {/* Rules */}
                                  <div className="ml-6 space-y-2">
                                    {subCategory.rules.map((rule) => (
                                      <RuleEditorCard
                                        key={rule.id}
                                        rule={rule}
                                        isEditing={editingItem?.type === 'rule' && editingItem.id === rule.id}
                                        onEdit={() => setEditingItem({ type: 'rule', id: rule.id })}
                                        onSave={() => setEditingItem(null)}
                                        onUpdate={(updates) => updateRule(category.id, subCategory.id, rule.id, updates)}
                                        onDelete={() => setDeleteConfirm({
                                          type: 'rule',
                                          id: rule.id,
                                          parentId: category.id,
                                          subParentId: subCategory.id,
                                        })}
                                      />
                                    ))}
                                  </div>
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
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz kategori eklenmemiş</p>
                  <Button onClick={addCategory} className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    İlk Kategoriyi Ekle
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Önizleme</h3>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {categories.map((category) => (
                  <Collapsible
                    key={category.id}
                    open={previewExpandedCats.includes(category.id)}
                    onOpenChange={() => togglePreviewCat(category.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-3 p-4 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        {previewExpandedCats.includes(category.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <span className="font-bold text-lg">{category.title}</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-4 mt-2 space-y-3">
                        {category.subCategories.map((sub) => (
                          <Collapsible
                            key={sub.id}
                            open={previewExpandedSubs.includes(sub.id)}
                            onOpenChange={() => togglePreviewSub(sub.id)}
                          >
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                {previewExpandedSubs.includes(sub.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="font-medium">{sub.title}</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-4 mt-2 space-y-2">
                                <p className="text-sm text-muted-foreground px-3">{sub.description}</p>
                                {sub.rules.map((rule) => (
                                  <div key={rule.id} className="p-3 bg-card rounded-lg border border-border">
                                    <div className="flex items-start gap-2">
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {rule.id}
                                      </Badge>
                                      <div>
                                        <p className="font-medium">{rule.title}</p>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          <RuleContentRenderer content={rule.description} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. {deleteConfirm?.type === 'category' && 'Bu kategori ve altındaki tüm alt kategoriler ve kurallar silinecek.'}
              {deleteConfirm?.type === 'subcategory' && 'Bu alt kategori ve altındaki tüm kurallar silinecek.'}
              {deleteConfirm?.type === 'rule' && 'Bu kural silinecek.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === 'category') {
                  deleteCategory(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'subcategory' && deleteConfirm.parentId) {
                  deleteSubCategory(deleteConfirm.parentId, deleteConfirm.id);
                } else if (deleteConfirm?.type === 'rule' && deleteConfirm.parentId && deleteConfirm.subParentId) {
                  deleteRule(deleteConfirm.parentId, deleteConfirm.subParentId, deleteConfirm.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <AlertDialogTitle>Varsayılan Kuralları İçe Aktar</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem mevcut tüm kuralları varsayılan kurallarla değiştirecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportDefaults}>
              İçe Aktar
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
