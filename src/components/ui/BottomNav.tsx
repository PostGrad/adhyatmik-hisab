import { motion } from 'framer-motion';
import { Calendar, ListTodo, BarChart3, Settings } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { TabId } from '../../types';
import { cn } from '../../utils';

interface NavItem {
  id: TabId;
  label: string;
  icon: typeof Calendar;
}

const navItems: NavItem[] = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'habits', label: 'Habits', icon: ListTodo },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-saffron-100 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:bg-saffron-50'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors duration-150',
                    isActive ? 'text-saffron-600' : 'text-ink-light'
                  )}
                />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-saffron-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium transition-colors duration-150',
                  isActive ? 'text-saffron-600' : 'text-ink-light'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

