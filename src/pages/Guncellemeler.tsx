import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Category = "all" | "update" | "news";

interface UpdateItem {
  id: number;
  title: string;
  category: "update" | "news";
  version?: string;
  date: string;
  image?: string;
}

const updates: UpdateItem[] = [
  {
    id: 1,
    title: "Yeni Sezon Başlangıcı - Büyük Güncelleme",
    category: "update",
    version: "v2.1.0",
    date: "23-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 2,
    title: "Kış Etkinliği Başladı! Özel Ödüller Sizi Bekliyor",
    category: "news",
    date: "21-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 3,
    title: "Sunucu Bakım Duyurusu",
    category: "update",
    version: "v2.0.5",
    date: "20-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 4,
    title: "Yeni Harita Eklendi: Kayıp Vadi",
    category: "news",
    date: "16-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 5,
    title: "Performans İyileştirmeleri ve Hata Düzeltmeleri",
    category: "update",
    version: "v2.0.4",
    date: "10-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 6,
    title: "Topluluk Turnuvası Duyurusu",
    category: "news",
    date: "09-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 7,
    title: "Yeni Karakter Sınıfı: Büyücü",
    category: "update",
    version: "v2.0.3",
    date: "05-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
  {
    id: 8,
    title: "Hafta Sonu Özel Etkinliği",
    category: "news",
    date: "01-12",
    image: "/lovable-uploads/dd368db9-058d-4606-b265-f0f7a4014bb6.jpg",
  },
];

const ITEMS_PER_PAGE = 6;

const Guncellemeler = () => {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUpdates = updates.filter((item) => {
    if (activeFilter === "all") return true;
    return item.category === activeFilter;
  });

  const totalPages = Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE);
  const paginatedUpdates = filteredUpdates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (filter: Category) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const filters: { key: Category; label: string }[] = [
    { key: "all", label: "Son" },
    { key: "update", label: "Güncellemeler" },
    { key: "news", label: "Haberler" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
          }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.03) 0%, transparent 60%)",
          }}
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, delay: 5 }}
        />
      </div>
      
      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight italic"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              GÜNCELLEMELER
            </motion.h1>
            <motion.div
              className="h-1 w-40 bg-primary mt-4"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </div>

          {/* Filter Tabs */}
          <motion.div
            className="flex items-center gap-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                className={`relative text-sm tracking-wider uppercase transition-colors ${
                  activeFilter === filter.key
                    ? "text-primary"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {activeFilter === filter.key && (
                  <motion.span
                    layoutId="activeFilter"
                    className="absolute -left-3 -right-3 -top-1.5 -bottom-1.5 border border-primary"
                    style={{ borderRadius: 2 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {filter.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Updates Grid - Larger cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AnimatePresence mode="popLayout">
            {paginatedUpdates.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/[0.06] cursor-pointer"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                {/* Hover glow effect */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
                  }}
                />
                
                {/* Image - Square aspect */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary/50 to-secondary/20" />
                  )}
                  
                  {/* Shimmer effect on hover */}
                  <motion.div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                  
                  {/* Version badge - top left */}
                  {item.version && (
                    <motion.div 
                      className="absolute top-4 left-4 bg-primary/90 text-background text-xs font-bold px-3 py-1.5 rounded-full"
                      whileHover={{ scale: 1.1 }}
                    >
                      {item.version}
                    </motion.div>
                  )}

                  {/* Category badge - top right */}
                  <div className="absolute top-4 right-4 text-[10px] uppercase tracking-wider px-2.5 py-1 bg-background/80 backdrop-blur-sm text-primary border border-primary/30">
                    {item.category === "update" ? "Güncelleme" : "Haber"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 lg:p-6">
                  {/* Title - Big and prominent */}
                  <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 italic leading-tight mb-4">
                    {item.title}
                  </h3>

                  {/* Footer with date */}
                  <div className="flex items-center justify-between">
                    <motion.button
                      className="text-primary text-sm font-medium flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      Devamını Oku
                      <motion.svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </motion.svg>
                    </motion.button>
                    
                    <span className="text-sm text-foreground/40">{item.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-10 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 text-sm uppercase tracking-wider text-foreground/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex items-center gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-2 transition-all duration-300 ${
                    currentPage === page
                      ? "bg-primary w-8"
                      : "bg-foreground/20 w-2 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 text-sm uppercase tracking-wider text-foreground/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Guncellemeler;
