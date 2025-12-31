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
    question: "SUNUCUYA GİRİNCE ZORLA BİR SENARYOYA MI DAHİL OLACAĞIM?",
    answer: "Hayır. Sunucuda zorunlu RP, zorla senaryo veya dayatma yoktur. Oyuncular kendi karakterlerini belirtilen kurallar koşulunda yazdıktan sonra yetkili onayı ile birlikte rahatça oynayabilir."
  },
  {
    question: "YENİ OYUNCULAR İÇİN SUNUCU ZOR MU?",
    answer: "Hayır. Yeni başlayanlar için rehber sistemler ve destek ekibi bulunur. Deneyimsiz oyuncuların oyuna adapte olması özellikle desteklenir."
  },
  {
    question: "SUNUCUDA PAY-TO-WIN VAR MI?",
    answer: "Hayır. Bağışlar yalnızca kozmetik ve RP kolaylaştırıcı unsurlar içerir. Hiçbir bağış oyuncuya haksız güç veya üstünlük sağlamaz."
  },
  {
    question: "BU SUNUCUDA NASIL RP YAPMAM BEKLENİYOR?",
    answer: "Bu sunucuda RP, karakterin aldığı kararların sonuç doğurması üzerine kuruludur. Yaptığınız her hareketin, verdiğiniz her kararın dünyada bir karşılığı vardır."
  },
  {
    question: "TEK BAŞIMA OYNAYABİLİR MİYİM, YOKSA BİR GRUBA MI KATILMALIYIM?",
    answer: "Tek başına da başlayabilirsiniz. Sunucu, solo RP'den fraksiyon RP'sine kadar farklı oyun tarzlarını destekler. Zamanla doğal şekilde gruplara dahil olmanız teşvik edilir."
  },
  {
    question: "SUNUCUDA ÖLÜM / KARAKTER KAYBI NASIL İŞLİYOR?",
    answer: "Ölüm mekanikleri RP temellidir. Kalıcı karakter kaybı (CK) yalnızca ciddi RP süreçleri sonucunda gerçekleşir. Her durum kayıt altına alınır ve keyfi şekilde uygulanmaz."
  },
  {
    question: "KURALLARI BİLMEDEN HATA YAPARSAM BAN YER MİYİM?",
    answer: "Evet, mümkün. Sunucuya giriş yapan her oyuncu, kuralları okumuş ve kabul etmiş sayılır. RP'yi bozan, sunucu düzenine zarar veren veya kasıtlı olmasa bile ciddi ihlal oluşturan durumlarda doğrudan yaptırım uygulanabilir."
  },
  {
    question: "SUNUCU HİKÂYESİ ZORUNLU MU, KENDİ HİKÂYEMİ YAZABİLİR MİYİM?",
    answer: "Sunucunun bir ana lore'u vardır. Ancak her oyuncu kendi karakter hikâyesini özgürce yazar. Lore, RP'yi kısıtlamak için değil, derinleştirmek için vardır."
  }
];

const FAQSection = () => {
  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <section id="faq" className="py-10 md:py-24 lg:py-28 relative overflow-hidden">

      <motion.div 
        ref={sectionRef}
        className="container mx-auto px-6 relative z-10"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Section Title */}
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.h2 
            className="font-display text-[60px] md:text-[80px] text-foreground tracking-tight"
            animate={isVisible ? {
              textShadow: [
                "0 0 0px transparent",
                "0 0 30px hsl(var(--primary) / 0.3)",
                "0 0 0px transparent",
              ],
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            S.S.S
          </motion.h2>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div 
          className="max-w-5xl mx-auto space-y-3"
          variants={containerVariants}
        >
          <Accordion type="single" collapsible>
            {faqItems.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem 
                  value={`item-${index}`}
                  className="border-0 mb-3"
                >
                  <AccordionTrigger className="flex items-center justify-between w-full text-left rounded-xl px-8 py-6 transition-all duration-300 group [&>svg]:hidden relative overflow-hidden bg-gradient-to-r from-primary/25 via-secondary/40 to-secondary/40 hover:from-primary/30 hover:via-secondary/50 hover:to-secondary/50 hover:scale-[1.01]">
                    <span className="font-display text-lg md:text-xl lg:text-2xl text-foreground tracking-wide pr-4 relative z-10 italic">
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
