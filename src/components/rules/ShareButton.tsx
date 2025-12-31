import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Link2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareButtonProps {
  ruleId: string;
  onShare: (ruleId: string) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ ruleId, onShare }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onShare(ruleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            className="relative group p-2 rounded-lg bg-transparent hover:bg-primary/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-primary"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-foreground/40 group-hover:text-primary transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Ripple effect on click */}
            {copied && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-primary/50"
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-secondary border-border/50">
          <div className="flex items-center gap-1.5 text-xs">
            <Share2 className="w-3 h-3" />
            <span>{copied ? "Kopyalandı!" : "Linki kopyala"}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ShareButton;
