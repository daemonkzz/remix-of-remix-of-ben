import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const rulesData = [
  {
    id: "genel-kurallar",
    title: "Genel Kurallar",
    content: [
      "Tüm oyunculara saygılı davranılmalıdır.",
      "Küfür, hakaret ve aşağılayıcı söylemler yasaktır.",
      "Spam yapmak ve gereksiz mesajlar göndermek yasaktır.",
      "Oyun içi ve dışı her türlü taciz yasaktır.",
      "Yetkililerin kararlarına saygı gösterilmelidir.",
    ],
  },
  {
    id: "roleplay-kurallari",
    title: "Roleplay Kuralları",
    content: [
      "Her zaman karakterinizde kalmalısınız (IC).",
      "OOC (Out of Character) konuşmalar için belirlenen kanalları kullanın.",
      "Powergaming yasaktır - karşı tarafa tepki verme şansı tanıyın.",
      "Metagaming yasaktır - IC bilmediğiniz bilgileri kullanmayın.",
      "Random Deathmatch (RDM) kesinlikle yasaktır.",
      "Vehicle Deathmatch (VDM) kesinlikle yasaktır.",
    ],
  },
  {
    id: "karakter-kurallari",
    title: "Karakter Kuralları",
    content: [
      "Karakteriniz gerçekçi bir geçmişe sahip olmalıdır.",
      "Ünlü kişilerin isimlerini veya karakterlerini kullanamazsınız.",
      "Karakterinizin yaşı 18'den büyük olmalıdır.",
      "Fear RP kuralına uymalısınız - karakteriniz ölümden korkmalı.",
      "New Life Rule (NLR) - Öldükten sonra önceki olayları hatırlayamazsınız.",
    ],
  },
  {
    id: "suc-kurallari",
    title: "Suç Kuralları",
    content: [
      "Banka soygunu için minimum 4 polis online olmalıdır.",
      "Rehine alma süresi maksimum 30 dakikadır.",
      "Cop baiting (polis kışkırtma) yasaktır.",
      "Güvenli bölgelerde suç işlenemez.",
      "Gang savaşları için yetki alınmalıdır.",
      "Silah kullanımı öncesi RP yapılmalıdır.",
    ],
  },
  {
    id: "arac-kurallari",
    title: "Araç Kuralları",
    content: [
      "Trafik kurallarına uyulmalıdır (acil durumlar hariç).",
      "Araç parkı belirlenen yerlere yapılmalıdır.",
      "Araçları kasıtlı olarak kaza yaptırmak yasaktır.",
      "Uçan araçlar için özel izin gereklidir.",
      "Araç modifikasyonları karakter bütçesine uygun olmalıdır.",
    ],
  },
  {
    id: "iletisim-kurallari",
    title: "İletişim Kuralları",
    content: [
      "Oyun içi iletişim için mikrofon kullanılmalıdır.",
      "Push-to-talk önerilir, açık mikrofon kullanılmamalıdır.",
      "Telsiz mesafesi kurallarına uyulmalıdır.",
      "Discord voice chat sadece OOC iletişim içindir.",
      "Karakterler arası telefon görüşmeleri IC olarak yapılmalıdır.",
    ],
  },
  {
    id: "ekonomi-kurallari",
    title: "Ekonomi Kuralları",
    content: [
      "Para transferleri kayıt altına alınır.",
      "Gerçek para ile oyun içi para alışverişi yasaktır.",
      "Ekonomiyi bozmaya yönelik eylemler yasaktır.",
      "İş yeri sahipleri fiyatları makul tutmalıdır.",
      "Çoklu hesap ile ekonomi manipülasyonu yasaktır.",
    ],
  },
  {
    id: "ceza-sistemi",
    title: "Ceza Sistemi",
    content: [
      "İlk ihlal: Sözlü uyarı",
      "İkinci ihlal: Yazılı uyarı ve 24 saat ban",
      "Üçüncü ihlal: 7 gün ban",
      "Dördüncü ihlal: Kalıcı ban",
      "Ağır ihlaller doğrudan kalıcı ban ile sonuçlanabilir.",
      "Ban itirazları Discord üzerinden yapılabilir.",
    ],
  },
];

const Kurallar = () => {
  const [activeSection, setActiveSection] = useState(rulesData[0].id);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const rule of rulesData) {
        const element = sectionRefs.current[rule.id];
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(rule.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      const offsetTop = element.offsetTop - 120;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Page Title */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-[60px] md:text-[80px] lg:text-[100px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold">
              <span className="text-primary">KAZE</span>-Z
            </h1>
            <h2 className="font-display text-[40px] md:text-[50px] lg:text-[60px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold mt-2">
              KURALLARI
            </h2>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <motion.aside
              className="lg:w-72 flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="lg:sticky lg:top-28 bg-secondary/30 rounded-2xl p-4 md:p-6 border border-border/20">
                <h3 className="text-primary font-display text-lg italic mb-4 tracking-wide">
                  Konu Başlıkları
                </h3>
                <nav className="space-y-2">
                  {rulesData.map((rule) => (
                    <motion.button
                      key={rule.id}
                      onClick={() => scrollToSection(rule.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 text-sm ${
                        activeSection === rule.id
                          ? "bg-primary/20 text-primary border-l-2 border-primary"
                          : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {rule.title}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.aside>

            {/* Main Content */}
            <motion.div
              className="flex-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {rulesData.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  ref={(el) => (sectionRefs.current[rule.id] = el)}
                  className="mb-12"
                  variants={itemVariants}
                >
                  <div className="bg-secondary/20 rounded-2xl p-6 md:p-8 border border-border/10 hover:border-primary/20 transition-colors duration-300">
                    {/* Section Number & Title */}
                    <div className="flex items-start gap-4 mb-6">
                      <span className="text-primary/40 font-display text-[40px] md:text-[50px] italic leading-none">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground italic tracking-wide pt-2">
                        {rule.title}
                      </h3>
                    </div>

                    {/* Rules List */}
                    <ul className="space-y-4 ml-4 md:ml-16">
                      {rule.content.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          className="flex items-start gap-3 text-foreground/80 text-sm md:text-base leading-relaxed"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: itemIndex * 0.05 }}
                          viewport={{ once: true }}
                        >
                          <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}

              {/* Footer Note */}
              <motion.div
                className="bg-primary/10 rounded-2xl p-6 md:p-8 border border-primary/20"
                variants={itemVariants}
              >
                <p className="text-foreground/70 text-sm md:text-base leading-relaxed">
                  <span className="text-primary font-semibold">Not:</span> Bu kurallar sunucu yönetimi tarafından herhangi bir zamanda güncellenebilir. 
                  Kurallardaki değişiklikler Discord sunucusu üzerinden duyurulacaktır. Tüm oyuncuların kuralları düzenli olarak kontrol etmesi önerilir.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Kurallar;
