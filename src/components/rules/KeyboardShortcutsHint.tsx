import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

export const KeyboardShortcutsHint: React.FC = () => {
  const [show, setShow] = useState(false);

  const shortcuts = [
    { key: "↓ / j", description: "Sonraki kural" },
    { key: "↑ / k", description: "Önceki kural" },
    { key: "Esc", description: "Sayfanın başına git" },
  ];

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setShow(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary/80 border border-border/30 rounded-lg text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>Klavye kısayolları</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-secondary border border-border/50 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
            >
              {/* Close button */}
              <button
                onClick={() => setShow(false)}
                className="absolute top-4 right-4 p-1 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-display text-foreground italic">
                  Klavye Kısayolları
                </h3>
              </div>

              {/* Shortcuts list */}
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                  >
                    <span className="text-foreground/70 text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-background border border-border/50 rounded text-xs font-mono text-primary">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <p className="mt-4 text-xs text-foreground/40 text-center">
                Arama kutusundayken kısayollar devre dışıdır
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcutsHint;
