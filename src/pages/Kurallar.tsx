import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";

interface Rule {
  id: string;
  title: string;
  description: string;
  lastUpdate?: string;
}

interface SubCategory {
  id: string;
  title: string;
  description?: string;
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
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "1.1.1", 
            title: "Saygılı Davranış", 
            description: "Tüm oyunculara saygılı davranılmalıdır. Herhangi bir oyuncuya karşı ayrımcılık, nefret söylemi veya kışkırtıcı davranışlarda bulunmak kesinlikle yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "1.1.2", 
            title: "Küfür ve Hakaret", 
            description: "Küfür, hakaret ve aşağılayıcı söylemler yasaktır. Bu kural hem oyun içi hem de Discord sunucusunda geçerlidir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "1.1.3", 
            title: "Spam Yasağı", 
            description: "Spam yapmak ve gereksiz mesajlar göndermek yasaktır. Tekrarlayan mesajlar, flood ve benzeri davranışlar cezalandırılır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "1.1.4", 
            title: "Taciz Yasağı", 
            description: "Oyun içi ve dışı her türlü taciz yasaktır. Bu durum tespit edildiğinde kalıcı ban ile sonuçlanabilir.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "1.2",
        title: "Yetki Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "1.2.1", 
            title: "Yetkililerin Kararları", 
            description: "Yetkililerin kararlarına saygı gösterilmelidir. Yetkililer sunucunun düzenini sağlamak için çalışmaktadır ve kararları nihaidir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "1.2.2", 
            title: "İtiraz Yöntemi", 
            description: "Yetkililerle tartışmak yerine ticket açılmalıdır. Oyun içinde yetkililere karşı çıkmak veya kararlarını sorgulamak yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "1.2.3", 
            title: "Karar İtirazları", 
            description: "Yetkili kararlarına itiraz Discord üzerinden yapılır. İtirazlarınızı kanıtlarla destekleyerek ticket sistemi üzerinden iletebilirsiniz.",
            lastUpdate: "10.12.2025"
          },
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
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "2.1.1", 
            title: "Karakter Kalıcılığı", 
            description: "Her zaman karakterinizde kalmalısınız (IC). Oyun içinde OOC konuşmalar minimum düzeyde tutulmalı ve gerçekten gerekli olmadıkça yapılmamalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.1.2", 
            title: "OOC İletişim", 
            description: "OOC (Out of Character) konuşmalar için belirlenen kanalları kullanın. Oyun içinde OOC bilgi paylaşımı yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.1.3", 
            title: "Powergaming Yasağı", 
            description: "Powergaming yasaktır - karşı tarafa tepki verme şansı tanıyın. Diğer oyuncuların eylemlerini zorla kontrol etmeye çalışmak veya gerçekçi olmayan yetenekler sergilemek yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.1.4", 
            title: "Metagaming Yasağı", 
            description: "Metagaming yasaktır - IC bilmediğiniz bilgileri kullanmayın. Discord, stream veya diğer OOC kaynaklardan edinilen bilgileri oyun içinde kullanmak yasaktır.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "2.2",
        title: "Saldırı Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "2.2.1", 
            title: "RDM Yasağı", 
            description: "Random Deathmatch (RDM) kesinlikle yasaktır. Herhangi bir roleplay sebebi olmadan diğer oyuncuları öldürmek veya yaralamak yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.2.2", 
            title: "VDM Yasağı", 
            description: "Vehicle Deathmatch (VDM) kesinlikle yasaktır. Araçla kasıtlı olarak diğer oyunculara çarpmak veya onları öldürmeye çalışmak yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.2.3", 
            title: "Combat Logging Yasağı", 
            description: "Combat logging (savaş sırasında çıkış) yasaktır. Aktif bir roleplay veya savaş sırasında oyundan çıkmak yasaktır ve cezalandırılır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.2.4", 
            title: "Revenge Kill Yasağı", 
            description: "Revenge Kill (intikam öldürmesi) yasaktır. Öldükten sonra sizi öldüren kişiyi bulup öldürmeye çalışmak NLR kuralını ihlal eder.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "2.3",
        title: "Karakter Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "2.3.1", 
            title: "Gerçekçi Geçmiş", 
            description: "Karakteriniz gerçekçi bir geçmişe sahip olmalıdır. Süper güçler, aşırı zenginlik veya gerçekçi olmayan yetenekler içeren hikayeler kabul edilmez.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.3.2", 
            title: "İsim Kuralları", 
            description: "Ünlü kişilerin isimlerini veya karakterlerini kullanamazsınız. Gerçek hayattaki ünlüler, film karakterleri veya diğer oyunlardan karakterler yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.3.3", 
            title: "Yaş Sınırı", 
            description: "Karakterinizin yaşı 18'den büyük olmalıdır. Çocuk karakter roleplay'i kesinlikle yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.3.4", 
            title: "Fear RP Kuralı", 
            description: "Fear RP kuralına uymalısınız - karakteriniz ölümden korkmalı. Silah doğrultulmuşken kahramanlık yapmaya çalışmak yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "2.3.5", 
            title: "New Life Rule (NLR)", 
            description: "Öldükten sonra önceki olayları hatırlayamazsınız. Ölümünüze yol açan olayları ve ilgili kişileri unutmanız gerekmektedir.",
            lastUpdate: "10.12.2025"
          },
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
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "3.1.1", 
            title: "Banka Soygunu", 
            description: "Banka soygunu için minimum 4 polis online olmalıdır. Soygun planı önceden hazırlanmalı ve gerçekçi olmalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.1.2", 
            title: "Mücevherat Soygunu", 
            description: "Mücevherat soygunu için minimum 3 polis online olmalıdır. Ekipman ve araç hazırlığı yapılmalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.1.3", 
            title: "Market Soygunu", 
            description: "Market soygunu için minimum 2 polis online olmalıdır. Küçük çaplı soygunlar için bile RP gereklidir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.1.4", 
            title: "Soygun Aralığı", 
            description: "Ardışık soygunlar arasında en az 30 dakika beklenmelidir. Bu süre soygun bitiminden itibaren hesaplanır.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "3.2",
        title: "Rehine Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "3.2.1", 
            title: "Rehine Süresi", 
            description: "Rehine alma süresi maksimum 30 dakikadır. Bu süre aşıldığında rehine serbest bırakılmalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.2.2", 
            title: "Çete Üyesi Yasağı", 
            description: "Rehine olarak kendi çete üyelerinizi kullanamazsınız. Gerçek ve gönüllü olmayan rehineler kullanılmalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.2.3", 
            title: "Rehine Hakları", 
            description: "Rehinenin gerçekçi talepleri karşılanmalıdır. Yemek, su ve temel ihtiyaçlar sağlanmalıdır.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "3.3",
        title: "Çete Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "3.3.1", 
            title: "Cop Baiting Yasağı", 
            description: "Cop baiting (polis kışkırtma) yasaktır. Kasıtlı olarak polisi kışkırtmak veya takip ettirmek yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.3.2", 
            title: "Güvenli Bölgeler", 
            description: "Güvenli bölgelerde suç işlenemez. Hastane, karakol ve diğer belirlenen alanlar güvenli bölgedir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.3.3", 
            title: "Gang Savaşları", 
            description: "Gang savaşları için yetki alınmalıdır. Büyük çaplı çatışmalar önceden yetkililere bildirilmelidir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.3.4", 
            title: "Silah Kullanımı", 
            description: "Silah kullanımı öncesi RP yapılmalıdır. Ateş açmadan önce uygun roleplay senaryosu oluşturulmalıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "3.3.5", 
            title: "Üye Limiti", 
            description: "Çete üye sayısı maksimum 15 kişidir. Bu sayının üzerindeki üyeler kabul edilmez.",
            lastUpdate: "10.12.2025"
          },
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
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "4.1.1", 
            title: "Trafik Kuralları", 
            description: "Trafik kurallarına uyulmalıdır (acil durumlar hariç). Kırmızı ışıkta durmak, hız limitlerine uymak zorunludur.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.1.2", 
            title: "Araç Parkı", 
            description: "Araç parkı belirlenen yerlere yapılmalıdır. Yol ortasında veya uygunsuz yerlerde araç bırakmak yasaktır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.1.3", 
            title: "Kasıtlı Kaza", 
            description: "Araçları kasıtlı olarak kaza yaptırmak yasaktır. Bilerek araç hasarı oluşturmak cezalandırılır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.1.4", 
            title: "Kaldırım Yasağı", 
            description: "Kaldırımda araç kullanmak yasaktır. Yaya alanlarında araç kullanmak VDM kapsamında değerlendirilir.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "4.2",
        title: "Araç Kullanım Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "4.2.1", 
            title: "Uçan Araçlar", 
            description: "Uçan araçlar için özel izin gereklidir. Helikopter ve uçak kullanımı için whitelist gerekir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.2.2", 
            title: "Araç Modifikasyonu", 
            description: "Araç modifikasyonları karakter bütçesine uygun olmalıdır. Aşırı pahalı modifikasyonlar için gelir kanıtı gerekebilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.2.3", 
            title: "Çalıntı Araçlar", 
            description: "Çalıntı araçlar 2 saat içinde terk edilmelidir. Bu süre sonunda araç spawn noktasına döner.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "4.2.4", 
            title: "Süper Araçlar", 
            description: "Süper araçlar sadece whitelisted oyunculara açıktır. Bu araçlar için başvuru yapılması gerekmektedir.",
            lastUpdate: "10.12.2025"
          },
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
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "5.1.1", 
            title: "Mikrofon Kullanımı", 
            description: "Oyun içi iletişim için mikrofon kullanılmalıdır. Text RP sadece belirli durumlarda kabul edilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.1.2", 
            title: "Push-to-Talk", 
            description: "Push-to-talk önerilir, açık mikrofon kullanılmamalıdır. Arka plan sesleri diğer oyuncuları rahatsız edebilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.1.3", 
            title: "Telsiz Mesafesi", 
            description: "Telsiz mesafesi kurallarına uyulmalıdır. Telsiz menzili dışında iletişim kurulamaz.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.1.4", 
            title: "Discord Voice", 
            description: "Discord voice chat sadece OOC iletişim içindir. Oyun içi bilgi paylaşımı için kullanılamaz.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.1.5", 
            title: "Telefon Görüşmeleri", 
            description: "Karakterler arası telefon görüşmeleri IC olarak yapılmalıdır. Gerçekçi diyaloglar kullanılmalıdır.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "5.2",
        title: "Ekonomi Kuralları",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "5.2.1", 
            title: "Para Transferleri", 
            description: "Para transferleri kayıt altına alınır. Şüpheli transferler incelemeye alınabilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.2.2", 
            title: "Gerçek Para Yasağı", 
            description: "Gerçek para ile oyun içi para alışverişi yasaktır. Bu durum kalıcı ban ile sonuçlanır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.2.3", 
            title: "Ekonomi Manipülasyonu", 
            description: "Ekonomiyi bozmaya yönelik eylemler yasaktır. Bug abuse veya exploit kullanımı cezalandırılır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.2.4", 
            title: "İş Yeri Fiyatları", 
            description: "İş yeri sahipleri fiyatları makul tutmalıdır. Aşırı fiyatlandırma yetkililer tarafından düzeltilebilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.2.5", 
            title: "Çoklu Hesap", 
            description: "Çoklu hesap ile ekonomi manipülasyonu yasaktır. Alt hesaplar tespit edildiğinde tüm hesaplar banlanır.",
            lastUpdate: "10.12.2025"
          },
        ],
      },
      {
        id: "5.3",
        title: "Ceza Sistemi",
        description: "Bu bölümdeki kurallar aşağıda listelenmiştir.",
        rules: [
          { 
            id: "5.3.1", 
            title: "İlk İhlal", 
            description: "İlk ihlal: Sözlü uyarı verilir. Bu uyarı kayıt altına alınır ve tekrarı halinde daha ağır yaptırımlar uygulanır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.3.2", 
            title: "İkinci İhlal", 
            description: "İkinci ihlal: Yazılı uyarı ve 24 saat ban uygulanır. Ban süresi boyunca sunucuya erişim engellenir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.3.3", 
            title: "Üçüncü İhlal", 
            description: "Üçüncü ihlal: 7 gün ban uygulanır. Bu süre zarfında itiraz hakkınız bulunmaktadır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.3.4", 
            title: "Dördüncü İhlal", 
            description: "Dördüncü ihlal: Kalıcı ban uygulanır. Kalıcı bandan sonra sadece özel durumlarda ban kaldırılabilir.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.3.5", 
            title: "Ağır İhlaller", 
            description: "Ağır ihlaller (RDM, VDM, hack) doğrudan kalıcı ban ile sonuçlanabilir. Bu karara itiraz hakkı sınırlıdır.",
            lastUpdate: "10.12.2025"
          },
          { 
            id: "5.3.6", 
            title: "Ban İtirazları", 
            description: "Ban itirazları Discord üzerinden yapılabilir. İtiraz süresi ban tarihinden itibaren 7 gündür.",
            lastUpdate: "10.12.2025"
          },
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
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      // Calculate position to center the element on screen
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = window.pageYOffset + elementRect.top;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      window.scrollTo({ top: middle, behavior: "smooth" });
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
              rule.description.toLowerCase().includes(query) ||
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

                                  {/* Rules in Sidebar */}
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
                                              <span className="truncate">{rule.title}</span>
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
                    className="mb-12"
                    variants={itemVariants}
                  >
                    {/* Main Category Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-primary font-display text-[50px] md:text-[60px] italic leading-none opacity-30">
                        {category.id}
                      </span>
                      <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground italic tracking-wide">
                        {category.title}
                      </h3>
                    </div>

                    {/* Sub Categories */}
                    <div className="space-y-10">
                      {category.subCategories.map((subCat) => (
                        <div key={subCat.id} className="ml-4 md:ml-8">
                          {/* Sub Category Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-secondary/50 border border-border/30 text-foreground/70 font-mono text-sm px-3 py-1 rounded-md">
                              {subCat.id}
                            </span>
                            <h4 className="font-display text-xl md:text-2xl lg:text-3xl text-primary italic">
                              {category.id}. {subCat.title}
                            </h4>
                          </div>
                          {subCat.description && (
                            <p className="text-foreground/50 text-sm mb-6 ml-1">
                              {subCat.description}
                            </p>
                          )}

                          {/* Rules Cards */}
                          <div className="space-y-4">
                            {subCat.rules.map((rule) => (
                              <motion.div
                                key={rule.id}
                                ref={(el) => (sectionRefs.current[rule.id] = el)}
                                className="relative"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                              >
                                {/* Animated Glow Background */}
                                <AnimatePresence>
                                  {activeRule === rule.id && (
                                    <motion.div
                                      className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-lg"
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ 
                                        opacity: [0.5, 0.8, 0.5], 
                                        scale: 1,
                                      }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ 
                                        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                        scale: { duration: 0.3 }
                                      }}
                                    />
                                  )}
                                </AnimatePresence>

                                {/* Animated Border Glow */}
                                <AnimatePresence>
                                  {activeRule === rule.id && (
                                    <motion.div
                                      className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary via-primary/60 to-primary"
                                      initial={{ opacity: 0 }}
                                      animate={{ 
                                        opacity: [0.6, 1, 0.6],
                                        rotate: [0, 1, 0, -1, 0]
                                      }}
                                      exit={{ opacity: 0 }}
                                      transition={{ 
                                        opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                                        rotate: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                                      }}
                                    />
                                  )}
                                </AnimatePresence>

                                {/* Card Content */}
                                <motion.div
                                  className={`relative bg-secondary/30 rounded-2xl p-5 md:p-6 border transition-all duration-300 ${
                                    activeRule === rule.id
                                      ? "border-primary/70 bg-secondary/50"
                                      : "border-border/20 hover:border-primary/30"
                                  }`}
                                  animate={activeRule === rule.id ? { 
                                    scale: [1, 1.01, 1],
                                  } : {}}
                                  transition={{ 
                                    scale: { duration: 0.6, repeat: activeRule === rule.id ? Infinity : 0, ease: "easeInOut" }
                                  }}
                                >
                                  {/* Rule Header */}
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all duration-300 ${
                                      activeRule === rule.id 
                                        ? "bg-primary/30 border border-primary/50 text-primary" 
                                        : "bg-secondary/60 border border-border/40 text-foreground/60"
                                    }`}>
                                      {rule.id}
                                    </span>
                                    <h5 className="font-display text-lg md:text-xl text-primary italic">
                                      {searchQuery ? (
                                        <HighlightText text={rule.title} query={searchQuery} />
                                      ) : (
                                        rule.title
                                      )}
                                    </h5>
                                  </div>

                                  {/* Rule Description with bullet point */}
                                  <div className="flex items-start gap-3 ml-1">
                                    <motion.span 
                                      className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0"
                                      animate={activeRule === rule.id ? {
                                        scale: [1, 1.3, 1],
                                        opacity: [0.6, 1, 0.6]
                                      } : {}}
                                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <p className="text-foreground/80 text-sm md:text-base leading-relaxed">
                                      {searchQuery ? (
                                        <HighlightText text={rule.description} query={searchQuery} />
                                      ) : (
                                        rule.description
                                      )}
                                    </p>
                                  </div>

                                  {/* Last Update */}
                                  {rule.lastUpdate && (
                                    <div className="flex justify-end mt-4">
                                      <span className="text-foreground/30 text-xs font-mono">
                                        Son güncelleme: {rule.lastUpdate}
                                      </span>
                                    </div>
                                  )}
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>
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
