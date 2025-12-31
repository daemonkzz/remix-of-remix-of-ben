import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlossaryTermCardProps {
  id: string;
  term: string;
  fullName: string | null;
  definition: string;
  isCritical: boolean;
  isActive?: boolean;
  searchQuery?: string;
  onRef?: (el: HTMLDivElement | null) => void;
}

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query?.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-primary/30 text-primary font-medium px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({
  id,
  term,
  fullName,
  definition,
  isCritical,
  isActive,
  searchQuery,
  onRef,
}) => {
  return (
    <motion.div
      ref={onRef}
      className="relative overflow-hidden rounded-2xl"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Sweep Glow Effect */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={`glow-${id}`}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-md" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Content */}
      <motion.div
        className={cn(
          "relative bg-secondary/30 rounded-2xl p-5 md:p-6 border transition-all duration-500",
          isActive
            ? "border-primary/60 bg-secondary/50 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
            : "border-border/20 hover:border-primary/30"
        )}
        animate={isActive ? { scale: [1, 1.005, 1] } : { scale: 1 }}
        transition={{ scale: { duration: 0.3, ease: "easeOut" } }}
      >
        {/* Term Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={cn(
                "font-mono text-xs px-2.5 py-1 rounded-md transition-all duration-300",
                isActive
                  ? "bg-primary/30 border border-primary/50 text-primary"
                  : "bg-secondary/60 border border-border/40 text-foreground/60"
              )}
            >
              {id}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold",
                isCritical
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-primary/20 text-primary border border-primary/30"
              )}
            >
              {searchQuery ? <HighlightText text={term} query={searchQuery} /> : term}
              {isCritical && <AlertTriangle className="w-3.5 h-3.5" />}
            </span>
            {fullName && (
              <span className="text-foreground/50 text-sm italic">
                ({searchQuery ? <HighlightText text={fullName} query={searchQuery} /> : fullName})
              </span>
            )}
          </div>
        </div>

        {/* Definition */}
        <div className="ml-1">
          <p className="text-foreground/70 text-sm md:text-base leading-relaxed">
            {searchQuery ? <HighlightText text={definition} query={searchQuery} /> : definition}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlossaryTermCard;
