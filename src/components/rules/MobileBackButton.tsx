import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, List } from "lucide-react";

interface MobileBackButtonProps {
  show: boolean;
  onClick: () => void;
  currentCategory?: string;
}

export const MobileBackButton: React.FC<MobileBackButtonProps> = ({
  show,
  onClick,
  currentCategory,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm font-medium">Kategoriler</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default MobileBackButton;
