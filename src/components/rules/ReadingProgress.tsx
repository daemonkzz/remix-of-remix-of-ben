import React from "react";
import { motion } from "framer-motion";

interface ReadingProgressProps {
  progress: number;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({ progress }) => {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-background/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 origin-left"
        style={{ 
          width: `${progress}%`,
          boxShadow: progress > 0 ? "0 0 10px hsl(var(--primary) / 0.5)" : "none"
        }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Progress percentage indicator (only visible when scrolled) */}
      {progress > 5 && progress < 95 && (
        <motion.div
          className="absolute top-2 right-4 px-2 py-0.5 bg-secondary/90 border border-border/30 rounded text-[10px] font-mono text-foreground/60"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReadingProgress;
