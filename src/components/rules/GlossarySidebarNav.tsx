import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  is_critical: boolean;
  order_index: number;
}

interface GlossarySidebarNavProps {
  expandedCategories: string[];
  expandedSubCategories: string[];
  activeRule: string | null;
  onToggleCategory: (id: string) => void;
  onToggleSubCategory: (id: string) => void;
  onScrollToRule: (id: string) => void;
  searchQuery?: string;
}

// Category mapping for glossary
const GLOSSARY_CATEGORIES = [
  { id: 'rol_disi', title: 'Rol Dışı İhlaller', subCatId: '3.1' },
  { id: 'saldiri', title: 'Saldırı ve Çatışma', subCatId: '3.2' },
  { id: 'acik', title: 'Oyun Açığı ve İstismar', subCatId: '3.3' },
  { id: 'karakter', title: 'Karakter ve Oynanış', subCatId: '3.4' },
  { id: 'iletisim', title: 'İletişim ve Karma', subCatId: '3.5' },
  { id: 'genel', title: 'Genel', subCatId: '3.6' },
];

export const GlossarySidebarNav: React.FC<GlossarySidebarNavProps> = ({
  expandedCategories,
  expandedSubCategories,
  activeRule,
  onToggleCategory,
  onToggleSubCategory,
  onScrollToRule,
  searchQuery,
}) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    const fetchTerms = async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, term, category, is_critical, order_index')
        .order('order_index', { ascending: true });

      if (!error && data) {
        setTerms(data as GlossaryTerm[]);
      }
    };

    fetchTerms();
  }, []);

  // Filter terms based on search query
  const filteredTerms = useMemo(() => {
    if (!searchQuery?.trim()) return terms;
    const query = searchQuery.toLowerCase();
    return terms.filter((term) => term.term.toLowerCase().includes(query));
  }, [terms, searchQuery]);

  // Group terms by category
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach((term) => {
      if (!groups[term.category]) {
        groups[term.category] = [];
      }
      groups[term.category].push(term);
    });
    return groups;
  }, [filteredTerms]);

  // Generate term IDs (3.X.Y format)
  const getTermId = (categoryId: string, index: number) => {
    const cat = GLOSSARY_CATEGORIES.find(c => c.id === categoryId);
    return `${cat?.subCatId || '3.0'}.${index + 1}`;
  };

  const isGlossaryExpanded = expandedCategories.includes("3");

  // Check if there are any matching terms
  const hasMatchingTerms = Object.keys(groupedTerms).some(
    (catId) => groupedTerms[catId]?.length > 0
  );

  if (searchQuery && !hasMatchingTerms) {
    return null;
  }

  return (
    <div>
      {/* Main Category */}
      <motion.button
        onClick={() => onToggleCategory("3")}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
          isGlossaryExpanded
            ? "bg-primary/15 text-primary"
            : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-primary/60 font-mono text-xs w-4">3.</span>
        {isGlossaryExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <BookOpen className="w-4 h-4 flex-shrink-0 text-primary/70" />
        <span className="truncate">Terimler Sözlüğü</span>
      </motion.button>

      {/* Sub Categories */}
      <AnimatePresence>
        {isGlossaryExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-1 border-l border-border/20 pl-2">
              {GLOSSARY_CATEGORIES.map((category) => {
                const categoryTerms = groupedTerms[category.id] || [];
                if (searchQuery && categoryTerms.length === 0) return null;

                const isSubExpanded = expandedSubCategories.includes(category.subCatId);

                return (
                  <div key={category.id}>
                    <motion.button
                      onClick={() => onToggleSubCategory(category.subCatId)}
                      className={`w-full text-left px-2 py-2 rounded-md transition-all duration-300 text-xs flex items-center gap-1.5 ${
                        isSubExpanded
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/60 hover:text-foreground hover:bg-secondary/40"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-primary/50 font-mono text-[10px] w-6">
                        {category.subCatId}
                      </span>
                      {isSubExpanded ? (
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{category.title}</span>
                    </motion.button>

                    {/* Terms in Sidebar */}
                    <AnimatePresence>
                      {isSubExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/10 pl-2">
                            {categoryTerms.map((term, index) => {
                              const termId = getTermId(category.id, index);
                              return (
                                <motion.button
                                  key={term.id}
                                  onClick={() => onScrollToRule(termId)}
                                  className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-all duration-200 flex items-start gap-1.5 ${
                                    activeRule === termId
                                      ? "bg-primary/20 text-primary"
                                      : "text-foreground/50 hover:text-foreground/80 hover:bg-secondary/30"
                                  }`}
                                  whileHover={{ x: 2 }}
                                >
                                  <span className="text-primary/40 font-mono flex-shrink-0">
                                    {termId}
                                  </span>
                                  <span className="truncate flex-1">{term.term}</span>
                                  {term.is_critical && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0 mt-1" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlossarySidebarNav;
