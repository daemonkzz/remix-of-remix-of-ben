import React from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText } from "lucide-react";

interface CategoryDefinitionBoxProps {
  categoryId: string;
  title: string;
  description?: string;
  subCategoryCount: number;
  ruleCount: number;
}

// Category definition descriptions
const categoryDefinitions: Record<string, string> = {
  "1": "Kaze-Z topluluğunun temel ilkeleri, yaptırım çerçevesi ve genel davranış kurallarını içerir. Discord ve oyun içi tüm alanlarda geçerlidir.",
  "2": "Oyun içi roleplay kuralları, karakter davranışları, çatışma mekanikleri ve rol bütünlüğünü korumaya yönelik düzenlemeleri kapsar.",
  "1.1": "Sunucuya katılım koşulları, kural hiyerarşisi ve yaptırım türlerini tanımlar.",
  "1.2": "Topluluk içi saygı, iletişim ve davranış standartlarını belirler.",
  "1.3": "Karakter içi (IC) ve karakter dışı (OOC) ayrımının önemini ve kurallarını açıklar.",
  "1.4": "Discord mesaj düzeni, etiket kullanımı ve iletişim protokollerini düzenler.",
  "1.5": "Reklam, paylaşım ve içerik standartlarını belirler.",
  "1.6": "Ticket sistemi ve yetkili iletişim kurallarını tanımlar.",
  "1.7": "Kişisel veri koruma ve gizlilik politikasını açıklar.",
  "1.8": "Yaptırım süreçleri ve son hükümler.",
  "2.1": "Oyun içi IC/OOC sohbet kullanım kuralları.",
  "2.2": "Powergaming tanımı ve yasakları.",
  "2.3": "Metagaming tanımı ve yasakları.",
  "2.4": "Fear RP ve NVL (Hayatın Değeri) kuralları.",
  "2.5": "Combat logging kuralları.",
  "2.6": "RDM ve VDM kuralları.",
  "2.7": "Karakter ölümü ve CK kuralları.",
};

export const CategoryDefinitionBox: React.FC<CategoryDefinitionBoxProps> = ({
  categoryId,
  title,
  description,
  subCategoryCount,
  ruleCount,
}) => {
  const definitionText = categoryDefinitions[categoryId] || description;
  
  if (!definitionText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 md:p-5 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20 rounded-xl"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground/70 text-sm leading-relaxed">
            {definitionText}
          </p>
          <div className="flex items-center gap-4 mt-3">
            {subCategoryCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                <FileText className="w-3.5 h-3.5" />
                <span>{subCategoryCount} alt kategori</span>
              </div>
            )}
            {ruleCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <span>{ruleCount} kural</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryDefinitionBox;
