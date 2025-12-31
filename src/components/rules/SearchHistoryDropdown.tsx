import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Trash2 } from "lucide-react";

interface SearchHistoryDropdownProps {
  history: string[];
  show: boolean;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
}

export const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
  history,
  show,
  onSelect,
  onRemove,
  onClear,
}) => {
  if (history.length === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-2 bg-secondary/95 backdrop-blur-md border border-border/30 rounded-xl shadow-xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
            <div className="flex items-center gap-2 text-foreground/50">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Son Aramalar</span>
            </div>
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-foreground/40 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Temizle</span>
            </button>
          </div>

          {/* History items */}
          <div className="py-1">
            {history.map((query, index) => (
              <motion.div
                key={query}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group flex items-center justify-between px-4 py-2 hover:bg-primary/10 transition-colors"
              >
                <button
                  onClick={() => onSelect(query)}
                  className="flex-1 text-left text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  {query}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(query);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-red-400 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchHistoryDropdown;
