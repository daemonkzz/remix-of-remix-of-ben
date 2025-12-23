import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useMemo } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import hourglassIcon from "@/assets/hourglass-icon.png";

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
  return <section ref={sectionRef} className="relative min-h-screen flex items-end overflow-hidden pb-8">
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

      {/* Logo Glow Effect - Sarı parıltı efekti */}
      <motion.div 
        className="absolute pointer-events-none z-[3]"
        style={{
          right: '22%',
          bottom: '32%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, hsl(45 100% 60% / 0.25) 0%, hsl(40 100% 50% / 0.1) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.9, 1.15, 0.9],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Secondary smaller glow */}
      <motion.div 
        className="absolute pointer-events-none z-[3]"
        style={{
          right: '24%',
          bottom: '35%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, hsl(50 100% 65% / 0.35) 0%, transparent 60%)',
          filter: 'blur(25px)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Floating sparkles around logo */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute pointer-events-none z-[4]"
          style={{
            right: `${20 + i * 3}%`,
            bottom: `${30 + i * 4}%`,
            width: '4px',
            height: '4px',
            background: 'hsl(50 100% 70%)',
            borderRadius: '50%',
            boxShadow: '0 0 10px hsl(50 100% 60% / 0.8), 0 0 20px hsl(45 100% 55% / 0.5)',
          }}
          animate={{
            y: [0, -30 - i * 10, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8
          }}
        />
      ))}

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
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-16">
          {/* Left Content */}
          <motion.div className="max-w-xl" style={{
          y: textY
        }}>
            <motion.h1 className="font-display text-[100px] md:text-[140px] lg:text-[180px] text-foreground leading-[0.85] tracking-tight mb-8 italic perspective-1000">
              <div className="overflow-visible">
                {"ESCAPE".split("").map((letter, i) => <motion.span key={`escape-${i}`} className="inline-block" custom={i} variants={letterVariants} initial="hidden" animate="visible" whileHover={{
                scale: 1.1,
                color: "hsl(var(--primary))",
                textShadow: "0 0 30px hsl(var(--primary) / 0.8)"
              }}>
                    {letter}
                  </motion.span>)}
              </div>
              <div className="overflow-visible">
                {"ROOM".split("").map((letter, i) => <motion.span key={`room-${i}`} className="inline-block" custom={i + 6} variants={letterVariants} initial="hidden" animate="visible" whileHover={{
                scale: 1.1,
                color: "hsl(var(--primary))",
                textShadow: "0 0 30px hsl(var(--primary) / 0.8)"
              }}>
                    {letter}
                  </motion.span>)}
              </div>
            </motion.h1>
            <motion.p className="text-foreground/40 text-[11px] max-w-[200px] leading-relaxed" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 1.5
          }}>
              Step into a world of puzzles, traps, and unexpected twists — an escape room that won't let you go until the very end
            </motion.p>
          </motion.div>

          {/* Right Content - Quest Card */}
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
            <motion.div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl p-4 inline-flex items-start gap-4 min-w-[180px] relative overflow-hidden" whileHover={{
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
              
              <div className="flex-1 relative z-10">
                <motion.div className="bg-primary text-primary-foreground text-[9px] font-medium px-2 py-0.5 rounded inline-block mb-2 uppercase tracking-wider" animate={{
                boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 20px hsl(var(--primary) / 0.6)", "0 0 0px hsl(var(--primary) / 0)"]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                  New Quest
                </motion.div>
                <h3 className="font-display text-xl text-foreground leading-tight tracking-wide">
                  THE LAST<br />HOUR
                </h3>
                <motion.span className="text-primary text-lg mt-1 inline-block" animate={{
                x: [0, 8, 0],
                scale: [1, 1.1, 1]
              }} transition={{
                duration: 1.5,
                repeat: Infinity
              }}>
                  ↗
                </motion.span>
              </div>
              <div className="w-16 h-20 flex items-center justify-center relative z-10">
                <motion.img src={hourglassIcon} alt="Hourglass" className="w-14 h-14 object-contain" animate={{
                y: [0, -10, 0],
                rotate: [0, 8, 0, -8, 0],
                filter: ["drop-shadow(0 0 10px hsl(var(--primary) / 0.3))", "drop-shadow(0 0 25px hsl(var(--primary) / 0.6))", "drop-shadow(0 0 10px hsl(var(--primary) / 0.3))"]
              }} transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>;
};
export default HeroSection;