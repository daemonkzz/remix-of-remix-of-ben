import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Map, BookOpen, Info, ChevronUp, Sparkles, Maximize2, RefreshCw, Loader2, X, Wifi, WifiOff, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useWhiteboardViewer } from "@/hooks/useWhiteboardViewer";
import { useAuth } from "@/contexts/AuthContext";
import OnlineUsersBar from "@/components/OnlineUsersBar";

const storyContent = [
  {
    id: "giris",
    title: "GİRİŞ",
    content: `Buraya hikayenin giriş bölümü gelecek. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
  },
  {
    id: "bolum-1",
    title: "BÖLÜM 1: BAŞLANGIÇ",
    content: `Buraya birinci bölüm gelecek. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`
  },
  {
    id: "bolum-2",
    title: "BÖLÜM 2: YOLCULUK",
    content: `Buraya ikinci bölüm gelecek. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`
  },
  {
    id: "bolum-3",
    title: "BÖLÜM 3: KEŞİF",
    content: `Buraya üçüncü bölüm gelecek. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`
  },
  {
    id: "son",
    title: "SON",
    content: `Buraya hikayenin son bölümü gelecek. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`
  }
];

// Floating particles generator
const generateFloatingParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5
  }));
};

const Hikaye = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"hikaye-tablosu" | "hikaye">("hikaye");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("giris");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const particles = useMemo(() => generateFloatingParticles(20), []);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollLockRef = useRef<null | {
    scrollY: number;
    htmlOverflow: string;
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyWidth: string;
  }>(null);
  // Whiteboard viewer hook
  const {
    imageUrl,
    isLoading: isMapLoading,
    isConnected,
    elementCount,
    fileCount,
    refresh: refreshMap,
  } = useWhiteboardViewer({ whiteboardName: 'Ana Harita' });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMap();
    setIsRefreshing(false);
  };

  // Pan & Zoom handlers
  const applyWheelDelta = useCallback((deltaY: number) => {
    const delta = deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => Math.max(0.3, Math.min(5, prev + delta)));
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      applyWheelDelta(e.deltaY);
    },
    [applyWheelDelta]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(5, prev + 0.3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.3, prev - 0.3));
  }, []);

  // Attach wheel listener to the map container (non-fullscreen)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || activeTab !== "hikaye-tablosu" || isFullscreen) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel, activeTab, isFullscreen]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Prevent page scroll/bounce when fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const html = document.documentElement;
    const body = document.body;

    const scrollY = window.scrollY;

    scrollLockRef.current = {
      scrollY,
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      const prev = scrollLockRef.current;
      if (!prev) return;

      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;

      window.scrollTo(0, prev.scrollY);
      scrollLockRef.current = null;
    };
  }, [isFullscreen]);

  // In fullscreen, globally prevent scroll/bounce and use wheel to zoom (even over controls)
  useEffect(() => {
    if (!isFullscreen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      applyWheelDelta(e.deltaY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", onTouchMove, true);
    };
  }, [isFullscreen, applyWheelDelta]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      if (activeTab === "hikaye") {
        setScrollProgress(progress);
      }
      setShowScrollTop(scrollTop > 300);

      // Find active section
      storyContent.forEach((section) => {
        const element = document.querySelector(`[data-section="${section.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Fullscreen Map */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            key="fullscreen-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background overscroll-none touch-none"
          >
            {/* Floating particles in fullscreen too */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particles.slice(0, 10).map((particle) => (
                <motion.div
                  key={`fs-${particle.id}`}
                  className="absolute rounded-full bg-primary/20"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                  }}
                  animate={{
                    y: [0, -80, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Hero gradient */}
            <div className="absolute inset-0 hero-gradient pointer-events-none" />

            {/* Control buttons - top right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full border border-border/30">
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">{elementCount} öğe</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-9 h-9 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="w-9 h-9 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom controls - bottom right */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="w-9 h-9 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full border border-border/30 text-xs text-muted-foreground min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="w-9 h-9 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetView}
                className="w-9 h-9 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Map content with pan/zoom */}
            <div
              ref={fullscreenContainerRef}
              className="absolute inset-0 overflow-hidden overscroll-none touch-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="absolute inset-0 flex items-center justify-center will-change-transform"
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 100ms ease-out',
                }}
              >
                {isMapLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Harita yükleniyor...</p>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Hikaye Tablosu"
                    className="max-w-none select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Map className="w-16 h-16 opacity-30" />
                    <p className="text-sm">Harita boş</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 0.5, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Hero gradient background */}
      <div className="fixed inset-0 hero-gradient pointer-events-none z-[0]" />
      
      {/* Animated light rays */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        <motion.div 
          className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
          animate={{ opacity: [0.2, 0.4, 0.2], x: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
          animate={{ opacity: [0.15, 0.35, 0.15], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>
      
      <Header />
      
      {/* Progress Bar */}
      {activeTab === "hikaye" && (
        <motion.div 
          className="fixed top-0 left-0 right-0 h-[2px] bg-secondary/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/70"
            style={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      )}

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && !isFullscreen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform group"
            whileHover={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.6)" }}
          >
            <ChevronUp className="w-5 h-5 group-hover:animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <motion.div 
          className="container mx-auto px-4 md:px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Page Title */}
          <motion.div variants={itemVariants} className="text-center mb-14">
            <motion.div 
              className="inline-flex items-center gap-2 mb-4"
              animate={{ 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs tracking-[0.4em] uppercase font-medium">
                Keşfet
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            
            <h1 className="font-display text-6xl md:text-8xl lg:text-[120px] text-foreground leading-[0.9] tracking-tight italic uppercase">
              <motion.span 
                className="text-primary inline-block"
                animate={{
                  textShadow: [
                    "0 0 20px hsl(var(--primary) / 0.4)",
                    "0 0 40px hsl(var(--primary) / 0.7)",
                    "0 0 20px hsl(var(--primary) / 0.4)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                HİKAYE
              </motion.span>
              <span className="text-foreground/30 mx-2">&</span>
              <span className="text-foreground">EVREN</span>
            </h1>
            
            <motion.div 
              className="w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6 mb-5"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            
            <p className="text-muted-foreground max-w-md mx-auto text-sm italic">
              Sunucumuzun derin hikayesini ve evrenini keşfedin
            </p>
          </motion.div>

          {/* Tab Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center items-center gap-3 md:gap-4 mb-14"
          >
            {/* Hikaye Tablosu Info */}
            <AnimatePresence mode="wait">
              {activeTab === "hikaye-tablosu" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <HoverCard openDelay={0} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <motion.button 
                        className="w-9 h-9 rounded-full border border-border/60 bg-[#1a1a1a] flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
                        whileHover={{ scale: 1.1, boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </motion.button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="bottom" 
                      className="w-72 bg-[#1a1a1a] border border-border/60 p-4 shadow-xl"
                    >
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        Sunucumuzun hikaye tablosu - olayların ve karakterlerin görsel haritası.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hikaye Tablosu Button */}
            <motion.button
              onClick={() => setActiveTab("hikaye-tablosu")}
              className={`relative flex items-center gap-2.5 px-5 md:px-7 py-3 font-display text-sm tracking-wider transition-all duration-300 rounded-sm overflow-hidden group ${
                activeTab === "hikaye-tablosu"
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#1a1a1a] text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {activeTab === "hikaye-tablosu" && (
                <>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    animate={{ boxShadow: ["0 0 20px hsl(var(--primary) / 0.4)", "0 0 35px hsl(var(--primary) / 0.6)", "0 0 20px hsl(var(--primary) / 0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </>
              )}
              <Map className="w-4 h-4 relative z-10" />
              <span className="relative z-10">HİKAYE TABLOSU</span>
            </motion.button>

            <div className="w-px h-7 bg-border/40" />

            {/* Hikaye Button */}
            <motion.button
              onClick={() => setActiveTab("hikaye")}
              className={`relative flex items-center gap-2.5 px-5 md:px-7 py-3 font-display text-sm tracking-wider transition-all duration-300 rounded-sm overflow-hidden group ${
                activeTab === "hikaye"
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#1a1a1a] text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {activeTab === "hikaye" && (
                <>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    animate={{ boxShadow: ["0 0 20px hsl(var(--primary) / 0.4)", "0 0 35px hsl(var(--primary) / 0.6)", "0 0 20px hsl(var(--primary) / 0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </>
              )}
              <BookOpen className="w-4 h-4 relative z-10" />
              <span className="relative z-10">HİKAYE</span>
            </motion.button>

            {/* Hikaye Info */}
            <AnimatePresence mode="wait">
              {activeTab === "hikaye" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <HoverCard openDelay={0} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <motion.button 
                        className="w-9 h-9 rounded-full border border-border/60 bg-[#1a1a1a] flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
                        whileHover={{ scale: 1.1, boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </motion.button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="bottom" 
                      className="w-72 bg-[#1a1a1a] border border-border/60 p-4 shadow-xl"
                    >
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        Hikaye bilgi metni buraya gelecek.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Online Users Bar - only on Hikaye Tablosu tab when logged in */}
          <AnimatePresence>
            {user && activeTab === "hikaye-tablosu" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <OnlineUsersBar maxVisible={10} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-14" />

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "hikaye-tablosu" && (
              <motion.div
                key="hikaye-tablosu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative -mx-4 md:-mx-6"
              >
                {/* Seamless map container - full width, no borders */}
                <div
                  ref={mapContainerRef}
                  className="w-full h-[calc(100vh-320px)] min-h-[500px] relative overflow-hidden cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Map image with pan/zoom */}
                  <div
                    className="absolute inset-0 flex items-center justify-center will-change-transform"
                    style={{
                      transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                      transition: isDragging ? 'none' : 'transform 100ms ease-out',
                    }}
                  >
                    {isMapLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm">Harita yükleniyor...</p>
                      </div>
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Hikaye Tablosu"
                        className="max-w-none select-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="text-center">
                        <motion.div
                          animate={{ 
                            opacity: [0.3, 0.5, 0.3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Map className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-muted-foreground/60 text-sm">
                          Harita boş
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Control buttons - top right */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full border border-border/30">
                      {isConnected ? (
                        <Wifi className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {elementCount} öğe
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="w-8 h-8 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFullscreen(true)}
                      className="w-8 h-8 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Zoom controls - bottom right */}
                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={zoomOut}
                      className="w-8 h-8 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <div className="px-3 py-1 bg-background/60 backdrop-blur-sm rounded-full border border-border/30 text-xs text-muted-foreground min-w-[50px] text-center">
                      {Math.round(scale * 100)}%
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={zoomIn}
                      className="w-8 h-8 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetView}
                      className="w-8 h-8 bg-background/60 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Usage hint - bottom left */}
                  <div className="absolute bottom-4 left-4 z-10">
                    <p className="text-xs text-muted-foreground/50">
                      Sürükle: gezin • Scroll: yakınlaştır
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "hikaye" && (
              <motion.div
                key="hikaye"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center gap-10"
              >
                {/* İçindekiler - Sticky Sol Taraf */}
                <aside className="hidden lg:block w-52 shrink-0">
                  <div className="sticky top-32">
                    <div className="bg-[#1a1a1a] border border-border/30 rounded-lg p-5">
                      <h3 className="text-[10px] text-primary tracking-[0.25em] uppercase mb-5 font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        İÇİNDEKİLER
                      </h3>
                      <nav className="space-y-1">
                        {storyContent.map((section, index) => (
                          <motion.button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`block w-full text-left px-3 py-2.5 text-[11px] tracking-wide transition-all duration-300 rounded-md border-l-2 ${
                              activeSection === section.id
                                ? "border-primary text-primary bg-primary/10"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                            }`}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.08 }}
                            whileHover={{ x: 4 }}
                          >
                            {section.title}
                          </motion.button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </aside>

                {/* Story Content - Glass Effect */}
                <div className="w-full max-w-4xl">
                  <motion.div 
                    className="relative bg-[#0d0d0d]/60 backdrop-blur-xl border border-border/20 rounded-lg p-8 md:p-12 lg:p-16 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/20 rounded-br-lg" />
                    
                    {/* Gradient overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, hsl(var(--primary) / 0.02) 0%, transparent 30%, transparent 70%, hsl(var(--primary) / 0.02) 100%)",
                      }}
                    />

                    {storyContent.map((section, index) => (
                      <motion.section
                        key={section.id}
                        data-section={section.id}
                        className={`relative mb-20 last:mb-0 ${index !== 0 ? "pt-16" : ""}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.12 }}
                      >
                        {index !== 0 && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        )}
                        
                        <div className="flex items-center gap-4 mb-6">
                          <motion.span 
                            className="text-[10px] text-primary/60 tracking-[0.3em] uppercase"
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </motion.span>
                          <div className="w-8 h-px bg-primary/30" />
                        </div>
                        
                        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-8 tracking-wide italic">
                          {section.title}
                        </h2>
                        
                        <p className="text-muted-foreground leading-[1.9] text-sm md:text-base max-w-2xl">
                          {section.content}
                        </p>
                      </motion.section>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Hikaye;
