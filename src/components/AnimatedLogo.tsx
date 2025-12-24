import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Bell } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showNotificationBadge?: boolean;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

const AnimatedLogo = ({ 
  size = "md", 
  className = "",
  showNotificationBadge = false,
  unreadCount = 0,
  onNotificationClick
}: AnimatedLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const sizeClasses = {
    sm: "h-10",
    md: "h-12",
    lg: "h-14",
  };

  const iconSizes = {
    sm: 30,
    md: 36,
    lg: 42,
  };

  const bellSizes = {
    sm: 24,
    md: 28,
    lg: 32,
  };

  // Show notification badge instead of logo
  if (showNotificationBadge && unreadCount > 0) {
    return (
      <motion.div 
        className={`relative cursor-pointer ${className}`}
        onClick={onNotificationClick}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 -m-3 rounded-full bg-primary/20 blur-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Bell icon with shake animation */}
          <motion.div
            className="relative z-10 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          >
            <Bell className="w-6 h-6 text-primary" />
          </motion.div>
          
          {/* Badge */}
          <motion.div
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 300 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // On homepage, just show the logo with normal hover effect
  if (isHomePage) {
    return (
      <motion.div className={`relative ${className}`}>
        <Link to="/" className="flex items-center justify-center">
          <motion.div
            className="absolute inset-0 -m-4 rounded-full pointer-events-none"
            initial={{ background: "radial-gradient(circle, hsl(var(--primary) / 0) 0%, transparent 70%)" }}
            animate={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.img 
            src={logo} 
            alt="Logo" 
            className={`${sizeClasses[size]} w-auto`}
            whileHover={{ scale: 1.08 }}
          />
        </Link>
      </motion.div>
    );
  }

  // On other pages, show the swap animation (only on desktop)
  return (
    <Link 
      to="/" 
      className={`relative flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo glow background */}
      <motion.div
        className="absolute inset-0 -m-4 rounded-full pointer-events-none"
        initial={{ background: "radial-gradient(circle, hsl(var(--primary) / 0) 0%, transparent 70%)" }}
        animate={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Container for animation */}
      <div className="relative">
        {/* Logo - shrinks on hover */}
        <motion.img 
          src={logo} 
          alt="Logo" 
          className={`${sizeClasses[size]} w-auto hidden lg:block`}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ 
            scale: isHovered ? 0 : 1, 
            opacity: isHovered ? 0 : 1 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        
        {/* Logo for mobile - no animation */}
        <img 
          src={logo} 
          alt="Logo" 
          className={`${sizeClasses[size]} w-auto lg:hidden`}
        />
        
        {/* Home icon - grows on hover (only on desktop) */}
        <motion.div
          className="absolute inset-0 items-center justify-center text-primary hidden lg:flex"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isHovered ? 1 : 0, 
            opacity: isHovered ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Home size={iconSizes[size]} strokeWidth={1.5} />
        </motion.div>
      </div>
    </Link>
  );
};

export default AnimatedLogo;
