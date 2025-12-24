import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Users } from 'lucide-react';

interface OnlineUsersBarProps {
  maxVisible?: number;
}

const OnlineUsersBar: React.FC<OnlineUsersBarProps> = ({ maxVisible = 8 }) => {
  const { onlineUsers, isConnected, currentUserId } = useOnlineUsers();

  if (!isConnected || onlineUsers.length === 0) {
    return null;
  }

  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const overflowCount = Math.max(0, onlineUsers.length - maxVisible);

  const getInitials = (username: string | null) => {
    if (!username) return '?';
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-center gap-3 mt-4"
      >
        {/* Online indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Online:</span>
        </div>

        {/* Avatars */}
        <div className="flex -space-x-2">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((user, index) => {
              const isCurrentUser = user.user_id === currentUserId;
              
              return (
                <Tooltip key={user.user_id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                      style={{ zIndex: visibleUsers.length - index }}
                    >
                      <Avatar
                        className={`w-8 h-8 border-2 cursor-pointer transition-all duration-200 hover:scale-110 hover:z-50 ${
                          isCurrentUser
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-green-500/70'
                        }`}
                      >
                        <AvatarImage
                          src={user.avatar_url || undefined}
                          alt={user.username || 'User'}
                        />
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-popover/95 backdrop-blur-sm border-border"
                  >
                    <p className="font-medium">
                      {user.username || 'Anonim'}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-1">(Sen)</span>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </AnimatePresence>

          {/* Overflow badge */}
          {overflowCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-medium text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
                >
                  +{overflowCount}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>+{overflowCount} kullanıcı daha</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total count */}
        <span className="text-sm text-muted-foreground">
          {onlineUsers.length} kişi
        </span>
      </motion.div>
    </TooltipProvider>
  );
};

export default OnlineUsersBar;
