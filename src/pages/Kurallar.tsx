import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";

interface Rule {
  id: string;
  title: string;
}

interface SubCategory {
  id: string;
  title: string;
  rules: Rule[];
}

interface MainCategory {
  id: string;
  title: string;
  subCategories: SubCategory[];
}

const rulesData: MainCategory[] = [
  {
    id: "1",
    title: "Genel Kurallar",
    subCategories: [
      {
        id: "1.1",
        title: "Davranış Kuralları",
        rules: [
          { id: "1.1.1", title: "Tüm oyunculara saygılı davranılmalıdır." },
          { id: "1.1.2", title: "Küfür, hakaret ve aşağılayıcı söylemler yasaktır." },
          { id: "1.1.3", title: "Spam yapmak ve gereksiz mesajlar göndermek yasaktır." },
          { id: "1.1.4", title: "Oyun içi ve dışı her türlü taciz yasaktır." },
        ],
      },
      {
        id: "1.2",
        title: "Yetki Kuralları",
        rules: [
          { id: "1.2.1", title: "Yetkililerin kararlarına saygı gösterilmelidir." },
          { id: "1.2.2", title: "Yetkililerle tartışmak yerine ticket açılmalıdır." },
          { id: "1.2.3", title: "Yetkili kararlarına itiraz Discord üzerinden yapılır." },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Roleplay Kuralları",
    subCategories: [
      {
        id: "2.1",
        title: "Temel RP Kuralları",
        rules: [
          { id: "2.1.1", title: "Her zaman karakterinizde kalmalısınız (IC)." },
          { id: "2.1.2", title: "OOC (Out of Character) konuşmalar için belirlenen kanalları kullanın." },
          { id: "2.1.3", title: "Powergaming yasaktır - karşı tarafa tepki verme şansı tanıyın." },
          { id: "2.1.4", title: "Metagaming yasaktır - IC bilmediğiniz bilgileri kullanmayın." },
        ],
      },
      {
        id: "2.2",
        title: "Saldırı Kuralları",
        rules: [
          { id: "2.2.1", title: "Random Deathmatch (RDM) kesinlikle yasaktır." },
          { id: "2.2.2", title: "Vehicle Deathmatch (VDM) kesinlikle yasaktır." },
          { id: "2.2.3", title: "Combat logging (savaş sırasında çıkış) yasaktır." },
          { id: "2.2.4", title: "Revenge Kill (intikam öldürmesi) yasaktır." },
        ],
      },
      {
        id: "2.3",
        title: "Karakter Kuralları",
        rules: [
          { id: "2.3.1", title: "Karakteriniz gerçekçi bir geçmişe sahip olmalıdır." },
          { id: "2.3.2", title: "Ünlü kişilerin isimlerini veya karakterlerini kullanamazsınız." },
          { id: "2.3.3", title: "Karakterinizin yaşı 18'den büyük olmalıdır." },
          { id: "2.3.4", title: "Fear RP kuralına uymalısınız - karakteriniz ölümden korkmalı." },
          { id: "2.3.5", title: "New Life Rule (NLR) - Öldükten sonra önceki olayları hatırlayamazsınız." },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Suç ve Çete Kuralları",
    subCategories: [
      {
        id: "3.1",
        title: "Soygun Kuralları",
        rules: [
          { id: "3.1.1", title: "Banka soygunu için minimum 4 polis online olmalıdır." },
          { id: "3.1.2", title: "Mücevherat soygunu için minimum 3 polis online olmalıdır." },
          { id: "3.1.3", title: "Market soygunu için minimum 2 polis online olmalıdır." },
          { id: "3.1.4", title: "Ardışık soygunlar arasında en az 30 dakika beklenmelidir." },
        ],
      },
      {
        id: "3.2",
        title: "Rehine Kuralları",
        rules: [
          { id: "3.2.1", title: "Rehine alma süresi maksimum 30 dakikadır." },
          { id: "3.2.2", title: "Rehine olarak kendi çete üyelerinizi kullanamazsınız." },
          { id: "3.2.3", title: "Rehinenin gerçekçi talepleri karşılanmalıdır." },
        ],
      },
      {
        id: "3.3",
        title: "Çete Kuralları",
        rules: [
          { id: "3.3.1", title: "Cop baiting (polis kışkırtma) yasaktır." },
          { id: "3.3.2", title: "Güvenli bölgelerde suç işlenemez." },
          { id: "3.3.3", title: "Gang savaşları için yetki alınmalıdır." },
          { id: "3.3.4", title: "Silah kullanımı öncesi RP yapılmalıdır." },
          { id: "3.3.5", title: "Çete üye sayısı maksimum 15 kişidir." },
        ],
      },
    ],
  },
  {
    id: "4",
    title: "Araç ve Trafik Kuralları",
    subCategories: [
      {
        id: "4.1",
        title: "Sürüş Kuralları",
        rules: [
          { id: "4.1.1", title: "Trafik kurallarına uyulmalıdır (acil durumlar hariç)." },
          { id: "4.1.2", title: "Araç parkı belirlenen yerlere yapılmalıdır." },
          { id: "4.1.3", title: "Araçları kasıtlı olarak kaza yaptırmak yasaktır." },
          { id: "4.1.4", title: "Kaldırımda araç kullanmak yasaktır." },
        ],
      },
      {
        id: "4.2",
        title: "Araç Kullanım Kuralları",
        rules: [
          { id: "4.2.1", title: "Uçan araçlar için özel izin gereklidir." },
          { id: "4.2.2", title: "Araç modifikasyonları karakter bütçesine uygun olmalıdır." },
          { id: "4.2.3", title: "Çalıntı araçlar 2 saat içinde terk edilmelidir." },
          { id: "4.2.4", title: "Süper araçlar sadece whitelisted oyunculara açıktır." },
        ],
      },
    ],
  },
  {
    id: "5",
    title: "İletişim ve Ekonomi Kuralları",
    subCategories: [
      {
        id: "5.1",
        title: "İletişim Kuralları",
        rules: [
          { id: "5.1.1", title: "Oyun içi iletişim için mikrofon kullanılmalıdır." },
          { id: "5.1.2", title: "Push-to-talk önerilir, açık mikrofon kullanılmamalıdır." },
          { id: "5.1.3", title: "Telsiz mesafesi kurallarına uyulmalıdır." },
          { id: "5.1.4", title: "Discord voice chat sadece OOC iletişim içindir." },
          { id: "5.1.5", title: "Karakterler arası telefon görüşmeleri IC olarak yapılmalıdır." },
        ],
      },
      {
        id: "5.2",
        title: "Ekonomi Kuralları",
        rules: [
          { id: "5.2.1", title: "Para transferleri kayıt altına alınır." },
          { id: "5.2.2", title: "Gerçek para ile oyun içi para alışverişi yasaktır." },
          { id: "5.2.3", title: "Ekonomiyi bozmaya yönelik eylemler yasaktır." },
          { id: "5.2.4", title: "İş yeri sahipleri fiyatları makul tutmalıdır." },
          { id: "5.2.5", title: "Çoklu hesap ile ekonomi manipülasyonu yasaktır." },
        ],
      },
      {
        id: "5.3",
        title: "Ceza Sistemi",
        rules: [
          { id: "5.3.1", title: "İlk ihlal: Sözlü uyarı" },
          { id: "5.3.2", title: "İkinci ihlal: Yazılı uyarı ve 24 saat ban" },
          { id: "5.3.3", title: "Üçüncü ihlal: 7 gün ban" },
          { id: "5.3.4", title: "Dördüncü ihlal: Kalıcı ban" },
          { id: "5.3.5", title: "Ağır ihlaller (RDM, VDM, hack) doğrudan kalıcı ban ile sonuçlanabilir." },
          { id: "5.3.6", title: "Ban itirazları Discord üzerinden yapılabilir." },
        ],
      },
    ],
  },
];

const Kurallar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["1"]);
  const [expandedSubCategories, setExpandedSubCategories] = useState<string[]>(["1.1"]);
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleSubCategory = (id: string) => {
    setExpandedSubCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const scrollToRule = (ruleId: string) => {
    setActiveRule(ruleId);
    const element = sectionRefs.current[ruleId];
    if (element) {
      const offsetTop = element.offsetTop - 140;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  // Filter rules based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return rulesData;

    const query = searchQuery.toLowerCase();
    
    return rulesData
      .map((category) => ({
        ...category,
        subCategories: category.subCategories
          .map((subCat) => ({
            ...subCat,
            rules: subCat.rules.filter((rule) =>
              rule.title.toLowerCase().includes(query) ||
              rule.id.toLowerCase().includes(query)
            ),
          }))
          .filter((subCat) => subCat.rules.length > 0),
      }))
      .filter((category) => category.subCategories.length > 0);
  }, [searchQuery]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const categoryIds = filteredData.map((c) => c.id);
      const subCategoryIds = filteredData.flatMap((c) =>
        c.subCategories.map((sc) => sc.id)
      );
      setExpandedCategories(categoryIds);
      setExpandedSubCategories(subCategoryIds);
    }
  }, [searchQuery, filteredData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Page Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-[50px] md:text-[70px] lg:text-[90px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold">
              <span className="text-primary">KAZE</span>-Z
            </h1>
            <h2 className="font-display text-[32px] md:text-[42px] lg:text-[52px] text-foreground leading-[0.9] tracking-tight italic uppercase font-bold mt-2">
              KURALLARI
            </h2>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <Input
                type="text"
                placeholder="Kural ara... (örn: RDM, VDM, soygun)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-secondary/30 border-border/20 text-foreground placeholder:text-foreground/40 rounded-xl text-base focus:border-primary/50 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-foreground/50 text-sm mt-2 text-center">
                {filteredData.reduce((acc, cat) => 
                  acc + cat.subCategories.reduce((acc2, sub) => acc2 + sub.rules.length, 0), 0
                )} sonuç bulundu
              </p>
            )}
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <motion.aside
              className="lg:w-80 flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="lg:sticky lg:top-28 bg-secondary/30 rounded-2xl p-4 md:p-5 border border-border/20 max-h-[70vh] overflow-y-auto">
                <h3 className="text-primary font-display text-lg italic mb-4 tracking-wide">
                  Kural Kategorileri
                </h3>
                <nav className="space-y-1">
                  {filteredData.map((category) => (
                    <div key={category.id}>
                      {/* Main Category */}
                      <motion.button
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
                          expandedCategories.includes(category.id)
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-primary/60 font-mono text-xs w-4">{category.id}.</span>
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{category.title}</span>
                      </motion.button>

                      {/* Sub Categories */}
                      <AnimatePresence>
                        {expandedCategories.includes(category.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-1 space-y-1 border-l border-border/20 pl-2">
                              {category.subCategories.map((subCat) => (
                                <div key={subCat.id}>
                                  <motion.button
                                    onClick={() => toggleSubCategory(subCat.id)}
                                    className={`w-full text-left px-2 py-2 rounded-md transition-all duration-300 text-xs flex items-center gap-1.5 ${
                                      expandedSubCategories.includes(subCat.id)
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground/60 hover:text-foreground hover:bg-secondary/40"
                                    }`}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-primary/50 font-mono text-[10px] w-6">{subCat.id}</span>
                                    {expandedSubCategories.includes(subCat.id) ? (
                                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{subCat.title}</span>
                                  </motion.button>

                                  {/* Rules */}
                                  <AnimatePresence>
                                    {expandedSubCategories.includes(subCat.id) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/10 pl-2">
                                          {subCat.rules.map((rule) => (
                                            <motion.button
                                              key={rule.id}
                                              onClick={() => scrollToRule(rule.id)}
                                              className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-all duration-200 flex items-start gap-1.5 ${
                                                activeRule === rule.id
                                                  ? "bg-primary/20 text-primary"
                                                  : "text-foreground/50 hover:text-foreground/80 hover:bg-secondary/30"
                                              }`}
                                              whileHover={{ x: 2 }}
                                            >
                                              <span className="text-primary/40 font-mono flex-shrink-0">{rule.id}</span>
                                            </motion.button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
              {filteredData.length === 0 ? (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-foreground/50 text-lg">Arama sonucu bulunamadı.</p>
                  <p className="text-foreground/30 text-sm mt-2">Farklı anahtar kelimeler deneyin.</p>
                </motion.div>
              ) : (
                filteredData.map((category) => (
                  <motion.div
                    key={category.id}
                    className="mb-10"
                    variants={itemVariants}
                  >
                    {/* Main Category Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-primary font-display text-[50px] md:text-[60px] italic leading-none opacity-30">
                        {category.id}
                      </span>
                      <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground italic tracking-wide">
                        {category.title}
                      </h3>
                    </div>

                    {/* Sub Categories */}
                    <div className="space-y-6 ml-4 md:ml-8">
                      {category.subCategories.map((subCat) => (
                        <div
                          key={subCat.id}
                          className="bg-secondary/20 rounded-2xl p-5 md:p-6 border border-border/10 hover:border-primary/20 transition-colors duration-300"
                        >
                          {/* Sub Category Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-primary/50 font-mono text-lg md:text-xl">
                              {subCat.id}
                            </span>
                            <h4 className="font-display text-lg md:text-xl lg:text-2xl text-foreground/90 italic">
                              {subCat.title}
                            </h4>
                          </div>

                          {/* Rules List */}
                          <ul className="space-y-3 ml-2 md:ml-4">
                            {subCat.rules.map((rule) => (
                              <motion.li
                                key={rule.id}
                                ref={(el) => (sectionRefs.current[rule.id] = el)}
                                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                                  activeRule === rule.id
                                    ? "bg-primary/15 border border-primary/30"
                                    : "hover:bg-secondary/30"
                                }`}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                              >
                                <span className="text-primary font-mono text-xs md:text-sm flex-shrink-0 pt-0.5 min-w-[52px]">
                                  {rule.id}
                                </span>
                                <span className="text-foreground/80 text-sm md:text-base leading-relaxed">
                                  {searchQuery ? (
                                    <HighlightText text={rule.title} query={searchQuery} />
                                  ) : (
                                    rule.title
                                  )}
                                </span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}

              {/* Footer Note */}
              <motion.div
                className="bg-primary/10 rounded-2xl p-6 md:p-8 border border-primary/20 mt-8"
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

// Helper component to highlight search matches
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-primary/30 text-primary font-medium px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export default Kurallar;
