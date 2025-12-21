import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const faqItems = [
  {
    question: "WILL WE REALLY BE LOCKED IN A ROOM?",
    answer: "No, you won't actually be locked in. Safety is our top priority. All doors have emergency exits, and our game masters monitor the rooms at all times. You can leave whenever you need to."
  },
  {
    question: "WHAT DO WE DO IF WE GET STUCK AND CAN'T SOLVE A RIDDLE?",
    answer: "Don't worry! Our game masters are always watching and ready to provide hints when needed. You can request a hint at any time through our in-room communication system."
  },
  {
    question: "HOW SCARY IS YOUR QUEST?",
    answer: "Our rooms vary in intensity. Some have light thriller elements while others are purely puzzle-focused. We clearly label each room's scare level so you can choose what's comfortable for you."
  },
  {
    question: "IS THE QUEST SUITABLE FOR CHILDREN?",
    answer: "Yes! We have family-friendly rooms suitable for children aged 10 and up. Children under 14 must be accompanied by an adult. We recommend checking each room's difficulty rating."
  },
  {
    question: "HOW MANY PEOPLE CAN PARTICIPATE IN THE GAME?",
    answer: "Our rooms accommodate 2-6 players, depending on the specific quest. We recommend 3-5 players for the optimal experience. Larger groups can book multiple rooms for a team competition!"
  },
  {
    question: "DO YOU NEED SKILLS OR FITNESS?",
    answer: "No special skills or physical fitness required! Our puzzles rely on logic, observation, and teamwork. The rooms are accessible and don't require climbing or strenuous activity."
  },
  {
    question: "HOW ARE BOOKINGS AND PAYMENTS MADE?",
    answer: "Book online through our website or call us directly. We accept all major credit cards, cash, and digital payment methods. A small deposit is required to confirm your booking."
  }
];

const FAQSection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section id="faq" className="py-24 md:py-32 lg:py-40">
      <motion.div 
        ref={sectionRef}
        className="container mx-auto px-6"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Section Title */}
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-[60px] md:text-[80px] text-foreground tracking-tight">FAQ</h2>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div 
          className="max-w-3xl mx-auto space-y-3"
          variants={containerVariants}
        >
          <Accordion type="single" collapsible>
            {faqItems.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem 
                  value={`item-${index}`}
                  className="border-0 mb-3"
                >
                  <AccordionTrigger className="flex items-center justify-between w-full text-left rounded-xl px-6 py-5 transition-all duration-300 group [&>svg]:hidden relative overflow-hidden bg-gradient-to-r from-primary/25 via-secondary/40 to-secondary/40 hover:from-primary/30 hover:via-secondary/50 hover:to-secondary/50 hover:scale-[1.01]">
                    <span className="font-display text-sm md:text-base text-foreground tracking-wide pr-4 relative z-10 italic">
                      {item.question}
                    </span>
                    <motion.div 
                      className="flex-shrink-0 relative z-10"
                      whileHover={{ scale: 1.1 }}
                    >
                      <ChevronDown className="w-5 h-5 text-foreground/50 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </motion.div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-gradient-to-r from-primary/10 via-secondary/30 to-secondary/30 rounded-b-xl px-6 pb-5 pt-0 -mt-2">
                    <motion.p 
                      className="text-foreground/50 text-sm leading-relaxed pt-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.answer}
                    </motion.p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FAQSection;
