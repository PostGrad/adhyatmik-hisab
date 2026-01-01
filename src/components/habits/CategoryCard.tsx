import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { HabitForm } from './HabitForm';
import { HabitListItem } from './HabitListItem';
import { deleteCategory } from '../../db';
import { useAppStore } from '../../store/appStore';
import type { Category, Habit } from '../../types';

interface CategoryCardProps {
  category: Category;
  habits: Habit[];
}

export function CategoryCard({ category, habits }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  const handleDeleteCategory = async () => {
    if (window.confirm(`Delete "${category.name}" category? Habits will be moved to uncategorized.`)) {
      await deleteCategory(category.id);
      addToast({ type: 'success', message: 'Category deleted' });
    }
    setShowMenu(false);
  };

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        {/* Category Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-saffron-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <span 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: category.color + '20' }}
            >
              {category.icon}
            </span>
            <div>
              <h3 className="font-semibold text-ink">{category.name}</h3>
              <p className="text-sm text-ink-light">
                {habits.length} habit{habits.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconButton
                icon={<MoreVertical className="w-5 h-5" />}
                label="Category options"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              />
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-elevated z-20 py-1 min-w-[140px]">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-saffron-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open edit modal
                        setShowMenu(false);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-ink-light" />
            ) : (
              <ChevronDown className="w-5 h-5 text-ink-light" />
            )}
          </div>
        </div>

        {/* Habits List */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="border-t border-saffron-100">
            {habits.length > 0 ? (
              <div className="divide-y divide-saffron-50">
                {habits.map((habit) => (
                  <HabitListItem key={habit.id} habit={habit} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-ink-light">
                <p className="text-sm">No habits in this category yet</p>
              </div>
            )}
            
            <div className="p-3 border-t border-saffron-100">
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddHabit(true)}
                fullWidth
              >
                Add Habit
              </Button>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Add Habit Modal */}
      <Modal 
        isOpen={showAddHabit} 
        onClose={() => setShowAddHabit(false)}
        title="Create New Habit"
      >
        <HabitForm
          onComplete={() => setShowAddHabit(false)}
          onCancel={() => setShowAddHabit(false)}
        />
      </Modal>
    </>
  );
}

