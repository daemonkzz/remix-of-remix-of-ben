import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CriticalBadgeProps {
  size?: "sm" | "md";
}

export const CriticalBadge: React.FC<CriticalBadgeProps> = ({ size = "md" }) => {
  const isSmall = size === "sm";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
              relative inline-flex items-center gap-1 
              ${isSmall ? "px-1.5 py-0.5" : "px-2 py-1"} 
              bg-gradient-to-r from-red-500/20 to-orange-500/20 
              border border-red-500/30 
              rounded-md cursor-help
            `}
          >
            {/* Subtle pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-md bg-red-500/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <ShieldAlert className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-400 relative z-10`} />
            <span className={`${isSmall ? "text-[9px]" : "text-[10px]"} font-semibold text-red-400 uppercase tracking-wider relative z-10`}>
              Kritik
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-secondary border-red-500/30 text-foreground max-w-[250px]"
        >
          <div className="flex items-start gap-2 p-1">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400 text-xs mb-1">Kritik Kural</p>
              <p className="text-foreground/70 text-xs leading-relaxed">
                Bu kural ihlali ciddi yaptırımlarla (kalıcı ban dahil) sonuçlanabilir. Lütfen dikkatle okuyun.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CriticalBadge;
