import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import testimonialBg from "@/assets/testimonial-bg.png";

// Add your testimonial images here
const testimonialCards = [
  { id: 1, image: testimonialBg },
  { id: 2, image: testimonialBg },
  { id: 3, image: testimonialBg },
];

// Generate particles for the portal effect
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 2 + Math.random() * 4,
  }));
};

const TestimonialsSection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.2 });
  const [activeIndex, setActiveIndex] = useState(1);
  const [direction, setDirection] = useState(1);
  const particles = useMemo(() => generateParticles(20), []);

  // Auto-rotate cards
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % testimonialCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (index: number) => {
    const positions = [
      { x: -220, rotate: -8, scale: 0.88, zIndex: 1, opacity: 0.75 }, // Left
      { x: 0, rotate: 0, scale: 1, zIndex: 10, opacity: 1 }, // Center
      { x: 220, rotate: 8, scale: 0.88, zIndex: 1, opacity: 0.75 }, // Right
    ];

    const relativeIndex =
      (index - activeIndex + testimonialCards.length) % testimonialCards.length;
    return positions[relativeIndex] || positions[0];
  };

  return (
    <section id="testimonials" className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
          }}
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
          }}
          animate={{ 
            x: [0, -40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 3 }}
        />
      </div>

      <div ref={sectionRef} className="container mx-auto px-6 relative z-10">
        {/* Section Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2 
            className="font-display text-[50px] md:text-[70px] lg:text-[90px] text-foreground leading-[0.9] tracking-tight italic"
            animate={isVisible ? {
              textShadow: [
                "0 0 0px transparent",
                "0 0 40px hsl(var(--primary) / 0.2)",
                "0 0 0px transparent",
              ],
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            THEY'LL TELL<br />YOU BETTER
          </motion.h2>
        </motion.div>

        {/* Testimonial Cards - Animated Carousel */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Cards Container - 16:9 aspect ratio cards */}
          <div className="flex justify-center items-end relative h-[200px] md:h-[280px] lg:h-[320px]">
            <AnimatePresence mode="sync">
              {testimonialCards.map((card, index) => {
                const style = getCardStyle(index);
                const isCenter = style.zIndex === 10;
                return (
                  <motion.div
                    key={card.id}
                    className="absolute w-[280px] md:w-[400px] lg:w-[480px] aspect-video rounded-[16px] md:rounded-[20px] border border-border/20 shadow-xl cursor-pointer overflow-hidden"
                    initial={false}
                    animate={{
                      x: style.x,
                      rotate: style.rotate,
                      scale: style.scale,
                      zIndex: style.zIndex,
                      opacity: style.opacity,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    whileHover={{
                      scale: style.scale * 1.03,
                    }}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1);
                      setActiveIndex(index);
                    }}
                    style={{
                      originY: 1,
                    }}
                  >
                    {/* Center card glow effect */}
                    {isCenter && (
                      <motion.div
                        className="absolute -inset-4 rounded-[24px] pointer-events-none -z-10"
                        style={{
                          background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.15) 40%, transparent 70%)",
                        }}
                        animate={{
                          opacity: [0.4, 0.7, 0.4],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    
                    {/* Testimonial Image - 16:9 aspect */}
                    <img
                      src={card.image}
                      alt={`Testimonial ${card.id}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Particle Effects */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[400px] md:w-[550px] h-32 pointer-events-none overflow-visible">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full bg-primary"
                style={{
                  width: particle.size,
                  height: particle.size,
                  left: `calc(50% + ${particle.x}px)`,
                  bottom: 20,
                }}
                animate={{
                  y: [-20, -80 - Math.random() * 40],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.3],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Portal Glow Effect - Closer to cards */}
          <motion.div
            className="relative mx-auto mt-2"
            animate={{
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Core glow */}
            <div className="w-[300px] md:w-[450px] h-14 md:h-18 mx-auto bg-primary rounded-[100%] blur-[2px] opacity-95" />
            {/* Mid glow */}
            <div className="absolute inset-0 w-[350px] md:w-[520px] h-18 md:h-22 mx-auto bg-primary/60 rounded-[100%] blur-lg -top-1" />
            {/* Outer glow */}
            <div className="absolute inset-0 w-[400px] md:w-[580px] h-24 md:h-28 mx-auto bg-primary/40 rounded-[100%] blur-2xl -top-3" />
            {/* Extra outer glow */}
            <div className="absolute inset-0 w-[450px] md:w-[640px] h-28 md:h-32 mx-auto bg-primary/20 rounded-[100%] blur-3xl -top-5" />
          </motion.div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {testimonialCards.map((_, index) => (
              <motion.button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeIndex ? "bg-primary" : "bg-foreground/20"
                }`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setDirection(index > activeIndex ? 1 : -1);
                  setActiveIndex(index);
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Update Notes Section */}
        <motion.div
          className="mt-16 md:mt-24 lg:mt-32"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Title - matching site style with enhanced animation */}
          <motion.h3 
            className="font-display text-[32px] sm:text-[42px] md:text-[56px] lg:text-[70px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold mb-6 md:mb-10"
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          >
            UPDATE<br />
            <motion.span 
              className="text-primary"
              animate={isVisible ? {
                textShadow: [
                  "0 0 20px hsl(var(--primary) / 0.3)",
                  "0 0 40px hsl(var(--primary) / 0.6)",
                  "0 0 20px hsl(var(--primary) / 0.3)",
                ],
              } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              NOTES
            </motion.span>
          </motion.h3>

          {/* Mobile: Horizontal scroll showing one card at a time, Desktop: Grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 scrollbar-hide">
            {[
              { version: "v1.2.0", title: "Yeni Bulmacalar Eklendi", date: "15 Ocak 2025" },
              { version: "v1.1.5", title: "Performans İyileştirmeleri", date: "10 Ocak 2025" },
              { version: "v1.1.0", title: "Yeni Harita Açıldı", date: "5 Ocak 2025" },
            ].map((note, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-auto snap-center bg-[#1a1a1a] rounded-xl md:rounded-2xl overflow-hidden border border-white/[0.06] cursor-pointer group relative"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.5 + index * 0.12,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Hover glow effect */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
                  }}
                />
                
                {/* Image placeholder */}
                <div className="aspect-[16/10] md:aspect-[4/3] bg-gradient-to-br from-secondary/50 to-secondary/20 relative overflow-hidden">
                  {/* Animated background pattern */}
                  <motion.div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: "radial-gradient(circle at 30% 70%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
                    }}
                    animate={isVisible ? {
                      opacity: [0.2, 0.4, 0.2],
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
                  />
                  
                  {/* Shimmer effect */}
                  <motion.div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                  
                  {/* Version badge */}
                  <motion.div 
                    className="absolute top-3 left-3 bg-primary/90 text-background text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full"
                    whileHover={{ scale: 1.1 }}
                  >
                    {note.version}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-5">
                  <p className="text-foreground/40 text-[10px] md:text-xs mb-1.5">{note.date}</p>
                  <h4 className="text-foreground font-display text-sm md:text-base lg:text-lg italic mb-3 group-hover:text-primary transition-colors duration-300">
                    {note.title}
                  </h4>
                  <motion.button
                    className="text-primary text-xs md:text-sm font-medium flex items-center gap-2 group/btn"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Devamını Oku
                    <motion.svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Mobile scroll indicator dots */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
