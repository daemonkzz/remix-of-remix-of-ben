import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/LoginModal";

// Generate floating particles
const generateFloatingParticles = (count: number) => {
  return Array.from({
    length: count
  }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5
  }));
};
const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const particles = useMemo(() => generateFloatingParticles(30), []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleApplyClick = () => {
    if (user) {
      navigate('/basvuru');
    } else {
      setIsLoginOpen(true);
    }
  };
  const {
    scrollYProgress
  } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30
  });
  const backgroundY = useTransform(smoothProgress, [0, 1], ["0%", "30%"]);
  const backgroundScale = useTransform(smoothProgress, [0, 1], [1, 1.1]);
  const textY = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);
  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 80,
      rotateX: -90
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        delay: 0.5 + i * 0.08,
        ease: [0.6, -0.05, 0.01, 0.99] as [number, number, number, number]
      }
    })
  };
  return <section ref={sectionRef} className="relative min-h-screen flex lg:items-end items-start overflow-hidden pb-8 pt-32 lg:pt-0">
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        {particles.map(particle => <motion.div key={particle.id} className="absolute rounded-full bg-primary/30" style={{
        width: particle.size,
        height: particle.size,
        left: `${particle.x}%`,
        top: `${particle.y}%`
      }} animate={{
        y: [0, -100, 0],
        x: [0, Math.random() * 50 - 25, 0],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1, 0.5]
      }} transition={{
        duration: particle.duration,
        delay: particle.delay,
        repeat: Infinity,
        ease: "easeInOut"
      }} />)}
      </div>

      {/* Background Image with Parallax */}
      <motion.div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroBg})`,
      y: backgroundY,
      scale: backgroundScale
    }}>
        {/* Bottom fade only - 5% height */}
        <div className="absolute bottom-0 left-0 right-0 h-[5%] bg-gradient-to-t from-background to-transparent" />
      </motion.div>

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-0 left-1/4 w-[2px] h-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" animate={{
        opacity: [0.3, 0.6, 0.3],
        x: [0, 50, 0]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" animate={{
        opacity: [0.2, 0.5, 0.2],
        x: [0, -30, 0]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }} />
      </div>

      {/* Content */}
      <motion.div className="container mx-auto px-6 relative z-10" style={{
      opacity
    }}>
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-row items-end justify-between gap-8 pb-16">
          {/* Left Content */}
          <motion.div className="max-w-xl" style={{
          y: textY
        }}>
            <motion.h1 className="font-display text-[180px] text-foreground leading-[0.85] tracking-tight mb-8 italic perspective-1000">
              <div className="overflow-visible">
                {"KAZE".split("").map((letter, i) => <motion.span key={`kaze-${i}`} className="inline-block" custom={i} variants={letterVariants} initial="hidden" animate="visible" whileHover={{
                scale: 1.1,
                color: "hsl(var(--primary))",
                textShadow: "0 0 30px hsl(var(--primary) / 0.8)"
              }}>
                    {letter}
                  </motion.span>)}
                <motion.span 
                  key="dash" 
                  className="inline-block text-primary transition-colors duration-300 hover:text-foreground" 
                  custom={4} 
                  variants={letterVariants} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{
                    scale: 1.1,
                    textShadow: "0 0 30px hsl(var(--foreground) / 0.8)"
                  }}
                >
                  -
                </motion.span>
                {"Z".split("").map((letter, i) => <motion.span key={`z-${i}`} className="inline-block" custom={i + 5} variants={letterVariants} initial="hidden" animate="visible" whileHover={{
                scale: 1.1,
                color: "hsl(var(--primary))",
                textShadow: "0 0 30px hsl(var(--primary) / 0.8)"
              }}>
                    {letter}
                  </motion.span>)}
              </div>
              <div className="overflow-visible">
                {"BAŞLIYOR".split("").map((letter, i) => <motion.span key={`basliyor-${i}`} className="inline-block" custom={i + 6} variants={letterVariants} initial="hidden" animate="visible" whileHover={{
                scale: 1.1,
                color: "hsl(var(--primary))",
                textShadow: "0 0 30px hsl(var(--primary) / 0.8)"
              }}>
                    {letter}
                  </motion.span>)}
              </div>
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="glow" size="lg" className="text-sm px-8 font-medium" onClick={handleApplyClick}>
                  Başvur <span className="ml-1.5">↗</span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Server Status Card */}
          <motion.div initial={{
          opacity: 0,
          y: 50,
          scale: 0.9
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} transition={{
          duration: 0.8,
          delay: 1.2
        }}>
            <motion.div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl p-4 min-w-[200px] relative overflow-hidden" whileHover={{
            scale: 1.05,
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px hsl(var(--primary) / 0.2)",
            borderColor: "hsl(var(--primary) / 0.4)"
          }} transition={{
            duration: 0.3
          }}>
              {/* Card shimmer effect */}
              <motion.div className="absolute inset-0 pointer-events-none" style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)"
            }} animate={{
              x: ["-100%", "200%"]
            }} transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 3
            }} />
              
              <div className="relative z-10">
                {/* Header with logo */}
                <div className="flex items-center gap-3 mb-3">
                  <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                  <div>
                    <motion.div className="bg-primary text-primary-foreground text-[9px] font-medium px-2 py-0.5 rounded inline-block uppercase tracking-wider" animate={{
                      boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 20px hsl(var(--primary) / 0.6)", "0 0 0px hsl(var(--primary) / 0)"]
                    }} transition={{
                      duration: 2,
                      repeat: Infinity
                    }}>
                      Sunucu Durumu
                    </motion.div>
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-2 mb-3">
                  <motion.div 
                    className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{
                      boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 12px hsl(var(--primary) / 0.8)", "0 0 0px hsl(var(--primary) / 0)"]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity
                    }}
                  />
                  <span className="text-foreground text-sm font-medium">Aktif</span>
                </div>
                
                {/* Player count bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-foreground/60">
                    <span>Oyuncu Sayısı</span>
                    <span className="text-primary font-medium">75/300</span>
                  </div>
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "25%" }}
                      transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden pb-8 pt-8">
          {/* Title */}
          <motion.div style={{ y: textY }}>
            <motion.h1 className="font-display text-[90px] sm:text-[110px] md:text-[140px] text-foreground leading-[0.85] tracking-tight mb-8 italic perspective-1000">
              <div className="overflow-visible">
                {"KAZE".split("").map((letter, i) => <motion.span key={`kaze-${i}`} className="inline-block" custom={i} variants={letterVariants} initial="hidden" animate="visible">
                    {letter}
                  </motion.span>)}
                <motion.span 
                  key="dash" 
                  className="inline-block text-primary transition-colors duration-300 hover:text-foreground" 
                  custom={4} 
                  variants={letterVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  -
                </motion.span>
                {"Z".split("").map((letter, i) => <motion.span key={`z-${i}`} className="inline-block" custom={i + 5} variants={letterVariants} initial="hidden" animate="visible">
                    {letter}
                  </motion.span>)}
              </div>
              <div className="overflow-visible">
                {"BAŞLIYOR".split("").map((letter, i) => <motion.span key={`basliyor-${i}`} className="inline-block" custom={i + 6} variants={letterVariants} initial="hidden" animate="visible">
                    {letter}
                  </motion.span>)}
              </div>
            </motion.h1>
          </motion.div>
          
          {/* Button and Server Status inline */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="glow" size="lg" className="text-base px-8 py-3 font-medium" onClick={handleApplyClick}>
                Başvur <span className="ml-1.5">↗</span>
              </Button>
            </motion.div>

            {/* Compact Server Status Card */}
            <motion.div 
              className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-xl p-3.5 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <div className="relative z-10 flex items-center gap-3">
                <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                      animate={{
                        boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 10px hsl(var(--primary) / 0.8)", "0 0 0px hsl(var(--primary) / 0)"]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity
                      }}
                    />
                    <span className="text-foreground text-sm font-medium">Aktif</span>
                  </div>
                  <span className="text-primary text-xs font-medium">75/300</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </section>;
};
export default HeroSection;