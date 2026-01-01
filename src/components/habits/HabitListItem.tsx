import { useState } from 'react';
import { Settings, Check, Star, Clock, Hash, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { HabitForm } from './HabitForm';
import { cn } from '../../utils';
import type { Habit } from '../../types';

interface HabitListItemProps {
  habit: Habit;
  isAshubh?: boolean;
}

const typeIcons = {
  boolean: Check,
  rating: Star,
  time: Clock,
  count: Hash,
};

const typeLabels = {
  boolean: 'Yes/No',
  rating: 'Quality',
  time: 'Time',
  count: 'Count',
};

const intervalLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitListItem({ habit, isAshubh = false }: HabitListItemProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const Icon = typeIcons[habit.type];

  return (
    <>
      <Card 
        className={cn(
          'transition-all hover:shadow-md cursor-pointer',
          isAshubh && 'border-l-2 border-l-red-400'
        )}
        onClick={() => setShowEditModal(true)}
      >
        <div className="flex items-center gap-3">
          {/* Type Icon */}
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isAshubh ? 'bg-red-100' : 'bg-saffron-100'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              isAshubh ? 'text-red-600' : 'text-saffron-600'
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-ink truncate">{habit.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isAshubh ? 'bg-red-50 text-red-600' : 'bg-saffron-50 text-saffron-600'
              )}>
                {typeLabels[habit.type]}
              </span>
              <span className="text-xs text-ink-light flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {intervalLabels[habit.interval || 'daily']}
                {habit.interval === 'weekly' && habit.trackingDay !== undefined && (
                  <span>({dayLabels[habit.trackingDay]})</span>
                )}
                {habit.interval === 'monthly' && habit.trackingDate && (
                  <span>(Day {habit.trackingDate})</span>
                )}
              </span>
              {habit.reminderEnabled && habit.reminderTime && (
                <span className="text-xs text-ink-light flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {habit.reminderTime}
                </span>
              )}
            </div>
          </div>

          {/* Settings button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg text-ink-light hover:bg-saffron-50 hover:text-saffron-600 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Hisab Settings: ${habit.name}`}
      >
        <HabitForm
          habit={habit}
          onComplete={() => setShowEditModal(false)}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </>
  );
}
