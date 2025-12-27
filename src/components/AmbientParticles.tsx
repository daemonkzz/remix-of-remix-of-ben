import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const AmbientParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Skip particle generation if user prefers reduced motion
    if (prefersReducedMotion) {
      setParticles([]);
      return;
    }

    const generateParticles = () => {
      const newParticles: Particle[] = [];
      // Mobile: 5 particles, Desktop: 15 particles
      const count = isMobile ? 5 : 15;
      
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 2,
          duration: Math.random() * 20 + 30, // Slow movement: 30-50 seconds
          delay: Math.random() * 10,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, [prefersReducedMotion, isMobile]);

  // Don't render anything if user prefers reduced motion
  if (prefersReducedMotion || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden contain-paint">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full gpu-accelerated"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle, hsla(136, 82%, 41%, 0.6) 0%, hsla(136, 82%, 41%, 0.2) 50%, transparent 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px hsla(136, 82%, 41%, 0.3)`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
            opacity: [0.15, 0.3, 0.2, 0.15],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default AmbientParticles;
