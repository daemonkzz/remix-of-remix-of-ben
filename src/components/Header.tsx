import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -2, color: "hsl(var(--foreground))" },
  };

  const socialIconVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.15, rotate: 5 },
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "bg-background/80 backdrop-blur-lg" : ""
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Social Icons - Left */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Instagram */}
            <motion.a 
              href="#" 
              className="w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              variants={socialIconVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 0 }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </motion.a>
            {/* TikTok */}
            <motion.a 
              href="#" 
              className="w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              variants={socialIconVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 0.1 }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </motion.a>
            {/* Discord */}
            <motion.a 
              href="#" 
              className="w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              variants={socialIconVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 0.2 }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
            </motion.a>
          </div>

          {/* Center Section - Nav Links + Logo */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-8">
              {/* Left Nav Links */}
              <motion.div
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 0.3 }}
              >
                <Link 
                  to="/kurallar"
                  className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                >
                  Kurallar
                </Link>
              </motion.div>
              <motion.a 
                href="#güncellemeler" 
                className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 0.4 }}
              >
                Güncellemeler
              </motion.a>

              {/* Center Logo */}
              <motion.a 
                href="/"
                className="flex items-center justify-center mx-6 relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.08 }}
              >
                {/* Logo glow background */}
                <motion.div
                  className="absolute inset-0 -m-4 rounded-full pointer-events-none"
                  initial={{ background: "radial-gradient(circle, hsl(var(--primary) / 0) 0%, transparent 70%)" }}
                  animate={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <img src={logo} alt="Logo" className="h-14 w-auto" />
              </motion.a>

              {/* Right Nav Links */}
              {["Hikaye", "Harita"].map((link, index) => (
                <motion.a 
                  key={link}
                  href={`#${link.toLowerCase()}`} 
                  className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                  variants={navLinkVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {link}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Book Now Button - Right */}
          <motion.div 
            className="hidden lg:block flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="glow" size="sm" className="text-[11px] px-5 h-8 rounded-sm font-medium">
                Giriş Yap <span className="ml-1.5">↗</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Mobile Menu Toggle */}
          <motion.button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav 
              className="lg:hidden py-4 mt-4 border-t border-border/30 bg-background/95 backdrop-blur-md rounded-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.a 
                href="/"
                className="block py-3 px-4 text-foreground font-medium hover:text-primary transition-colors text-sm" 
                onClick={() => setIsMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}
              >
                Anasayfa
              </motion.a>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link 
                  to="/kurallar"
                  className="block py-3 px-4 text-foreground/70 hover:text-primary transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kurallar
                </Link>
              </motion.div>
              {["Güncellemeler", "Hikaye", "Harita"].map((link, index) => (
                <motion.a 
                  key={link}
                  href={`#${link.toLowerCase()}`} 
                  className="block py-3 px-4 text-foreground/70 hover:text-primary transition-colors text-sm" 
                  onClick={() => setIsMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 2) * 0.1 }}
                >
                  {link}
                </motion.a>
              ))}
              <div className="px-4 pt-2">
                <Button variant="glow" size="sm" className="w-full">
                  Giriş Yap ↗
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
