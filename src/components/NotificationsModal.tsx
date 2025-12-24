import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationItem = ({ 
  notification, 
  onRead 
}: { 
  notification: Notification; 
  onRead: (id: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true, 
    locale: tr 
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        notification.is_read 
          ? 'bg-background/50 border-border/50 opacity-70' 
          : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
      }`}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
          notification.is_read ? 'bg-muted-foreground/30' : 'bg-primary animate-pulse'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={`font-medium text-sm truncate ${
              notification.is_read ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {notification.title}
            </h4>
            {notification.is_global && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full flex-shrink-0">
                Genel
              </span>
            )}
          </div>
          <p className={`text-sm line-clamp-2 ${
            notification.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'
          }`}>
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-2">
            {timeAgo}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationsModal = ({ 
  isOpen, 
  onClose, 
  notifications, 
  unreadCount, 
  isLoading, 
  markAsRead, 
  markAllAsRead 
}: NotificationsModalProps) => {

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated glow effects */}
              <motion.div 
                className="absolute -top-32 -left-32 w-64 h-64 bg-primary/30 rounded-full blur-[100px] pointer-events-none"
                animate={{
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div 
                className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/25 rounded-full blur-[100px] pointer-events-none"
                animate={{
                  x: [0, -40, 0],
                  y: [0, -20, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Background with gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent p-[1px]">
                <div className="h-full w-full rounded-2xl bg-background/95 backdrop-blur-xl" />
              </div>
              
              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Bildirimler</h3>
                        <p className="text-xs text-muted-foreground">
                          {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Mark all as read button */}
                  {unreadCount > 0 && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        onClick={markAllAsRead}
                      >
                        <CheckCheck className="w-4 h-4" />
                        Tümünü Okundu İşaretle
                      </Button>
                    </motion.div>
                  )}
                </div>
                
                {/* Notifications List */}
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-3">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <BellOff className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Henüz bildiriminiz yok
                        </p>
                        <p className="text-muted-foreground/70 text-xs mt-1">
                          Yeni bildirimler burada görünecek
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onRead={markAsRead}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50">
                  <p className="text-center text-muted-foreground/60 text-xs">
                    © 2025 Kaze Community
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsModal;
