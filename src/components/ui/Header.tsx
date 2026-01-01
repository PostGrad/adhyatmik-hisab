import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore, selectIsToday, selectCanGoForward } from '../../store/appStore';
import { formatDisplayDate } from '../../utils';
import { IconButton } from './Button';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showDateNav?: boolean;
  rightAction?: ReactNode;
}

export function Header({ 
  title, 
  subtitle, 
  showDateNav = false, 
  rightAction 
}: HeaderProps) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const isToday = useAppStore(selectIsToday);
  const canGoForward = useAppStore(selectCanGoForward);
  const goToPreviousDay = useAppStore((s) => s.goToPreviousDay);
  const goToNextDay = useAppStore((s) => s.goToNextDay);
  const goToToday = useAppStore((s) => s.goToToday);

  return (
    <header className="sticky top-0 z-40 bg-saffron-50/95 backdrop-blur-sm pt-safe">
      <div className="px-4 py-3">
        {showDateNav ? (
          <div className="flex items-center justify-between">
            <IconButton
              icon={<ChevronLeft className="w-5 h-5" />}
              label="Previous day"
              onClick={goToPreviousDay}
            />
            
            <motion.button
              key={selectedDate}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
              onClick={goToToday}
            >
              <h1 className="text-lg font-semibold text-ink">
                {formatDisplayDate(selectedDate)}
              </h1>
              {!isToday && (
                <span className="text-xs text-saffron-600 font-medium">
                  Tap to go to today
                </span>
              )}
            </motion.button>
            
            <IconButton
              icon={<ChevronRight className="w-5 h-5" />}
              label="Next day"
              onClick={goToNextDay}
              disabled={!canGoForward}
              className={!canGoForward ? 'opacity-30' : ''}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink font-display">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-ink-light mt-0.5">{subtitle}</p>
              )}
            </div>
            {rightAction && <div>{rightAction}</div>}
          </div>
        )}
      </div>
    </header>
  );
}

