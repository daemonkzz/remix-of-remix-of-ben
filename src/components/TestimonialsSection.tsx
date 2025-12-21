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
    <section id="testimonials" className="py-24 md:py-32 relative overflow-hidden">
      <div ref={sectionRef} className="container mx-auto px-6">
        {/* Section Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="font-display text-[50px] md:text-[70px] lg:text-[90px] text-foreground leading-[0.9] tracking-tight italic">
            THEY'LL TELL<br />YOU BETTER
          </h2>
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
          className="text-center mt-28"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="font-display text-lg md:text-xl text-foreground mb-10 tracking-[0.25em] uppercase">
            UPDATE NOTES
          </h3>
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((item, index) => (
              <motion.div
                key={item}
                className="aspect-video bg-secondary/30 rounded-[16px] md:rounded-[20px] border border-border/10 cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  borderColor: "hsl(var(--primary) / 0.3)",
                  backgroundColor: "hsl(var(--secondary) / 0.5)",
                }}
                whileTap={{ scale: 0.98 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
