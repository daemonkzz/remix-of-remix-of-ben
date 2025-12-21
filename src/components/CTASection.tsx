import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import portalSilhouette from "@/assets/portal-silhouette.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CTASection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden">
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
            <motion.div 
              className="relative mx-auto w-72 md:w-80 aspect-[3/4] rounded-[32px] overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.img 
                src={portalSilhouette} 
                alt="Enter the portal" 
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={isVisible ? { scale: 1 } : {}}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              {/* Portal glow effect */}
              <motion.div 
                className="absolute inset-0 pointer-events-none rounded-[32px]"
                animate={isVisible ? {
                  boxShadow: [
                    "inset 0 0 60px hsl(var(--primary) / 0.1)",
                    "inset 0 0 100px hsl(var(--primary) / 0.25)",
                    "inset 0 0 60px hsl(var(--primary) / 0.1)",
                  ],
                } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="glow" 
                size="lg" 
                className="px-12 py-6 text-sm font-medium rounded-sm"
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 0px transparent",
                      "0 0 10px hsl(var(--primary) / 0.5)",
                      "0 0 0px transparent",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Book now
                </motion.span>
                <motion.span 
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↗
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
