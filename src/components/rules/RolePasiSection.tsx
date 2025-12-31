import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Scroll, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface RolePasiRule {
  id: string;
  title: string;
  description: string;
}

interface RolePasiSubCategory {
  id: string;
  title: string;
  description?: string;
  rules: RolePasiRule[];
}

interface RolePasiSectionProps {
  searchQuery: string;
  expandedSubCategories: string[];
  activeRule: string | null;
  onToggleSubCategory: (id: string) => void;
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  setActiveRule: (id: string | null) => void;
}

// Static Rol Pası data (can be moved to DB later)
const ROL_PASI_DATA: RolePasiSubCategory[] = [
  {
    id: "4.1",
    title: "Tema Rolleri",
    description: "Kaze-Z evreninde tema rolleri, hikaye odaklı özel karakterlerdir.",
    rules: [
      {
        id: "4.1.1",
        title: "Rol Sorumluluğu",
        description: "Tema rolü alan her oyuncu, karakterinin hikayesini ve gelişimini aktif olarak sürdürmekle yükümlüdür. Tema rolleri pasif bırakılamaz veya uzun süre aktif olmadan tutulmaz. Rol pası başvurusu yapan oyuncular, karakterlerinin hikayesini detaylı şekilde sunmalı ve evrenle uyumunu göstermelidir.",
      },
      {
        id: "4.1.2",
        title: "Hikaye Tutarlılığı",
        description: "Tema rolleri, Kaze-Z evreninin lore'una ve atmosferine uygun olmalıdır. Fantastik, bilim-kurgu veya evren dışı unsurlar içeremez. Karakterin geçmişi, motivasyonu ve hedefleri açıkça tanımlanmış olmalıdır.",
      },
      {
        id: "4.1.3",
        title: "Rol Pası Şablonu",
        description: "Tema rolü başvurusu yaparken aşağıdaki bilgiler sağlanmalıdır:\n\n• Karakter Adı ve Yaşı\n• Fiziksel Özellikler\n• Karakter Geçmişi (en az 500 kelime)\n• Motivasyon ve Hedefler\n• Güçlü ve Zayıf Yönler\n• Evrenle Bağlantı\n• Örnek RP Senaryosu",
      },
    ],
  },
  {
    id: "4.2",
    title: "Özel Roller",
    description: "Fraksiyon liderleri ve kritik hikaye karakterleri için kurallar.",
    rules: [
      {
        id: "4.2.1",
        title: "Liderlik Rolleri",
        description: "Fraksiyon liderleri veya yönetici pozisyonundaki karakterler, topluluğa karşı ek sorumluluklar taşır. Bu roller, aktif katılım ve düzenli etkinlik gerektirmektedir. Uzun süreli pasiflik, rolün kaybedilmesine neden olabilir.",
      },
      {
        id: "4.2.2",
        title: "Hikaye Karakterleri",
        description: "Ana hikayeye dahil olan özel karakterler, yönetim tarafından belirlenir ve onaylanır. Bu karakterler, evrenin gelişimine katkı sağlamalı ve topluluk etkinliklerinde aktif rol almalıdır.",
      },
      {
        id: "4.2.3",
        title: "Mentor ve Eğitici Roller",
        description: "Yeni oyunculara rehberlik eden mentor karakterler, rol yapma standartlarını temsil etmelidir. Mentorlar, kurallara tam uyum sağlamalı ve örnek davranış sergilemelidir.",
      },
    ],
  },
  {
    id: "4.3",
    title: "Başvuru Süreci",
    description: "Rol pası başvuru ve onay prosedürleri.",
    rules: [
      {
        id: "4.3.1",
        title: "Başvuru Koşulları",
        description: "Rol pası başvurusu yapabilmek için:\n\n• En az 30 gün aktif oyun süresi\n• Temiz sicil (son 60 günde yaptırım yok)\n• Mevcut ana karakterde tutarlı RP geçmişi\n• Discord sunucusunda aktif üyelik",
      },
      {
        id: "4.3.2",
        title: "Değerlendirme Kriterleri",
        description: "Başvurular şu kriterlere göre değerlendirilir:\n\n• Hikaye kalitesi ve özgünlük\n• Evren uyumu\n• Yazım ve anlatım becerisi\n• Geçmiş RP performansı\n• Topluluk katkısı",
      },
      {
        id: "4.3.3",
        title: "Onay ve Red",
        description: "Başvurular yönetim tarafından 7 iş günü içinde değerlendirilir. Onaylanan başvurular için karakter oluşturma süreci başlar. Reddedilen başvurular için geri bildirim sağlanır ve 14 gün sonra yeniden başvuru yapılabilir.",
      },
    ],
  },
];

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query?.trim()) return <>{text}</>;
  
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

