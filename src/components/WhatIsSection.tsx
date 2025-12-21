import { motion, Variants } from "framer-motion";
import { Puzzle, Zap, Key } from "lucide-react";
import portalSilhouette from "@/assets/portal-silhouette.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const WhatIsSection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.1 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.03, 
      y: -8,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const iconVariants = {
    rest: { rotate: 0, scale: 1 },
    hover: { 
      rotate: [0, -10, 10, 0],
      scale: 1.2,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="quests" className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-background">
      <motion.div 
        ref={sectionRef}
        className="container mx-auto px-4 md:px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* ===== MOBILE LAYOUT ===== */}
        <div className="lg:hidden">
          {/* Mobile: Title + Image side by side */}
          <div className="flex items-start gap-4">
            {/* Title */}
            <motion.div className="flex-1" variants={itemVariants}>
              <h2 className="font-display text-[32px] sm:text-[42px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold">
                WHAT<br />
                IS <motion.span 
                  className="text-primary"
                  animate={isVisible ? {
                    textShadow: [
                      "0 0 20px hsl(var(--primary) / 0.5)",
                      "0 0 40px hsl(var(--primary) / 0.8)",
                      "0 0 20px hsl(var(--primary) / 0.5)",
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  X PORTAL
                </motion.span>?
              </h2>
            </motion.div>
            
            {/* Portal Image - smaller on mobile */}
            <motion.div 
              className="w-[100px] sm:w-[140px] flex-shrink-0"
              variants={itemVariants}
            >
              <div className="aspect-[3/4] relative">
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse 45% 55% at 50% 50%, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.4) 35%, transparent 65%)",
                    filter: "blur(30px)",
                  }}
                  animate={isVisible ? { opacity: [0.6, 0.85, 0.6] } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.img 
                  src={portalSilhouette} 
                  alt="Portal silhouette" 
                  className="relative z-10 w-full h-full object-contain"
                  initial={{ scale: 1.05, opacity: 0 }}
                  animate={isVisible ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-[30px]"
                  style={{
                    background: "radial-gradient(ellipse 100% 100% at 50% 0%, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 50%, transparent 80%)",
                    filter: "blur(10px)",
                  }}
                  animate={isVisible ? { opacity: [0.5, 0.8, 0.5] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>

          {/* Mobile: Horizontal scroll cards */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <motion.div 
              className="flex-shrink-0 w-[200px] sm:w-[240px] relative bg-[#222222] rounded-xl p-4 border border-white/[0.06] cursor-pointer overflow-hidden"
              variants={itemVariants}
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Puzzle className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground/60 text-[10px] leading-relaxed">
                You'll find yourself inside a mysterious space where logic is your main tool.
              </p>
            </motion.div>

            <motion.div 
              className="flex-shrink-0 w-[200px] sm:w-[240px] relative bg-[#222222] rounded-xl p-4 border border-white/[0.06] cursor-pointer overflow-hidden"
              variants={itemVariants}
            >
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, transparent 0%, transparent 40%, hsl(var(--primary) / 0.12) 70%, hsl(var(--primary) / 0.25) 100%)",
                }}
              />
              <div className="w-6 h-6 flex items-center justify-center mb-2 relative z-10">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground/55 text-[10px] leading-relaxed relative z-10">
                You're not entering a game — you're entering a different universe.
              </p>
            </motion.div>

            <motion.div 
              className="flex-shrink-0 w-[200px] sm:w-[240px] bg-[#222222] rounded-xl p-4 border border-white/[0.06] cursor-pointer"
              variants={itemVariants}
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground/55 text-[10px] leading-relaxed">
                Every detail is key. Careful attention will determine your fate.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT ===== */}
        <div className="hidden lg:block">
          {/* Section Title - Top left, large */}
          <motion.div className="mb-12" variants={itemVariants}>
            <h2 className="font-display text-[72px] xl:text-[88px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold">
              WHAT<br />
              IS <motion.span 
                className="text-primary"
                animate={isVisible ? {
                  textShadow: [
                    "0 0 20px hsl(var(--primary) / 0.5)",
                    "0 0 40px hsl(var(--primary) / 0.8)",
                    "0 0 20px hsl(var(--primary) / 0.5)",
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                X PORTAL
              </motion.span>?
            </h2>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column - Description + Portal Image */}
            <motion.div className="col-span-5 flex flex-col" variants={itemVariants}>
              {/* Description text - small italic */}
              <p className="text-foreground/50 text-xs leading-relaxed max-w-[200px] mb-4 italic">
                An immersive puzzle-based quest that challenges your logic and perception
              </p>
              
              {/* Portal Image container */}
              <div className="relative w-full max-w-[380px]">
                <div className="aspect-[3/4] relative">
                  {/* Portal glow behind */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse 45% 55% at 50% 50%, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.4) 35%, transparent 65%)",
                      filter: "blur(40px)",
                    }}
                    animate={isVisible ? {
                      opacity: [0.6, 0.85, 0.6],
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Silhouette image */}
                  <motion.img 
                    src={portalSilhouette} 
                    alt="Portal silhouette" 
                    className="relative z-10 w-full h-full object-contain"
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={isVisible ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  
                  {/* Floor reflection */}
                  <motion.div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[200px] h-[50px]"
                    style={{
                      background: "radial-gradient(ellipse 100% 100% at 50% 0%, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 50%, transparent 80%)",
                      filter: "blur(15px)",
                    }}
                    animate={isVisible ? {
                      opacity: [0.5, 0.8, 0.5],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Right Column - Feature Cards */}
            <div className="col-span-7 flex flex-col gap-5 pt-8">
              {/* Top Card - aligned right */}
              <motion.div 
                className="relative bg-[#222222] rounded-2xl p-6 border border-white/[0.06] cursor-pointer overflow-hidden ml-auto w-[320px] group"
                variants={itemVariants}
                initial="rest"
                whileHover="hover"
                animate="rest"
              >
                {/* Hover glow */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.2) 0%, transparent 60%)",
                    boxShadow: "inset 0 1px 0 0 hsl(var(--primary) / 0.3)",
                  }}
                />
                <motion.div 
                  className="w-8 h-8 flex items-center justify-center mb-4 relative z-10"
                  variants={iconVariants}
                >
                  <Puzzle className="w-6 h-6 text-primary" />
                </motion.div>
                <p className="text-foreground/60 text-xs leading-relaxed relative z-10">
                  You'll find yourself inside a mysterious space where logic is your main tool and intuition helps you survive. Everything here is not what it seems
                </p>
              </motion.div>

              {/* Bottom Row - Two cards */}
              <div className="grid grid-cols-2 gap-5">
                {/* Card with diagonal gradient */}
                <motion.div 
                  className="relative bg-[#222222] rounded-2xl p-5 border border-white/[0.06] cursor-pointer overflow-hidden group"
                  variants={itemVariants}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                >
                  {/* Diagonal yellow gradient overlay */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(135deg, transparent 0%, transparent 40%, hsl(var(--primary) / 0.12) 70%, hsl(var(--primary) / 0.25) 100%)",
                    }}
                    initial={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* Shimmer effect on hover */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.15) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                  
                  <motion.div 
                    className="w-7 h-7 flex items-center justify-center mb-3 relative z-10"
                    variants={iconVariants}
                  >
                    <Zap className="w-5 h-5 text-primary" />
                  </motion.div>
                  <p className="text-foreground/55 text-[11px] leading-relaxed relative z-10">
                    You're not entering a game — you're entering a different universe. Portal X changes your perception from the first seconds
                  </p>
                </motion.div>

                {/* Dark card */}
                <motion.div 
                  className="bg-[#222222] rounded-2xl p-5 border border-white/[0.06] cursor-pointer relative overflow-hidden group"
                  variants={itemVariants}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                >
                  {/* Hover glow */}
                  <motion.div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                      background: "radial-gradient(circle at 50% 100%, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
                    }}
                  />
                  <motion.div 
                    className="w-7 h-7 flex items-center justify-center mb-3 relative z-10"
                    variants={iconVariants}
                  >
                    <Key className="w-5 h-5 text-primary" />
                  </motion.div>
                  <p className="text-foreground/55 text-[11px] leading-relaxed relative z-10">
                    Every detail is key. Careful attention will determine whether you find a way out or remain part of the system forever.
                  </p>
                </motion.div>
              </div>

              {/* Full-width bottom card - same height as left image */}
              <motion.div 
                className="relative bg-[#222222] rounded-2xl p-6 border border-white/[0.06] cursor-pointer overflow-hidden group flex-1 min-h-[180px] flex flex-col justify-center"
                variants={itemVariants}
                initial="rest"
                whileHover="hover"
                animate="rest"
              >
                {/* Yellow diagonal gradient overlay */}
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, transparent 0%, transparent 30%, hsl(var(--primary) / 0.08) 60%, hsl(var(--primary) / 0.2) 100%)",
                  }}
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
                {/* Hover glow */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.2) 0%, transparent 60%)",
                  }}
                />
                {/* Shimmer effect on hover */}
                <motion.div 
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.15) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                />
                <motion.div 
                  className="w-8 h-8 flex items-center justify-center mb-4 relative z-10"
                  variants={iconVariants}
                >
                  <Puzzle className="w-6 h-6 text-primary" />
                </motion.div>
                <p className="text-foreground/60 text-xs leading-relaxed relative z-10 max-w-md">
                  The clock is ticking. Every second counts in this race against time where teamwork and quick thinking are your only allies.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default WhatIsSection;
