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
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="quests" className="py-20 md:py-28 relative overflow-hidden bg-background">
      <motion.div 
        ref={sectionRef}
        className="container mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Section Title - Top left, large */}
        <motion.div className="mb-12 md:mb-16" variants={itemVariants}>
          <h2 className="font-display text-[52px] md:text-[72px] lg:text-[88px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold">
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
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Description + Portal Image */}
          <motion.div className="lg:col-span-5 flex flex-col" variants={itemVariants}>
            {/* Description text - small italic */}
            <p className="text-foreground/50 text-[11px] md:text-xs leading-relaxed max-w-[200px] mb-4 italic">
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
          <div className="lg:col-span-7 flex flex-col gap-5 lg:pt-8">
            {/* Top Card - aligned right */}
            <motion.div 
              className="relative bg-[#222222] rounded-2xl p-6 border border-white/[0.06] cursor-pointer overflow-hidden lg:ml-auto lg:w-[320px]"
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-8 h-8 flex items-center justify-center mb-4">
                <Puzzle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-foreground/60 text-xs leading-relaxed">
                You'll find yourself inside a mysterious space where logic is your main tool and intuition helps you survive. Everything here is not what it seems
              </p>
            </motion.div>

            {/* Bottom Row - Two cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Card with diagonal gradient */}
              <motion.div 
                className="relative bg-[#222222] rounded-2xl p-5 border border-white/[0.06] cursor-pointer overflow-hidden"
                variants={itemVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {/* Diagonal yellow gradient overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, transparent 0%, transparent 40%, hsl(var(--primary) / 0.12) 70%, hsl(var(--primary) / 0.25) 100%)",
                  }}
                />
                
                <div className="w-7 h-7 flex items-center justify-center mb-3 relative z-10">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground/55 text-[11px] leading-relaxed relative z-10">
                  You're not entering a game — you're entering a different universe. Portal X changes your perception from the first seconds
                </p>
              </motion.div>

              {/* Dark card */}
              <motion.div 
                className="bg-[#222222] rounded-2xl p-5 border border-white/[0.06] cursor-pointer"
                variants={itemVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-7 h-7 flex items-center justify-center mb-3">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground/55 text-[11px] leading-relaxed">
                  Every detail is key. Careful attention will determine whether you find a way out or remain part of the system forever.
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

