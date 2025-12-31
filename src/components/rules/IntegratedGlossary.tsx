import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, BookOpen, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlossaryTermCard } from "./GlossaryTermCard";
import { cn } from "@/lib/utils";

interface GlossaryTerm {
  id: string;
  term: string;
  full_name: string | null;
  definition: string;
  category: string;
  is_critical: boolean;
  order_index: number;
}

interface IntegratedGlossaryProps {
  searchQuery: string;
  expandedSubCategories: string[];
  activeRule: string | null;
  onToggleSubCategory: (id: string) => void;
  onScrollToTerm: (termId: string) => void;
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  setActiveRule: (id: string | null) => void;
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

export const IntegratedGlossary: React.FC<IntegratedGlossaryProps> = ({
  searchQuery,
  expandedSubCategories,
  activeRule,
  onToggleSubCategory,
  sectionRefs,
  setActiveRule,
}) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data) {
        setTerms(data as GlossaryTerm[]);
      }
      setLoading(false);
    };

    fetchTerms();
  }, []);

  // Filter terms based on search query
  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    const query = searchQuery.toLowerCase();
    return terms.filter(
      (term) =>
        term.term.toLowerCase().includes(query) ||
        term.full_name?.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Check if there are any matching terms
  const hasMatchingTerms = Object.keys(groupedTerms).some(
    (catId) => groupedTerms[catId]?.length > 0
  );

  if (searchQuery && !hasMatchingTerms) {
    return null;
  }

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main Category Header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-primary font-display text-[50px] md:text-[60px] italic leading-none opacity-30">
          3
        </span>
        <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground italic tracking-wide">
          Terimler Sözlüğü
        </h3>
      </div>

      {/* Category Definition Box */}
      <div className="mb-8 p-4 md:p-5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-primary font-display text-lg italic mb-1">
              RP Terimler Sözlüğü
            </h4>
            <p className="text-foreground/60 text-sm">
              Roleplay dünyasında sıkça kullanılan terimler, kısaltmalar ve tanımları. 
              Kritik terimler <AlertTriangle className="w-3.5 h-3.5 inline text-red-400 mx-1" /> simgesiyle işaretlenmiştir.
            </p>
          </div>
        </div>
      </div>

      {/* Sub Categories */}
      <div className="space-y-10">
        {GLOSSARY_CATEGORIES.map((category) => {
          const categoryTerms = groupedTerms[category.id] || [];
          if (searchQuery && categoryTerms.length === 0) return null;

          const isExpanded = expandedSubCategories.includes(category.subCatId);

          return (
            <div key={category.id} className="ml-4 md:ml-8">
              {/* Sub Category Header */}
              <motion.button
                onClick={() => onToggleSubCategory(category.subCatId)}
                className="flex items-center gap-3 mb-3 w-full text-left group"
                whileTap={{ scale: 0.98 }}
              >
                <span className="bg-secondary/50 border border-border/30 text-foreground/70 font-mono text-sm px-3 py-1 rounded-md">
                  {category.subCatId}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-foreground/50 group-hover:text-primary transition-colors" />
                )}
                <h4 className="font-display text-xl md:text-2xl lg:text-3xl text-primary italic group-hover:text-primary/80 transition-colors">
                  3. {category.title}
                </h4>
                <span className="text-foreground/40 text-sm">
                  ({categoryTerms.length} terim)
                </span>
              </motion.button>

              {/* Terms Cards */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-2">
                      {categoryTerms.length === 0 ? (
                        <p className="text-foreground/40 text-sm py-4 px-2">
                          Bu kategoride terim bulunamadı.
                        </p>
                      ) : (
                        categoryTerms.map((term, index) => {
                          const termId = getTermId(category.id, index);
                          return (
                            <GlossaryTermCard
                              key={term.id}
                              id={termId}
                              term={term.term}
                              fullName={term.full_name}
                              definition={term.definition}
                              isCritical={term.is_critical}
                              isActive={activeRule === termId}
                              searchQuery={searchQuery}
                              onRef={(el) => {
                                sectionRefs.current[termId] = el;
                              }}
                            />
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IntegratedGlossary;
