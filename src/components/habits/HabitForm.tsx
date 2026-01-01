import { useState } from 'react';
import { Plus, Trash2, Clock, Ban, Check, Star, Timer, Hash, Calendar } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { createHabit, updateHabit, disableHabit, enableHabit } from '../../db';
import { useCategories } from '../../hooks/useHabits';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../utils';
import type { Habit, HabitType, TrackingInterval, HabitFormData, DayOfWeek } from '../../types';
import { SHUBH_HISAB_ID, ASHUBH_HISAB_ID } from '../../types';

interface HabitFormProps {
  habit?: Habit; // If provided, we're editing
  defaultCategoryId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

// Tracking type buttons config
const trackingTypes: Array<{
  value: HabitType;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'boolean', label: 'Yes / No', icon: <Check className="w-4 h-4" /> },
  { value: 'rating', label: 'Quality', icon: <Star className="w-4 h-4" /> },
  { value: 'time', label: 'Time (min)', icon: <Timer className="w-4 h-4" /> },
  { value: 'count', label: 'Count', icon: <Hash className="w-4 h-4" /> },
];

// Tracking interval buttons config
const intervalOptions: Array<{
  value: TrackingInterval;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'daily', label: 'Daily', icon: <Clock className="w-4 h-4" /> },
  { value: 'weekly', label: 'Weekly', icon: <Calendar className="w-4 h-4" /> },
  { value: 'monthly', label: 'Monthly', icon: <Calendar className="w-4 h-4" /> },
];

