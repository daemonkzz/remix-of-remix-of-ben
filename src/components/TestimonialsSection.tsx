import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import testimonialBg from "@/assets/testimonial-bg.png";

// Add your testimonial images here
// (Using a bundled placeholder image so it always renders. Replace per card as needed.)
const testimonialCards = [
  { id: 1, image: testimonialBg },
  { id: 2, image: testimonialBg },
  { id: 3, image: testimonialBg },
];

const TestimonialsSection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.2 });
  const [activeIndex, setActiveIndex] = useState(1);
  const [direction, setDirection] = useState(1);

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
      { x: -200, rotate: -12, scale: 0.85, zIndex: 1, opacity: 0.7 }, // Left
      { x: 0, rotate: 0, scale: 1, zIndex: 10, opacity: 1 }, // Center
      { x: 200, rotate: 12, scale: 0.85, zIndex: 1, opacity: 0.7 }, // Right
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
          className="text-center mb-16"
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
          className="relative max-w-4xl mx-auto mb-0"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex justify-center items-end relative h-[320px] md:h-[380px]">
            <AnimatePresence mode="sync">
              {testimonialCards.map((card, index) => {
                const style = getCardStyle(index);
                return (
                  <motion.div
                    key={card.id}
                    className="absolute w-56 md:w-72 h-64 md:h-80 rounded-[20px] border border-border/20 shadow-xl cursor-pointer overflow-hidden"
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
                      scale: style.scale * 1.05,
                    }}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1);
                      setActiveIndex(index);
                    }}
                    style={{
                      originY: 1,
                    }}
                  >
                    {/* Testimonial Image - fills and clips to the tilted card shape */}
                    <img
                      src={card.image}
                      alt={`Testimonial ${card.id}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover rounded-[20px]"
                    />

                    {/* Removed the dark overlay that was reading like a black shadow */}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Center Card Glow Effect */}
            <motion.div
              className="absolute bottom-0 w-64 md:w-80 h-72 md:h-[340px] pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 60px 20px hsl(var(--primary) / 0.1)",
                  "0 0 80px 30px hsl(var(--primary) / 0.2)",
                  "0 0 60px 20px hsl(var(--primary) / 0.1)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ zIndex: 0 }}
            />
          </div>

          {/* Portal Glow Effect - Oval Shape */}
          <motion.div
            className="relative mx-auto -mt-8"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-[280px] md:w-[400px] h-16 md:h-20 mx-auto bg-primary rounded-[100%] blur-sm opacity-90" />
            <div className="absolute inset-0 w-[320px] md:w-[450px] h-20 md:h-24 mx-auto bg-primary/50 rounded-[100%] blur-xl -top-2" />
            <div className="absolute inset-0 w-[360px] md:w-[500px] h-24 md:h-28 mx-auto bg-primary/30 rounded-[100%] blur-2xl -top-4" />
          </motion.div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
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
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[1, 2, 3].map((item, index) => (
              <motion.div
                key={item}
                className="aspect-square bg-secondary/30 rounded-[20px] md:rounded-[28px] border border-border/10 cursor-pointer"
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
