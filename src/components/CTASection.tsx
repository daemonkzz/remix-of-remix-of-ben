import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import portalSilhouette from "@/assets/portal-silhouette.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/LoginModal";

// Generate portal particles
const generatePortalParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    distance: 120 + Math.random() * 40,
    size: 2 + Math.random() * 3,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
  }));
};

const CTASection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.2 });
  const particles = useMemo(() => generatePortalParticles(24), []);
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

  return (
    <section className="py-10 md:py-24 lg:py-28 relative overflow-hidden">
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
        }}
        animate={isVisible ? { opacity: [0.5, 0.8, 0.5] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div 
        ref={sectionRef}
        className="container mx-auto px-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-md mx-auto text-center">
          {/* Portal Image with Woman Silhouette */}
          <motion.div 
            className="mb-0 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Orbiting particles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full bg-primary"
                  style={{
                    width: particle.size,
                    height: particle.size,
                  }}
                  animate={{
                    x: [
                      Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
                      Math.cos(((particle.angle + 180) * Math.PI) / 180) * particle.distance,
                      Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
                    ],
                    y: [
                      Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
                      Math.sin(((particle.angle + 180) * Math.PI) / 180) * particle.distance,
                      Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
                    ],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: particle.duration * 2,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <motion.div 
              className="relative mx-auto w-72 md:w-80 aspect-[3/4] rounded-[32px] overflow-hidden"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.4 }}
            >
              {/* Pulsing border glow */}
              <motion.div
                className="absolute -inset-1 rounded-[36px] pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.4), transparent, hsl(var(--primary) / 0.3))",
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <motion.img 
                src={portalSilhouette} 
                alt="Enter the portal" 
                className="w-full h-full object-cover relative z-10"
                initial={{ scale: 1.1 }}
                animate={isVisible ? { scale: 1 } : {}}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20" />
              
              {/* Enhanced portal glow effect */}
              <motion.div 
                className="absolute inset-0 pointer-events-none rounded-[32px] z-30"
                animate={isVisible ? {
                  boxShadow: [
                    "inset 0 0 60px hsl(var(--primary) / 0.1), 0 0 30px hsl(var(--primary) / 0.2)",
                    "inset 0 0 100px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.4)",
                    "inset 0 0 60px hsl(var(--primary) / 0.1), 0 0 30px hsl(var(--primary) / 0.2)",
                  ],
                } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="glow" 
                size="lg" 
                className="px-12 py-6 text-sm font-medium rounded-sm relative overflow-hidden group"
                onClick={handleApplyClick}
              >
                {/* Button shimmer effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary-foreground) / 0.2) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                />
                <motion.span
                  className="relative z-10"
                  animate={{
                    textShadow: [
                      "0 0 0px transparent",
                      "0 0 15px hsl(var(--primary) / 0.8)",
                      "0 0 0px transparent",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Başvur
                </motion.span>
                <motion.span 
                  className="ml-2 relative z-10"
                  animate={{ x: [0, 6, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↗
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </section>
  );
};

export default CTASection;
