import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import testimonialBg from "@/assets/testimonial-bg.png";
import type { UpdateCategory } from "@/types/update";

// Add your testimonial images here
const testimonialCards = [
  { id: 1, image: testimonialBg },
  { id: 2, image: testimonialBg },
  { id: 3, image: testimonialBg },
];

interface UpdateNote {
  id: string;
  title: string;
  version?: string;
  category: UpdateCategory;
  published_at: string;
  cover_image_url?: string;
}
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
  const [updateNotes, setUpdateNotes] = useState<UpdateNote[]>([]);

  // Fetch updates from database
  useEffect(() => {
    const fetchUpdates = async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("id, title, version, category, published_at, cover_image_url")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setUpdateNotes(data as UpdateNote[]);
      }
    };
    fetchUpdates();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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
    <section id="testimonials" className="py-10 md:py-24 lg:py-28 relative overflow-hidden">
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
            className="font-display text-[60px] md:text-[70px] lg:text-[90px] text-foreground leading-[0.9] tracking-tight italic"
            animate={isVisible ? {
              textShadow: [
                "0 0 0px transparent",
                "0 0 40px hsl(var(--primary) / 0.2)",
                "0 0 0px transparent",
              ],
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            KAZE<br />OBJEKTİFİ
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
            {/* Center card glow effect - separate from cards */}
            <motion.div
              className="absolute w-[300px] md:w-[420px] lg:w-[500px] aspect-video rounded-[24px] pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(234, 179, 8, 0.35) 0%, rgba(234, 179, 8, 0.12) 50%, transparent 75%)",
                filter: "blur(20px)",
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
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
            GÜNCELLEME<br />
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
              NOTLARI
            </motion.span>
          </motion.h3>

          {/* Cards container with conditional centering */}
          <div className={`flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:overflow-visible md:pb-0 scrollbar-hide ${
            updateNotes.length < 3 
              ? 'md:flex md:justify-center md:gap-8' 
              : 'md:grid md:grid-cols-3 md:gap-8'
          }`}>
            {updateNotes.length === 0 ? (
              <div className="text-center py-12 w-full">
                <p className="text-muted-foreground">Henüz güncelleme bulunmuyor.</p>
              </div>
            ) : (
              updateNotes.map((note, index) => (
                <Link
                  key={note.id}
                  to={`/guncellemeler/${note.id}`}
                  className="block flex-shrink-0 w-[300px] sm:w-[340px] md:w-full md:flex-shrink"
                >
                  <motion.div
                    className="h-full snap-center bg-[#1a1a1a] rounded-xl md:rounded-2xl overflow-hidden border border-white/[0.06] cursor-pointer group relative"
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
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
                      style={{
                        background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
                      }}
                    />
                    
                    {/* Image */}
                    <div className="aspect-video relative overflow-hidden">
                      {note.cover_image_url ? (
                        <img
                          src={note.cover_image_url}
                          alt={note.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <>
                          <div className="w-full h-full bg-gradient-to-br from-secondary/50 to-secondary/20" />
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
                        </>
                      )}
                      
                      {/* Shimmer effect */}
                      <motion.div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)",
                        }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                      
                      {/* Version badge - top left */}
                      <div className="absolute top-3 left-3 h-6">
                        {note.version && (
                          <motion.div 
                            className="bg-primary/90 text-background text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full"
                            whileHover={{ scale: 1.1 }}
                          >
                            {note.version}
                          </motion.div>
                        )}
                      </div>

                      {/* Category badge - top right */}
                      <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-background/80 backdrop-blur-sm text-primary border border-primary/30">
                        {note.category === "update" ? "Güncelleme" : "Haber"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-5">
                      <p className="text-foreground/40 text-[10px] md:text-xs mb-1.5">
                        {note.published_at ? formatDate(note.published_at) : ''}
                      </p>
                      <h4 className="text-foreground font-display text-sm md:text-base lg:text-lg italic mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {note.title}
                      </h4>
                      <motion.span
                        className="text-primary text-xs md:text-sm font-medium flex items-center gap-2"
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
                      </motion.span>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
          
          {/* Mobile scroll indicator dots */}
          {updateNotes.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 md:hidden">
              {updateNotes.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
