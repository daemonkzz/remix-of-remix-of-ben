import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorPosition, MapState } from '@/hooks/useCursorSync';

interface CursorOverlayProps {
  cursors: CursorPosition[];
  mapState?: MapState;
  containerSize?: { width: number; height: number };
}

// Cursor SVG component with gradient fill and colored border
const CursorIcon = ({ borderColor, odometer }: { borderColor: string; odometer: number }) => {
  const gradientId = `cursor-gradient-${odometer}`;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.4))` }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <path
        d="M5.65376 3.45474L19.7449 11.7551C20.5174 12.2127 20.3767 13.3584 19.5143 13.6141L13.0749 15.5213L10.4717 21.6849C10.1265 22.5144 8.95046 22.4316 8.72185 21.5631L4.38929 4.76469C4.19053 4.00959 4.94052 3.35992 5.65376 3.45474Z"
        fill={`url(#${gradientId})`}
        stroke={borderColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CursorOverlay = memo(({ cursors, mapState, containerSize }: CursorOverlayProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {cursors.map((cursor, index) => {
          // Calculate display position from world coordinates
          let displayX = cursor.worldX;
          let displayY = cursor.worldY;
          
          if (mapState && containerSize && containerSize.width > 0 && containerSize.height > 0) {
            const { scale, position } = mapState;
            const { width, height } = containerSize;
            
            // World to viewport (center-anchored)
            // Scale transforms around center (50%, 50%), so we need center-relative math
            // position is in pixels, convert to percentage
            const offsetXPercent = (position.x / width) * 100;
            const offsetYPercent = (position.y / height) * 100;
            
            // Center-anchored: displayX = 50 + (worldX - 50) * scale + offset
            displayX = 50 + (cursor.worldX - 50) * scale + offsetXPercent;
            displayY = 50 + (cursor.worldY - 50) * scale + offsetYPercent;
          }
          
          // Hide cursors outside viewport with some margin
          const isVisible = displayX >= -20 && displayX <= 120 && displayY >= -20 && displayY <= 120;
          
          if (!isVisible) return null;
          
          return (
            <motion.div
              key={cursor.user_id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: `${displayX}%`,
                top: `${displayY}%`,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
                left: { duration: 0.1, ease: 'linear' },
                top: { duration: 0.1, ease: 'linear' },
              }}
              className="absolute"
              style={{
                transform: 'translate(-3px, -3px)',
              }}
            >
              {/* Cursor icon */}
              <CursorIcon borderColor={cursor.color} odometer={index} />
              
              {/* Minimalist username label */}
              <div 
                className="absolute left-4 top-4 whitespace-nowrap px-1.5 py-0.5 
                           rounded text-[10px] font-medium text-white/80 
                           bg-black/30 backdrop-blur-[2px]"
                style={{ 
                  borderLeft: `2px solid ${cursor.color}`,
                }}
              >
                {(cursor.username || 'Anonim').slice(0, 10)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

CursorOverlay.displayName = 'CursorOverlay';

export default CursorOverlay;
