import { useState } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AnimatedLogo = ({ size = "md", className = "" }: AnimatedLogoProps) => {
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
