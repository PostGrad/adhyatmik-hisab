import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, Hash, Star, MessageSquare, SkipForward, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BottomSheet, Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { HabitForm } from '../habits/HabitForm';
import { logHabit, skipHabit } from '../../db';
import { useAppStore } from '../../store/appStore';
import { cn, formatDuration } from '../../utils';
import type { Habit, LogEntry } from '../../types';

interface HabitLogCardProps {
  habit: Habit;
  log?: LogEntry;
  date: string;
  isAshubh?: boolean; // If true, NOT doing the habit is success
}

export function HabitLogCard({ habit, log, date, isAshubh = false }: HabitLogCardProps) {
  const [showSkipSheet, setShowSkipSheet] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [note, setNote] = useState(log?.note || '');
  const [showSettings, setShowSettings] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

  // For Ashubh habits: avoiding (not doing) is success
  // For Shubh habits: doing is success
  const isCompleted = log && !log.skippedReason && (
    typeof log.value === 'boolean' ? log.value : true
  );
  
  // For Ashubh: "avoided" = not done = success
  const isSuccess = isAshubh 
    ? log && !log.skippedReason && log.value === false // Avoided
    : isCompleted; // Did it
  
  const isSkipped = log?.skippedReason;

  const handleBooleanToggle = async (didIt: boolean) => {
    await logHabit(habit.id, date, didIt, log?.note);
    
    if (isAshubh) {
      if (!didIt) {
        addToast({ type: 'success', message: `${habit.name} avoided! 🎉` });
      } else {
        addToast({ type: 'warning', message: `${habit.name} done - try to avoid tomorrow` });
      }
    } else {
      if (didIt) {
        addToast({ type: 'success', message: `${habit.name} completed! 🎉` });
      }
    }
  };

  const handleRatingSelect = async (option: string) => {
    await logHabit(habit.id, date, option, log?.note);
    addToast({ type: 'success', message: `${habit.name} logged! ✨` });
  };

  const handleTimeLog = async (minutes: number) => {
    await logHabit(habit.id, date, minutes, log?.note);
    addToast({ type: 'success', message: `${habit.name}: ${formatDuration(minutes)} logged! ⏱️` });
  };

  const handleCountLog = async (count: number) => {
    await logHabit(habit.id, date, count, log?.note);
    addToast({ type: 'success', message: `${habit.name}: ${count} ${habit.unit || 'times'} logged! 🔢` });
  };

  const handleSkip = async () => {
    if (skipReason.trim()) {
      await skipHabit(habit.id, date, skipReason);
      setShowSkipSheet(false);
      setSkipReason('');
      addToast({ type: 'info', message: `${habit.name} skipped` });
    }
  };

  const handleSaveNote = async () => {
    if (log) {
      await logHabit(habit.id, date, log.value, note);
    }
    setShowNoteSheet(false);
    addToast({ type: 'success', message: 'Note saved!' });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={cn(
            'transition-all duration-200',
            isSuccess && 'ring-2 ring-forest-500 bg-forest-50/50',
            isAshubh && log && log.value === true && 'ring-2 ring-red-400 bg-red-50/50',
            isSkipped && 'opacity-60 bg-gray-50'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Status indicator */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              isSuccess ? 'bg-forest-500 text-white' : 
              isAshubh && log && log.value === true ? 'bg-red-500 text-white' :
              isSkipped ? 'bg-gray-300 text-gray-600' : 
              'bg-saffron-100 text-saffron-600'
            )}>
              {isSuccess ? <Check className="w-5 h-5" /> : 
               isAshubh && log && log.value === true ? <X className="w-5 h-5" /> :
               isSkipped ? <SkipForward className="w-4 h-4" /> :
               habit.type === 'boolean' ? <Check className="w-5 h-5" /> :
               habit.type === 'rating' ? <Star className="w-5 h-5" /> :
               habit.type === 'time' ? <Clock className="w-5 h-5" /> :
               <Hash className="w-5 h-5" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                'font-medium text-ink',
                isSuccess && 'line-through text-ink-light'
              )}>
                {habit.name}
              </h3>
              
              {habit.description && (
                <p className="text-sm text-ink-light mt-0.5 truncate">
                  {habit.description}
                </p>
              )}

              {/* Log value display */}
              {log && !isSkipped && !isAshubh && (
                <p className="text-sm text-forest-600 font-medium mt-1">
                  {habit.type === 'rating' && `Rating: ${log.value}`}
                  {habit.type === 'time' && `Duration: ${formatDuration(log.value as number)}`}
                  {habit.type === 'count' && `Count: ${log.value} ${habit.unit || ''}`}
                </p>
              )}

              {/* Ashubh status display */}
              {isAshubh && log && !isSkipped && (
                <p className={cn(
                  'text-sm font-medium mt-1',
                  log.value === false ? 'text-forest-600' : 'text-red-600'
                )}>
                  {log.value === false ? '✓ Avoided' : '✗ Done'}
                </p>
              )}

              {isSkipped && (
                <p className="text-sm text-gray-500 mt-1">
                  Skipped: {log?.skippedReason}
                </p>
              )}

              {log?.note && (
                <p className="text-xs text-ink-light mt-1 italic">
                  📝 {log.note}
                </p>
              )}

              {/* Action area based on type */}
              {!isSkipped && (
                <div className="mt-3">
                  {habit.type === 'boolean' && (
                    <BooleanInput 
                      isAshubh={isAshubh}
                      currentValue={log?.value as boolean | undefined}
                      onToggle={handleBooleanToggle}
                    />
                  )}
                  
                  {habit.type === 'rating' && !isAshubh && (
                    <RatingInput 
                      options={habit.options || ['Best', 'Good', 'Okay', 'Poor']}
                      selectedValue={log?.value as string}
                      onSelect={handleRatingSelect}
                    />
                  )}
                  
                  {habit.type === 'time' && !isAshubh && (
                    <TimeInput 
                      currentValue={log?.value as number}
                      target={habit.target}
                      onLog={handleTimeLog}
                    />
                  )}
                  
                  {habit.type === 'count' && !isAshubh && (
                    <CountInput 
                      currentValue={log?.value as number}
                      unit={habit.unit}
                      target={habit.target}
                      onLog={handleCountLog}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-ink-light hover:bg-saffron-50 transition-colors"
                title="Habit settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowNoteSheet(true)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  log?.note ? 'text-saffron-600 bg-saffron-50' : 'text-ink-light hover:bg-saffron-50'
                )}
                title="Add note"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              
              {!isSuccess && !isSkipped && (
                <button
                  onClick={() => setShowSkipSheet(true)}
                  className="p-2 rounded-lg text-ink-light hover:bg-gray-100 transition-colors"
                  title="Skip with reason"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Skip reason sheet */}
      <BottomSheet 
        isOpen={showSkipSheet} 
        onClose={() => setShowSkipSheet(false)}
        title="Skip with reason"
      >
        <div className="space-y-4">
          <p className="text-ink-light text-sm">
            Why are you skipping "{habit.name}" today?
          </p>
          <Textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="e.g., Feeling unwell, traveling..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setShowSkipSheet(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSkip}
              disabled={!skipReason.trim()}
              fullWidth
            >
              Skip
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Note sheet */}
      <BottomSheet 
        isOpen={showNoteSheet} 
        onClose={() => setShowNoteSheet(false)}
        title="Add note"
      >
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did it go? Any reflections?"
            rows={4}
          />
          <Button onClick={handleSaveNote} fullWidth>
            Save Note
          </Button>
        </div>
      </BottomSheet>

      {/* Settings modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title={`Hisab Settings: ${habit.name}`}
      >
        <HabitForm
          habit={habit}
          onComplete={() => setShowSettings(false)}
          onCancel={() => setShowSettings(false)}
        />
      </Modal>
    </>
  );
}

// ============================================================================
// Input Components for Each Type
// ============================================================================

function BooleanInput({ 
  isAshubh, 
  currentValue, 
  onToggle 
}: { 
  isAshubh?: boolean;
  currentValue?: boolean; 
  onToggle: (value: boolean) => void;
}) {
  if (isAshubh) {
    // For bad habits: Yes = Did it (bad), No = Avoided (good)
    return (
      <div className="flex gap-2">
        <Button
          variant={currentValue === true ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            currentValue === true && 'border-red-500 text-red-600 bg-red-50'
          )}
          onClick={() => onToggle(true)}
        >
          Yes
        </Button>
        <Button
          variant={currentValue === false ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            currentValue === false && 'bg-forest-500 text-white'
          )}
          onClick={() => onToggle(false)}
        >
          No
        </Button>
      </div>
    );
  }

  // For good habits: Mark Done button
  return (
    <div className="flex gap-2">
      <Button
        variant={currentValue ? 'secondary' : 'primary'}
        size="sm"
        icon={<Check className="w-4 h-4" />}
        onClick={() => onToggle(!currentValue)}
      >
        {currentValue ? 'Completed' : 'Mark Done'}
      </Button>
    </div>
  );
}

function RatingInput({ 
  options, 
  selectedValue, 
  onSelect 
}: { 
  options: string[]; 
  selectedValue?: string; 
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
        {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            selectedValue === option 
              ? 'bg-saffron-600 text-white' 
              : 'bg-saffron-100 text-saffron-700 hover:bg-saffron-200'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TimeInput({ 
  currentValue, 
  target,
  onLog 
}: { 
  currentValue?: number; 
  target?: number;
  onLog: (minutes: number) => void;
}) {
  const [inputValue, setInputValue] = useState(currentValue?.toString() || '');
  
  const quickOptions = [5, 10, 15, 30, 45, 60];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {quickOptions.map((mins) => (
          <button
            key={mins}
            onClick={() => onLog(mins)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              currentValue === mins 
                ? 'bg-saffron-600 text-white' 
                : 'bg-saffron-100 text-saffron-700 hover:bg-saffron-200'
            )}
          >
            {formatDuration(mins)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Custom"
          className="w-24"
        />
        <span className="text-sm text-ink-light">minutes</span>
        <Button 
          size="sm" 
          onClick={() => inputValue && onLog(parseInt(inputValue))}
          disabled={!inputValue}
        >
          Log
        </Button>
      </div>
      {target && currentValue && (
        <div className="text-xs text-ink-light">
          Target: {formatDuration(target)} ({Math.round((currentValue / target) * 100)}% achieved)
        </div>
      )}
    </div>
  );
}

function CountInput({ 
  currentValue, 
  unit,
  target,
  onLog 
}: { 
  currentValue?: number;
  unit?: string;
  target?: number;
  onLog: (count: number) => void;
}) {
  const [inputValue, setInputValue] = useState(currentValue?.toString() || '');

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter count"
          className="w-32"
        />
        <span className="text-sm text-ink-light">{unit || 'times'}</span>
        <Button 
          size="sm" 
          onClick={() => inputValue && onLog(parseInt(inputValue))}
          disabled={!inputValue}
        >
          Log
        </Button>
      </div>
      {target && currentValue && (
        <div className="text-xs text-ink-light">
          Target: {target} {unit || 'times'} ({Math.round((currentValue / target) * 100)}% achieved)
        </div>
      )}
    </div>
  );
}
