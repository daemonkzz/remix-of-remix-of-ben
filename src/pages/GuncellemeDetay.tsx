import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Calendar, Tag, User, Loader2, X, ZoomIn } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import type { UpdateData, ContentBlock, UpdateCategory } from "@/types/update";

const GuncellemeDetay = () => {
  const { id } = useParams();
  const [activeSection, setActiveSection] = useState<string>("");
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const [update, setUpdate] = useState<UpdateData | null>(null);
  const [otherUpdates, setOtherUpdates] = useState<UpdateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authorName, setAuthorName] = useState("Yönetici");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUpdate(id);
      fetchOtherUpdates(id);
    }
  }, [id]);

  const fetchUpdate = async (updateId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("id", updateId)
        .eq("is_published", true)
        .single();

      if (error) {
        console.error("Fetch update error:", error);
        setUpdate(null);
        return;
      }

      setUpdate({
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        category: data.category as UpdateCategory,
        version: data.version || undefined,
        cover_image_url: data.cover_image_url || undefined,
        content: (data.content as ContentBlock[]) || [],
        is_published: data.is_published,
        author_id: data.author_id || undefined,
        published_at: data.published_at || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      // Fetch author name
      if (data.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.author_id)
          .single();
        if (profile?.username) {
          setAuthorName(profile.username);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOtherUpdates = async (currentId: string) => {
    try {
      const { data, error } = await supabase
        .from("updates")
        .select("id, title, category, version, published_at, cover_image_url")
        .eq("is_published", true)
        .neq("id", currentId)
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Fetch other updates error:", error);
        return;
      }

      setOtherUpdates(
        (data || []).map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category as UpdateCategory,
          version: d.version || undefined,
          cover_image_url: d.cover_image_url || undefined,
          content: [],
          is_published: true,
          published_at: d.published_at || undefined,
        }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // Get only heading sections for navigation
  const headingSections = update?.content.filter((s) => s.type === "heading") || [];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300;

      for (const section of headingSections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight + 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headingSections]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 150;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  };

  const renderFormattedText = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, "<em>$1</em>");
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>'
    );
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
        const headingClasses: Record<number, string> = {
          1: "font-display text-2xl md:text-3xl font-bold text-foreground italic mt-8 mb-4 first:mt-0",
          2: "font-display text-xl md:text-2xl font-bold text-foreground italic mt-8 mb-4",
          3: "font-display text-lg md:text-xl font-bold text-foreground italic mt-6 mb-3",
        };
        return (
          <HeadingTag className={headingClasses[block.level || 1]}>
            {block.content as string}
          </HeadingTag>
        );

      case "subheading":
        return (
          <h3 className="font-display text-xl font-semibold text-primary italic mt-6 mb-3">
            {block.content as string}
          </h3>
        );

      case "paragraph":
        return (
          <p className="text-foreground/70 leading-relaxed mb-4">
            {renderFormattedText(block.content as string)}
          </p>
        );

      case "list":
        return (
          <ul className="space-y-3 mb-6">
            {(block.content as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>{renderFormattedText(item)}</span>
              </li>
            ))}
          </ul>
        );

      case "image":
        return (
          <div 
            className="my-6 rounded-lg overflow-hidden border border-border/30 cursor-pointer group relative"
            onClick={() => setLightboxImage(block.content as string)}
          >
            <img src={block.content as string} alt="" className="w-full transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case "code":
        return (
          <pre className="my-6 p-4 bg-muted rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-foreground/80">{block.content as string}</code>
          </pre>
        );

      case "quote":
        return (
          <blockquote className="my-6 pl-4 border-l-4 border-primary italic text-foreground/70">
            {block.content as string}
          </blockquote>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!update) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Güncelleme Bulunamadı</h1>
          <Link to="/guncellemeler" className="text-primary hover:underline">
            Güncellemeler sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              src={lightboxImage}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Image */}
      {update.cover_image_url && (
        <motion.div
          className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={update.cover_image_url}
            alt={update.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent" />
        </motion.div>
      )}

      {/* Title Section */}
      <div className={`container mx-auto px-6 ${update.cover_image_url ? "-mt-32" : "pt-32"} relative z-10`}>
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground italic leading-tight mb-4">
            {update.title}
          </h1>

          {update.subtitle && (
            <p className="text-foreground/60 text-lg md:text-xl mb-6">{update.subtitle}</p>
          )}

          {/* Divider */}
          <div className="w-full max-w-2xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

          {/* Meta badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-foreground/50">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-sm">
              <Tag className="w-3.5 h-3.5" />
              {update.category === "update" ? "Güncelleme" : "Haber"}
            </span>

            {update.version && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-sm">
                {update.version}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {authorName}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(update.published_at)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Navigation */}
          {headingSections.length > 0 && (
            <motion.aside
              className="hidden lg:block lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="sticky top-32">
                <h4 className="text-xs uppercase tracking-wider text-foreground/40 mb-4 font-medium">
                  İçindekiler
                </h4>
                <nav className="space-y-2">
                  {headingSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`block w-full text-left text-sm py-1.5 px-3 rounded-sm transition-all duration-200 ${
                        activeSection === section.id
                          ? "text-primary bg-primary/10 border-l-2 border-primary"
                          : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
                      }`}
                    >
                      {section.content as string}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          )}

          {/* Center Content */}
          <motion.main
            className={headingSections.length > 0 ? "lg:col-span-7" : "lg:col-span-9"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-card/30 border border-border/30 rounded-xl p-8 md:p-10">
              {update.content.length > 0 ? (
                <div className="prose prose-invert max-w-none">
                  {update.content.map((block) => {
                    const isHeading = block.type === "heading";
                    return (
                      <div
                        key={block.id}
                        ref={(el) => {
                          if (isHeading) {
                            sectionRefs.current[block.id] = el;
                          }
                        }}
                        className={isHeading ? "scroll-mt-40" : ""}
                      >
                        {renderBlock(block)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-foreground/50 text-center py-8">
                  Bu güncelleme için detaylı içerik henüz eklenmedi.
                </p>
              )}
            </div>
          </motion.main>

          {/* Right Sidebar - Latest Updates */}
          <motion.aside
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="sticky top-32">
              <h4 className="text-xs uppercase tracking-wider text-foreground/40 mb-4 font-medium flex items-center gap-2">
                <span className="w-8 h-px bg-primary" />
                Son Güncellemeler
              </h4>

              <div className="space-y-3">
                {otherUpdates.map((item) => (
                  <Link
                    key={item.id}
                    to={`/guncellemeler/${item.id}`}
                    className="group block bg-card/20 border border-border/20 rounded-lg p-3 hover:border-primary/30 hover:bg-card/40 transition-all duration-300"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                        {item.cover_image_url && (
                          <img
                            src={item.cover_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-primary">
                          {item.category === "update" ? "Güncelleme" : "Haber"}
                        </span>
                        <h5 className="text-sm text-foreground/80 group-hover:text-foreground line-clamp-2 leading-tight mt-0.5">
                          {item.title}
                        </h5>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                      <span className="text-[10px] text-foreground/40">
                        {formatShortDate(item.published_at)}
                      </span>
                      <ChevronRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                to="/guncellemeler"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-6"
              >
                Tümünü Gör
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GuncellemeDetay;
