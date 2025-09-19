import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  Brain, 
  FileText, 
  Gamepad2, 
  Users, 
  Activity,
  Home,
  X,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { sidebarItems } from '@/lib/nav-items';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNavItems = sidebarItems.slice(0, -1);
  const settingsNavItem = sidebarItems.slice(-1)[0];

  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
    },
    closed: { 
      x: -300,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border bg-sidebar-bg pt-16 md:sticky md:top-16 md:h-[calc(100vh-4rem)]",
          "flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-4 top-4 md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Collapse Toggle Button */}
        <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6 rounded-full"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 pt-8 md:pt-4">
          <div className="flex flex-1 flex-col justify-between">
            <nav className="space-y-3">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => {
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          onClose();
                        }
                      }}
                      className={cn(
                        "sidebar-item group",
                        isActive && "active"
                      )}
                    >
                      <div className={cn(
                        `p-2 rounded-lg transition-all`,
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent group-hover:bg-primary group-hover:text-primary-foreground',
                        isCollapsed && 'mx-auto'
                      )}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      <AnimatePresence>
                        {!isCollapsed && (
                        <motion.div 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 overflow-hidden"
                        >
                          <span className="text-sm font-medium block whitespace-nowrap">
                            {item.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                              {item.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <nav>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={settingsNavItem.path}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={cn(
                    "sidebar-item group",
                    location.pathname === settingsNavItem.path && "active"
                  )}
                >
                  <div className={cn(
                    `p-2 rounded-lg transition-all`,
                    location.pathname === settingsNavItem.path
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-accent group-hover:bg-primary group-hover:text-primary-foreground',
                    isCollapsed && 'mx-auto'
                  )}>
                    <Settings className="h-5 w-5 flex-shrink-0" />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 overflow-hidden"
                        >
                          <span className="text-sm font-medium block whitespace-nowrap">
                            {settingsNavItem.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                          {settingsNavItem.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            </nav>
          </div>
        </div>

        {/* Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="border-t border-sidebar-border p-4"
            >
              <div className="rounded-lg bg-primary-soft p-3 text-center">
                <p className="text-xs text-primary">
                  🌟 Your mental health matters
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take it one day at a time
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