export const RolePasiSection: React.FC<RolePasiSectionProps> = ({
  searchQuery,
  expandedSubCategories,
  activeRule,
  onToggleSubCategory,
  sectionRefs,
  setActiveRule,
}) => {
  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return ROL_PASI_DATA;

    const query = searchQuery.toLowerCase();
    return ROL_PASI_DATA.map((subCat) => ({
      ...subCat,
      rules: subCat.rules.filter(
        (rule) =>
          rule.title.toLowerCase().includes(query) ||
          rule.description.toLowerCase().includes(query) ||
          rule.id.toLowerCase().includes(query)
      ),
    })).filter((subCat) => subCat.rules.length > 0);
  }, [searchQuery]);

  if (searchQuery && filteredData.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main Category Header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-violet-400 font-display text-[50px] md:text-[60px] italic leading-none opacity-30">
          4
        </span>
        <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground italic tracking-wide">
          Rol Pası Kuralları
        </h3>
      </div>

      {/* Category Definition Box - Special styling */}
      <div className="mb-8 p-4 md:p-5 rounded-xl bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-transparent border border-violet-500/30 relative overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute top-2 right-4 opacity-20">
          <Sparkles className="w-8 h-8 text-violet-400" />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Scroll className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="text-violet-400 font-display text-lg italic mb-1">
              Hikaye Odaklı Roller
            </h4>
            <p className="text-foreground/60 text-sm">
              Kaze-Z evreninde özel tema rolleri, fraksiyon liderleri ve hikaye karakterleri için kurallar. 
              Bu bölüm, rol pası başvurularını ve özel karakterlerin sorumluluklarını kapsar.
            </p>
          </div>
        </div>
      </div>

      {/* Sub Categories */}
      <div className="space-y-10">
        {filteredData.map((subCat) => {
          const isExpanded = expandedSubCategories.includes(subCat.id);

          return (
            <div key={subCat.id} className="ml-4 md:ml-8">
              {/* Sub Category Header */}
              <motion.button
                onClick={() => onToggleSubCategory(subCat.id)}
                className="flex items-center gap-3 mb-3 w-full text-left group"
                whileTap={{ scale: 0.98 }}
              >
                <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 font-mono text-sm px-3 py-1 rounded-md">
                  {subCat.id}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-violet-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-foreground/50 group-hover:text-violet-400 transition-colors" />
                )}
                <h4 className="font-display text-xl md:text-2xl lg:text-3xl text-violet-400 italic group-hover:text-violet-300 transition-colors">
                  4. {subCat.title}
                </h4>
              </motion.button>

              {subCat.description && (
                <p className="text-foreground/50 text-sm mb-6 ml-1">
                  {subCat.description}
                </p>
              )}

              {/* Rules Cards */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-2">
                      {subCat.rules.map((rule) => (
                        <motion.div
                          key={rule.id}
                          ref={(el) => {
                            sectionRefs.current[rule.id] = el;
                          }}
                          className="relative overflow-hidden rounded-2xl"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                        >
                          {/* Sweep Glow Effect */}
                          <AnimatePresence mode="wait">
                            {activeRule === rule.id && (
                              <motion.div
                                key={`glow-${rule.id}`}
                                className="absolute inset-0 rounded-2xl pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <motion.div
                                  className="absolute top-0 left-0 w-full h-full"
                                  initial={{ x: "-100%" }}
                                  animate={{ x: "200%" }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                >
                                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent blur-md" />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Card Content */}
                          <motion.div
                            className={cn(
                              "relative rounded-2xl p-5 md:p-6 border transition-all duration-500",
                              "bg-gradient-to-br from-violet-500/10 via-secondary/30 to-indigo-500/5",
                              activeRule === rule.id
                                ? "border-violet-500/60 shadow-[0_0_20px_-5px_hsl(263_70%_50%/0.4)]"
                                : "border-violet-500/20 hover:border-violet-500/40"
                            )}
                            animate={activeRule === rule.id ? { scale: [1, 1.005, 1] } : { scale: 1 }}
                            transition={{ scale: { duration: 0.3, ease: "easeOut" } }}
                          >
                            {/* Rule Header */}
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                              <span
                                className={cn(
                                  "font-mono text-xs px-2.5 py-1 rounded-md transition-all duration-300",
                                  activeRule === rule.id
                                    ? "bg-violet-500/30 border border-violet-500/50 text-violet-300"
                                    : "bg-violet-500/20 border border-violet-500/30 text-violet-400"
                                )}
                              >
                                {rule.id}
                              </span>
                              <h5 className="font-display text-lg md:text-xl text-violet-400 italic">
                                {searchQuery ? (
                                  <HighlightText text={rule.title} query={searchQuery} />
                                ) : (
                                  rule.title
                                )}
                              </h5>
                            </div>

                            {/* Rule Description */}
                            <div className="ml-1">
                              <p className="text-foreground/70 text-sm md:text-base leading-relaxed whitespace-pre-line">
                                {searchQuery ? (
                                  <HighlightText text={rule.description} query={searchQuery} />
                                ) : (
                                  rule.description
                                )}
                              </p>
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RolePasiSection;
