import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { EmptyCard, Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { HabitForm } from '../components/habits/HabitForm';
import { HabitListItem } from '../components/habits/HabitListItem';
import { useHabitsByHisab, useCategories } from '../hooks/useHabits';
import { SHUBH_HISAB_ID, ASHUBH_HISAB_ID, type HisabType } from '../types';
import { cn } from '../utils';

export function HabitsPage() {
  const categories = useCategories();
  const shubhHabits = useHabitsByHisab('shubh');
  const ashubhHabits = useHabitsByHisab('ashubh');
  
  const [activeTab, setActiveTab] = useState<HisabType>('shubh');
  const [showAddHabit, setShowAddHabit] = useState(false);

  const isLoading = shubhHabits === undefined || ashubhHabits === undefined;
  const currentHabits = activeTab === 'shubh' ? shubhHabits : ashubhHabits;
  const currentCategory = categories?.find(c => 
    c.id === (activeTab === 'shubh' ? SHUBH_HISAB_ID : ASHUBH_HISAB_ID)
  );

  return (
    <div className="min-h-screen pb-24 bg-saffron-50">
      <Header 
        title="Habits" 
        subtitle="Manage your spiritual practices"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddHabit(true)}
          >
            Add
          </Button>
        }
      />

      {/* Tab Navigation */}
      <div className="px-4 py-3">
        <div className="flex bg-white rounded-xl p-1 shadow-card">
          <button
            onClick={() => setActiveTab('shubh')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
              activeTab === 'shubh'
                ? 'bg-forest-500 text-white shadow-md'
                : 'text-forest-600 hover:bg-forest-50'
            )}
          >
            <Sparkles className="w-4 h-4" />
            Shubh Hisab
            {shubhHabits && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === 'shubh' ? 'bg-white/20' : 'bg-forest-100'
              )}>
                {shubhHabits.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ashubh')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
              activeTab === 'ashubh'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-red-600 hover:bg-red-50'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Ashubh Hisab
            {ashubhHabits && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === 'ashubh' ? 'bg-white/20' : 'bg-red-100'
              )}>
                {ashubhHabits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Info Card */}
      {currentCategory && (
        <div className="px-4 pb-3">
          <Card className={cn(
            'border-l-4',
            activeTab === 'shubh' ? 'border-l-forest-500' : 'border-l-red-500'
          )}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentCategory.icon}</span>
              <div>
                <h3 className="font-semibold text-ink">{currentCategory.name}</h3>
                <p className="text-sm text-ink-light">
                  {activeTab === 'shubh' 
                    ? 'Good habits to practice daily'
                    : 'Bad habits to avoid'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Habits List */}
      <main className="px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'shubh' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'shubh' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
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
            ) : currentHabits && currentHabits.length > 0 ? (
              <div className="space-y-2">
                {currentHabits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HabitListItem 
                      habit={habit} 
                      isAshubh={activeTab === 'ashubh'}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyCard
                icon={activeTab === 'shubh' 
                  ? <Sparkles className="w-12 h-12" /> 
                  : <AlertTriangle className="w-12 h-12" />
                }
                title={activeTab === 'shubh' 
                  ? 'No good habits yet'
                  : 'No bad habits to track'
                }
                description={activeTab === 'shubh'
                  ? 'Add habits you want to practice regularly'
                  : 'Add habits you want to avoid or reduce'
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

      {/* Add Habit Modal */}
      <Modal
        isOpen={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        title="Create New Habit"
      >
        <HabitForm
          defaultCategoryId={activeTab === 'shubh' ? SHUBH_HISAB_ID : ASHUBH_HISAB_ID}
          onComplete={() => setShowAddHabit(false)}
          onCancel={() => setShowAddHabit(false)}
        />
      </Modal>
    </div>
  );
}
