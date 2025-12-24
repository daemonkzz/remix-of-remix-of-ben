import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, ChevronDown, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedLogo from "@/components/AnimatedLogo";
import LoginModal from "@/components/LoginModal";
import NotificationsModal from "@/components/NotificationsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { user, profile, isLoading, signOut } = useAuth();
  const { notifications, unreadCount, isLoading: notificationsLoading, markAsRead, markAllAsRead } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 w-[120px]">
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
              <motion.div
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 0.4 }}
              >
                <Link 
                  to="/guncellemeler"
                  className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                >
                  Güncellemeler
                </Link>
              </motion.div>

              {/* Center Logo / Notification Badge */}
              <motion.div
                className="mx-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <AnimatedLogo 
                  size="lg" 
                  showNotificationBadge={!!user && unreadCount > 0}
                  unreadCount={unreadCount}
                  onNotificationClick={() => setIsNotificationsOpen(true)}
                />
              </motion.div>

              {/* Right Nav Links */}
              <motion.div
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 0.5 }}
              >
                <Link 
                  to="/hikaye"
                  className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                >
                  Hikaye
                </Link>
              </motion.div>
              <motion.div
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 0.6 }}
              >
                <a 
                  href="#harita" 
                  className="text-foreground/50 hover:text-foreground transition-colors text-[11px] tracking-wider font-light italic"
                >
                  Harita
                </a>
              </motion.div>
            </div>
          </div>

          {/* Auth Button - Right */}
          <motion.div 
            className="hidden lg:flex items-center gap-3 flex-shrink-0 w-[120px] justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            {!isLoading && user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/30 ring-2 ring-primary/10">
                      <AvatarImage 
                        src={profile?.avatar_url ? `${profile.avatar_url}?size=64` : undefined} 
                        alt={profile?.username || 'Kullanıcı'} 
                      />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                        {(profile?.username || user.email?.[0] || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <span className="text-[11px] text-foreground/80 font-medium tracking-wide">
                      {profile?.username || user.email?.split('@')[0]}
                    </span>
                    
                    <ChevronDown className="w-3 h-3 text-foreground/50" />
                  </motion.button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 bg-background/95 backdrop-blur-xl border-primary/20 p-0 shadow-xl shadow-primary/5"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-4 border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/40 ring-2 ring-primary/10">
                        <AvatarImage 
                          src={profile?.avatar_url ? `${profile.avatar_url}?size=80` : undefined}
                          alt={profile?.username || 'Kullanıcı'}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                          {(profile?.username || user.email?.[0] || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {profile?.username || user.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg className="w-3.5 h-3.5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                          </svg>
                          <span className="text-xs text-muted-foreground truncate">
                            {profile?.username || 'Discord ile bağlandı'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 focus:bg-primary/10">
                      <Link to="/profil" className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-foreground/70" />
                        <span className="text-sm">Profilim</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 focus:bg-primary/10">
                      <Link to="/basvuru" className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-foreground/70" />
                        <span className="text-sm">Başvuru Merkezi</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setIsNotificationsOpen(true)} 
                      className="cursor-pointer rounded-md px-3 py-2.5 focus:bg-primary/10"
                    >
                      <Bell className="w-4 h-4 mr-2.5 text-foreground/70" />
                      <span className="text-sm">Bildirimler</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="my-2 bg-border/50" />
                    
                    <DropdownMenuItem 
                      onClick={signOut} 
                      className="cursor-pointer rounded-md px-3 py-2.5 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" />
                      <span className="text-sm">Çıkış Yap</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="glow" 
                  size="sm" 
                  className="text-[11px] px-5 h-8 rounded-sm font-medium"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Giriş Yap <span className="ml-1.5">↗</span>
                </Button>
              </motion.div>
            )}
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
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link 
                  to="/guncellemeler"
                  className="block py-3 px-4 text-foreground/70 hover:text-primary transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Güncellemeler
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  to="/hikaye"
                  className="block py-3 px-4 text-foreground/70 hover:text-primary transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Hikaye
                </Link>
              </motion.div>
              <motion.a 
                href="#harita" 
                className="block py-3 px-4 text-foreground/70 hover:text-primary transition-colors text-sm" 
                onClick={() => setIsMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                Harita
              </motion.a>
              <div className="px-4 pt-4 border-t border-border/30 mt-2">
                {!isLoading && user ? (
                  <div className="flex flex-col gap-3">
                    {/* Mobile User Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarImage 
                          src={profile?.avatar_url ? `${profile.avatar_url}?size=64` : undefined}
                          alt={profile?.username || 'Kullanıcı'}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                          {(profile?.username || user.email?.[0] || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {profile?.username || user.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <svg className="w-3 h-3 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                          </svg>
                          <span className="text-xs text-muted-foreground">Discord</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link 
                      to="/profil"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-foreground/5 transition-colors text-sm text-foreground/80"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profilim
                    </Link>
                    
                    <Link 
                      to="/basvuru"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-foreground/5 transition-colors text-sm text-foreground/80"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="w-4 h-4" />
                      Başvuru Merkezi
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="glow" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                  >
                    Giriş Yap ↗
                  </Button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
      
      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={notificationsLoading}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
    </motion.header>
  );
};

export default Header;
