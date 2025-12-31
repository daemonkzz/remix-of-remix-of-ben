import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Scroll } from "lucide-react";

interface RolePasiSidebarNavProps {
  expandedCategories: string[];
  expandedSubCategories: string[];
  activeRule: string | null;
  onToggleCategory: (id: string) => void;
  onToggleSubCategory: (id: string) => void;
  onScrollToRule: (id: string) => void;
  searchQuery?: string;
}

// Static Rol Pası sub-categories
const ROL_PASI_SUBCATS = [
  { id: "4.1", title: "Tema Rolleri", rules: ["4.1.1", "4.1.2", "4.1.3"] },
  { id: "4.2", title: "Özel Roller", rules: ["4.2.1", "4.2.2", "4.2.3"] },
  { id: "4.3", title: "Başvuru Süreci", rules: ["4.3.1", "4.3.2", "4.3.3"] },
];

const ROL_PASI_RULES = [
  { id: "4.1.1", title: "Rol Sorumluluğu" },
  { id: "4.1.2", title: "Hikaye Tutarlılığı" },
  { id: "4.1.3", title: "Rol Pası Şablonu" },
  { id: "4.2.1", title: "Liderlik Rolleri" },
  { id: "4.2.2", title: "Hikaye Karakterleri" },
  { id: "4.2.3", title: "Mentor ve Eğitici Roller" },
  { id: "4.3.1", title: "Başvuru Koşulları" },
  { id: "4.3.2", title: "Değerlendirme Kriterleri" },
  { id: "4.3.3", title: "Onay ve Red" },
];

export const RolePasiSidebarNav: React.FC<RolePasiSidebarNavProps> = ({
  expandedCategories,
  expandedSubCategories,
  activeRule,
  onToggleCategory,
  onToggleSubCategory,
  onScrollToRule,
  searchQuery,
}) => {
  // Filter rules based on search query
  const filteredRules = useMemo(() => {
    if (!searchQuery?.trim()) return ROL_PASI_RULES;
    const query = searchQuery.toLowerCase();
    return ROL_PASI_RULES.filter((rule) => rule.title.toLowerCase().includes(query));
  }, [searchQuery]);

  // Get rules for a subcategory
  const getRulesForSubCat = (subCatId: string) => {
    return filteredRules.filter((rule) => rule.id.startsWith(subCatId));
  };

  const isExpanded = expandedCategories.includes("4");

  // Check if there are any matching rules
  if (searchQuery && filteredRules.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Main Category */}
      <motion.button
        onClick={() => onToggleCategory("4")}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
          isExpanded
            ? "bg-violet-500/15 text-violet-400"
            : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-violet-400/60 font-mono text-xs w-4">4.</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Scroll className="w-4 h-4 flex-shrink-0 text-violet-400/70" />
        <span className="truncate">Rol Pası Kuralları</span>
      </motion.button>

      {/* Sub Categories */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-1 border-l border-violet-500/20 pl-2">
              {ROL_PASI_SUBCATS.map((subCat) => {
                const subCatRules = getRulesForSubCat(subCat.id);
                if (searchQuery && subCatRules.length === 0) return null;

                const isSubExpanded = expandedSubCategories.includes(subCat.id);

                return (
                  <div key={subCat.id}>
                    <motion.button
                      onClick={() => onToggleSubCategory(subCat.id)}
                      className={`w-full text-left px-2 py-2 rounded-md transition-all duration-300 text-xs flex items-center gap-1.5 ${
                        isSubExpanded
                          ? "bg-violet-500/10 text-violet-400"
                          : "text-foreground/60 hover:text-foreground hover:bg-secondary/40"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-violet-400/50 font-mono text-[10px] w-6">
                        {subCat.id}
                      </span>
                      {isSubExpanded ? (
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{subCat.title}</span>
                    </motion.button>

                    {/* Rules in Sidebar */}
                    <AnimatePresence>
                      {isSubExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-violet-500/10 pl-2">
                            {subCatRules.map((rule) => (
                              <motion.button
                                key={rule.id}
                                onClick={() => onScrollToRule(rule.id)}
                                className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-all duration-200 flex items-start gap-1.5 ${
                                  activeRule === rule.id
                                    ? "bg-violet-500/20 text-violet-400"
                                    : "text-foreground/50 hover:text-foreground/80 hover:bg-secondary/30"
                                }`}
                                whileHover={{ x: 2 }}
                              >
                                <span className="text-violet-400/40 font-mono flex-shrink-0">
                                  {rule.id}
                                </span>
                                <span className="truncate flex-1">{rule.title}</span>
                              </motion.button>
                            ))}
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

export default RolePasiSidebarNav;
