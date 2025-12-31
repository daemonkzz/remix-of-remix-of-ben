import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { MainCategory } from "@/types/rules";

// Search History Hook
export const useSearchHistory = (maxItems: number = 5) => {
  const [history, setHistory] = useState<string[]>([]);
  const STORAGE_KEY = "kaze-rules-search-history";

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== query.toLowerCase());
      const newHistory = [query, ...filtered].slice(0, maxItems);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((h) => h !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
};

// Share Rule Hook
export const useShareRule = () => {
  const navigate = useNavigate();

  const shareRule = useCallback(async (ruleId: string) => {
    const url = `${window.location.origin}/kurallar#${ruleId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Kural linki kopyalandı!", {
        description: `${ruleId} numaralı kural için link panoya kopyalandı.`,
        duration: 3000,
      });
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Kural linki kopyalandı!");
    }
  }, []);

  return { shareRule };
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = (
  rules: Array<{ id: string }>,
  scrollToRule: (id: string) => void,
  activeRule: string | null
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when not in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const currentIndex = activeRule
        ? rules.findIndex((r) => r.id === activeRule)
        : -1;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, rules.length - 1);
        if (rules[nextIndex]) {
          scrollToRule(rules[nextIndex].id);
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (rules[prevIndex]) {
          scrollToRule(rules[prevIndex].id);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rules, scrollToRule, activeRule]);
};

// URL Hash Navigation Hook
export const useRuleHashNavigation = (
  scrollToRule: (id: string) => void,
  expandCategories: (categoryIds: string[], subCategoryIds: string[]) => void,
  rulesData: MainCategory[]
) => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;

    // Wait for data to be ready
    const timer = setTimeout(() => {
      // Find the rule and expand its categories
      for (const category of rulesData) {
        for (const subCat of category.subCategories) {
          const rule = subCat.rules.find((r) => r.id === hash);
          if (rule) {
            expandCategories([category.id], [subCat.id]);
            setTimeout(() => scrollToRule(hash), 100);
            return;
          }
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location.hash, rulesData, scrollToRule, expandCategories]);
};

// Reading Progress Hook
export const useReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress = Math.min((scrollTop / documentHeight) * 100, 100);
      setProgress(progress);
    };

    window.addEventListener("scroll", calculateProgress, { passive: true });
    calculateProgress();

    return () => window.removeEventListener("scroll", calculateProgress);
  }, []);

  return progress;
};

// Critical Rules Detection
export const CRITICAL_RULES = [
  "1.1.10", // Bilmemek Mazeret Değildir
  "1.2.4", // Irkçılık, Ayrımcılık ve Nefret Söylemi
  "1.2.5", // Küfür ve Hakaret Politikası - DDK
  "1.5.6", // OOC Dolandırıcılık
  "2.3.1", // Metagaming
  "2.4.1", // FearRP
  "2.5.1", // Combat Logging
  "2.6.1", // RDM
  "2.6.2", // VDM
];

export const isRuleCritical = (ruleId: string) => CRITICAL_RULES.includes(ruleId);

// Flatten all rules for navigation
export const flattenRules = (data: MainCategory[]) => {
  return data.flatMap((cat) =>
    cat.subCategories.flatMap((subCat) =>
      subCat.rules.map((rule) => ({
        id: rule.id,
        categoryId: cat.id,
        subCategoryId: subCat.id,
      }))
    )
  );
};
