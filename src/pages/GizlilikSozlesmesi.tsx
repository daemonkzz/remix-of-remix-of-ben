import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const GizlilikSozlesmesi = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-6 max-w-4xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-serif italic text-primary mb-4">
                Gizlilik Sözleşmesi
              </h1>
              <div className="w-24 h-px bg-primary/50 mx-auto" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-invert prose-lg max-w-none"
            >
              <div className="bg-card/30 backdrop-blur-sm border border-border/20 rounded-lg p-6 md:p-10">
                <div className="text-foreground/80 space-y-6 font-light leading-relaxed">
                  {/* Placeholder content - will be replaced with user's text */}
                  <p className="text-foreground/60 italic text-center py-12">
                    Gizlilik sözleşmesi metni buraya eklenecek...
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default GizlilikSozlesmesi;