// Days of week config
const daysOfWeek: Array<{ value: DayOfWeek; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const defaultOptions = ['Best', 'Good', 'Okay', 'Poor'];

export function HabitForm({ habit, defaultCategoryId, onComplete, onCancel }: HabitFormProps) {
  const categories = useCategories();
  const addToast = useAppStore((s) => s.addToast);
  
  const [formData, setFormData] = useState<HabitFormData>({
    name: habit?.name || '',
    description: habit?.description || '',
    image: habit?.image,
    categoryId: habit?.categoryId || defaultCategoryId || SHUBH_HISAB_ID,
    type: habit?.type || 'boolean',
    options: habit?.options || [...defaultOptions],
    unit: habit?.unit || '',
    target: habit?.target,
    interval: habit?.interval || 'daily',
    trackingDay: habit?.trackingDay ?? 0, // Default to Sunday
    trackingDate: habit?.trackingDate ?? 1, // Default to 1st
    reminderEnabled: habit?.reminderEnabled || false,
    reminderTime: habit?.reminderTime || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!habit;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.type === 'rating' && (!formData.options || formData.options.length < 2)) {
      newErrors.options = 'At least 2 rating options required';
    }
    
    if (formData.reminderEnabled && !formData.reminderTime) {
      newErrors.reminderTime = 'Reminder time is required';
    }

    if (formData.interval === 'monthly' && (formData.trackingDate === undefined || formData.trackingDate < 1 || formData.trackingDate > 31)) {
      newErrors.trackingDate = 'Please enter a valid date (1-31)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const habitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        image: formData.image,
        categoryId: formData.categoryId,
        type: formData.type,
        options: formData.type === 'rating' ? formData.options : undefined,
        unit: ['time', 'count'].includes(formData.type) ? formData.unit : undefined,
        target: formData.target || undefined,
        interval: formData.interval,
        trackingDay: formData.interval === 'weekly' ? formData.trackingDay : undefined,
        trackingDate: formData.interval === 'monthly' ? formData.trackingDate : undefined,
        reminderEnabled: formData.reminderEnabled,
        reminderTime: formData.reminderEnabled ? formData.reminderTime : undefined,
      };
      
      if (habit) {
        await updateHabit(habit.id, habitData);
        addToast({ type: 'success', message: 'Habit updated!' });
      } else {
        await createHabit(habitData);
        addToast({ type: 'success', message: 'Habit created! 🎉' });
      }
      
      onComplete();
    } catch (error) {
      addToast({ type: 'error', message: 'Something went wrong' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!habit) return;
    
    try {
      await disableHabit(habit.id);
      addToast({ type: 'info', message: 'Habit disabled' });
      onComplete();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to disable habit' });
    }
  };

  const handleEnable = async () => {
    if (!habit) return;
    
    try {
      await enableHabit(habit.id);
      addToast({ type: 'success', message: 'Habit enabled' });
      onComplete();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to enable habit' });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ 
      ...formData, 
      options: [...(formData.options || []), ''] 
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options?.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  // Get the current category info
  const isShubh = formData.categoryId === SHUBH_HISAB_ID;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Habit Name */}
      <Input
        label="Habit Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder={isShubh ? "e.g., Morning Prayer" : "e.g., Negative Thoughts"}
        error={errors.name}
        autoFocus
      />

      {/* Description */}
      <Textarea
        label="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Brief description of this habit"
        rows={2}
      />

      {/* Category Selection - show only if not already set via defaultCategoryId */}
      {!defaultCategoryId && categories && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink">
            Hisab Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, categoryId: SHUBH_HISAB_ID })}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                formData.categoryId === SHUBH_HISAB_ID
                  ? 'border-saffron-600 bg-saffron-50 text-saffron-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              🙏 Shubh Hisab
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, categoryId: ASHUBH_HISAB_ID })}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                formData.categoryId === ASHUBH_HISAB_ID
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              ⚠️ Ashubh Hisab
            </button>
          </div>
        </div>
      )}

      {/* Tracking Type - Visual buttons */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink">
          Tracking Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {trackingTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: type.value })}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all',
                formData.type === type.value
                  ? 'border-saffron-600 bg-saffron-50 text-saffron-700'
                  : 'border-gray-200 hover:border-gray-300 text-ink-light'
              )}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type-specific options */}
      {formData.type === 'rating' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Rating Options
          </label>
          {formData.options?.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {formData.options && formData.options.length > 2 && (
                <IconButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Remove option"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={addOption}
          >
            Add Option
          </Button>
          {errors.options && (
            <p className="text-sm text-red-600">{errors.options}</p>
          )}
        </div>
      )}

      {(formData.type === 'time' || formData.type === 'count') && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Daily Target ({formData.type === 'time' ? 'min' : 'count'})
          </label>
          <Input
            type="number"
            value={formData.target?.toString() || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              target: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder={formData.type === 'time' ? 'e.g., 20' : 'e.g., 100'}
          />
        </div>
      )}

      {/* Tracking Interval */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink">
          Tracking Interval
        </label>
        <div className="grid grid-cols-3 gap-2">
          {intervalOptions.map((interval) => (
            <button
              key={interval.value}
              type="button"
              onClick={() => setFormData({ ...formData, interval: interval.value })}
              className={cn(
                'flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all',
                formData.interval === interval.value
                  ? 'border-saffron-600 bg-saffron-50 text-saffron-700'
                  : 'border-gray-200 hover:border-gray-300 text-ink-light'
              )}
            >
              {interval.icon}
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly: Select Day of Week */}
      {formData.interval === 'weekly' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select a Day of the Week
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setFormData({ ...formData, trackingDay: day.value })}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  formData.trackingDay === day.value
                    ? 'border-saffron-600 bg-saffron-600 text-white'
                    : 'border-gray-200 hover:border-gray-300 text-ink'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly: Select Date */}
      {formData.interval === 'monthly' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tracking Reminder (Date 1-31)
          </label>
          <Input
            type="number"
            min={1}
            max={31}
            value={formData.trackingDate?.toString() || '1'}
            onChange={(e) => setFormData({ 
              ...formData, 
              trackingDate: parseInt(e.target.value) || 1
            })}
            placeholder="1"
            error={errors.trackingDate}
          />
        </div>
      )}

      {/* Daily Reminder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">
            Daily Reminder
          </label>
          <button
            type="button"
            onClick={() => setFormData({ 
              ...formData, 
              reminderEnabled: !formData.reminderEnabled 
            })}
            className={cn(
              'w-12 h-6 rounded-full relative transition-colors',
              formData.reminderEnabled ? 'bg-saffron-600' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform',
                formData.reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
        
        {formData.reminderEnabled && (
          <Input
            type="time"
            value={formData.reminderTime}
            onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
            error={errors.reminderTime}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        {/* Disable/Enable button - always show */}
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            fullWidth
            icon={habit?.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            onClick={habit?.isActive ? handleDisable : handleEnable}
          >
            {habit?.isActive ? 'Disable' : 'Enable'}
          </Button>
        )}

        <div className="flex gap-3">
          {!isEditing && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth icon={<Ban className="w-4 h-4" />}>
              Disable
            </Button>
          )}
          {isEditing && (
            <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isSubmitting} fullWidth>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
