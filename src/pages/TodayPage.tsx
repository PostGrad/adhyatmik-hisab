import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyCard } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { HabitLogCard } from '../components/logging/HabitLogCard';
import { HabitForm } from '../components/habits/HabitForm';
import { useHabitsWithLogs } from '../hooks/useHabits';
import { useAppStore } from '../store/appStore';
import { formatDateKey } from '../db';
import { cn } from '../utils';
import type { HisabType } from '../types';
import { SHUBH_HISAB_ID, ASHUBH_HISAB_ID } from '../types';

export function TodayPage() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const activeHisab = useAppStore((s) => s.activeHisab);
  const setActiveHisab = useAppStore((s) => s.setActiveHisab);
  
  const habitsWithLogs = useHabitsWithLogs(selectedDate, activeHisab);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(selectedDate));

  const selectedDateObj = parseISO(selectedDate);
  const isLoading = habitsWithLogs === undefined;

  // Calculate completion stats
  const stats = useMemo(() => {
    if (!habitsWithLogs) return { total: 0, completed: 0, rate: 0 };
    
    const total = habitsWithLogs.length;
    const completed = habitsWithLogs.filter(({ log, habit }) => {
      if (!log) return false;
      if (log.skippedReason) return false;
      
      // For Ashubh habits, "not done" (false) is success
      if (habit.categoryId === ASHUBH_HISAB_ID) {
        return log.value === false;
      }
      
      // For Shubh habits, done is success
      if (typeof log.value === 'boolean') return log.value;
      return true;
    }).length;
    
    return {
      total,
      completed,
      rate: total > 0 ? completed / total : 0,
    };
  }, [habitsWithLogs]);

  // Week days for the week picker
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDateObj, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDateObj]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(formatDateKey(date));
    setShowCalendar(false);
  };

  const goToPrevWeek = () => {
    const newDate = addDays(selectedDateObj, -7);
    setSelectedDate(formatDateKey(newDate));
  };

  const goToNextWeek = () => {
    const newDate = addDays(selectedDateObj, 7);
    setSelectedDate(formatDateKey(newDate));
  };

  return (
    <div className="min-h-screen pb-24 bg-saffron-50">
      {/* Header with date */}
      <header className="bg-saffron-700 text-white pt-safe">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setShowCalendar(true)}
            className="text-left"
          >
            <h1 className="text-2xl font-bold font-display">
              {format(selectedDateObj, 'd MMM yyyy')}
            </h1>
          </button>
          <IconButton
            icon={<Plus className="w-5 h-5" />}
            label="Add habit"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setShowAddHabit(true)}
          />
        </div>
      </header>

      {/* Week picker */}
      <div className="bg-parchment px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-saffron-800">
            {format(selectedDateObj, 'MMMM yyyy')}
          </span>
          <div className="flex gap-1">
            <IconButton
              icon={<ChevronLeft className="w-4 h-4" />}
              label="Previous week"
              size="sm"
              onClick={goToPrevWeek}
            />
            <IconButton
              icon={<ChevronRight className="w-4 h-4" />}
              label="Next week"
              size="sm"
              onClick={goToNextWeek}
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDateObj);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(formatDateKey(day))}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-xl transition-all',
                  isSelected 
                    ? 'bg-saffron-600 text-white' 
                    : isToday 
                      ? 'bg-saffron-100 text-saffron-700'
                      : 'text-ink-light hover:bg-saffron-50'
                )}
              >
                <span className="text-xs font-medium">
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  'text-lg font-semibold',
                  isSelected ? 'text-white' : ''
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hisab Type Tabs */}
      <div className="px-4 py-3">
        <div className="flex bg-white rounded-xl p-1 shadow-card">
          <HisabTab
            hisabType="shubh"
            label="Shubh Hisab"
            isActive={activeHisab === 'shubh'}
            onClick={() => setActiveHisab('shubh')}
            color="bg-saffron-600"
          />
          <HisabTab
            hisabType="ashubh"
            label="Ashubh Hisab"
            isActive={activeHisab === 'ashubh'}
            onClick={() => setActiveHisab('ashubh')}
            color="bg-saffron-400"
          />
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-white rounded-xl p-3 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink">
                {activeHisab === 'shubh' ? 'Completed' : 'Avoided'}
              </span>
              <span className="text-sm font-bold text-saffron-600">
                {stats.completed}/{stats.total}
              </span>
            </div>
            <div className="h-2 bg-saffron-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.rate * 100}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  activeHisab === 'shubh' ? 'bg-forest-500' : 'bg-saffron-500'
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Habit list */}
      <main className="px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHisab}
            initial={{ opacity: 0, x: activeHisab === 'shubh' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeHisab === 'shubh' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-saffron-100 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-saffron-100 rounded w-1/3" />
                        <div className="h-3 bg-saffron-50 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : habitsWithLogs && habitsWithLogs.length > 0 ? (
              <div className="space-y-3">
                {habitsWithLogs.map(({ habit, log }, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HabitLogCard 
                      habit={habit} 
                      log={log} 
                      date={selectedDate}
                      isAshubh={activeHisab === 'ashubh'}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyCard
                icon={<Sparkles className="w-12 h-12" />}
                title={`No ${activeHisab === 'shubh' ? 'good habits' : 'bad habits to avoid'} yet`}
                description={
                  activeHisab === 'shubh'
                    ? 'Add habits you want to practice daily'
                    : 'Add habits you want to avoid'
                }
                action={
                  <Button 
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddHabit(true)}
                  >
                    Add Habit
                  </Button>
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDateObj}
        onSelectDate={handleDateSelect}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />

      {/* Add Habit Modal */}
      <Modal
        isOpen={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        title="Create New Habit"
      >
        <HabitForm
          defaultCategoryId={activeHisab === 'shubh' ? SHUBH_HISAB_ID : ASHUBH_HISAB_ID}
          onComplete={() => setShowAddHabit(false)}
          onCancel={() => setShowAddHabit(false)}
        />
      </Modal>
    </div>
  );
}

// Hisab Tab Component
function HisabTab({ 
  label, 
  isActive, 
  onClick, 
  color 
}: { 
  hisabType: HisabType;
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all',
        isActive 
          ? `${color} text-white shadow-md` 
          : 'text-saffron-600 hover:bg-saffron-50'
      )}
    >
      {label}
    </button>
  );
}

// Calendar Modal Component
function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  month,
  onMonthChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
}) {
  const daysInMonth = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
    }
    
    return days;
  }, [month]);

  const goToPrevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-elevated p-4 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <IconButton
            icon={<ChevronLeft className="w-5 h-5" />}
            label="Previous month"
            onClick={goToPrevMonth}
          />
          <h3 className="text-lg font-semibold text-ink">
            {format(month, 'MMMM yyyy')}
          </h3>
          <IconButton
            icon={<ChevronRight className="w-5 h-5" />}
            label="Next month"
            onClick={goToNextMonth}
          />
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-ink-light py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                  isSelected 
                    ? 'bg-saffron-600 text-white' 
                    : isToday
                      ? 'bg-saffron-100 text-saffron-700'
                      : 'text-ink hover:bg-saffron-50'
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSelectDate(new Date())}>
            Today
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
