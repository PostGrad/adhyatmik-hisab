/**
 * Custom hooks for habit data access
 * 
 * These hooks use Dexie's useLiveQuery for reactive data binding.
 * When IndexedDB data changes, components using these hooks re-render automatically.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category, Habit, LogEntry, HisabType } from '../types';
import { SHUBH_HISAB_ID, ASHUBH_HISAB_ID } from '../types';

// ============================================================================
// Category Hooks
// ============================================================================

/**
 * Get all categories ordered by their order field
 */
export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => 
    db.categories.orderBy('order').toArray()
  );
}

/**
 * Get a single category by ID
 */
export function useCategory(id: string | undefined): Category | undefined {
  return useLiveQuery(
    () => (id ? db.categories.get(id) : undefined),
    [id]
  );
}

// ============================================================================
// Habit Hooks
// ============================================================================

/**
 * Get all active habits, optionally filtered by category
 */
export function useHabits(categoryId?: string): Habit[] | undefined {
  return useLiveQuery(() => {
    if (categoryId) {
      return db.habits
        .where('categoryId')
        .equals(categoryId)
        .and(h => h.isActive === true)
        .sortBy('order');
    }
    
    // Filter by isActive using .filter() since boolean indexing can be tricky
    return db.habits
      .filter(h => h.isActive === true)
      .sortBy('order');
  }, [categoryId]);
}

/**
 * Get all habits including inactive ones
 */
export function useAllHabits(): Habit[] | undefined {
  return useLiveQuery(() => 
    db.habits.orderBy('order').toArray()
  );
}

/**
 * Get a single habit by ID
 */
export function useHabit(id: string | undefined): Habit | undefined {
  return useLiveQuery(
    () => (id ? db.habits.get(id) : undefined),
    [id]
  );
}

/**
 * Get habits grouped by category
 */
export function useHabitsByCategory(): Map<string, Habit[]> | undefined {
  const habits = useLiveQuery(() => 
    db.habits.filter(h => h.isActive === true).sortBy('order')
  );
  
  if (!habits) return undefined;
  
  const grouped = new Map<string, Habit[]>();
  
  for (const habit of habits) {
    const categoryId = habit.categoryId || 'uncategorized';
    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, []);
    }
    grouped.get(categoryId)!.push(habit);
  }
  
  return grouped;
}

// ============================================================================
// Log Entry Hooks
// ============================================================================

/**
 * Get all log entries for a specific date
 */
export function useLogEntriesForDate(date: string): LogEntry[] | undefined {
  return useLiveQuery(
    () => db.logEntries.where('date').equals(date).toArray(),
    [date]
  );
}

/**
 * Get log entries for a specific habit
 */
export function useLogEntriesForHabit(habitId: string): LogEntry[] | undefined {
  return useLiveQuery(
    () => db.logEntries.where('habitId').equals(habitId).sortBy('date'),
    [habitId]
  );
}

/**
 * Get a single log entry for a habit on a specific date
 */
export function useLogEntry(habitId: string, date: string): LogEntry | undefined {
  return useLiveQuery(
    () => db.logEntries
      .where('[habitId+date]')
      .equals([habitId, date])
      .first(),
    [habitId, date]
  );
}

/**
 * Get log entries for a date range
 */
export function useLogEntriesInRange(
  startDate: string,
  endDate: string
): LogEntry[] | undefined {
  return useLiveQuery(
    () => db.logEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray(),
    [startDate, endDate]
  );
}

// ============================================================================
// Combined Hooks
// ============================================================================

/**
 * Get habits with their log entries for a specific date
 * Useful for the daily logging view
 */
export function useHabitsWithLogs(date: string, hisabType?: HisabType) {
  const categoryId = hisabType === 'shubh' ? SHUBH_HISAB_ID : 
                     hisabType === 'ashubh' ? ASHUBH_HISAB_ID : undefined;
  
  const habits = useLiveQuery(() => {
    if (categoryId) {
      return db.habits
        .filter(h => h.isActive === true && h.categoryId === categoryId)
        .sortBy('order');
    }
    return db.habits.filter(h => h.isActive === true).sortBy('order');
  }, [categoryId]);
  
  const logs = useLiveQuery(
    () => db.logEntries.where('date').equals(date).toArray(),
    [date]
  );
  
  if (!habits || !logs) return undefined;
  
  // Create a map for quick log lookup
  const logMap = new Map<string, LogEntry>();
  for (const log of logs) {
    logMap.set(log.habitId, log);
  }
  
  return habits.map(habit => ({
    habit,
    log: logMap.get(habit.id),
  }));
}

/**
 * Get habits by hisab type (shubh or ashubh)
 */
export function useHabitsByHisab(hisabType: HisabType): Habit[] | undefined {
  const categoryId = hisabType === 'shubh' ? SHUBH_HISAB_ID : ASHUBH_HISAB_ID;
  
  return useLiveQuery(
    () => db.habits
      .filter(h => h.isActive === true && h.categoryId === categoryId)
      .sortBy('order'),
    [categoryId]
  );
}

/**
 * Get categories with their habits for the manage view
 */
export function useCategoriesWithHabits() {
  const categories = useLiveQuery(() => 
    db.categories.orderBy('order').toArray()
  );
  
  const habits = useLiveQuery(() => 
    db.habits.filter(h => h.isActive === true).sortBy('order')
  );
  
  if (!categories || !habits) return undefined;
  
  // Group habits by category
  const habitsByCategory = new Map<string, Habit[]>();
  for (const habit of habits) {
    const categoryId = habit.categoryId || 'uncategorized';
    if (!habitsByCategory.has(categoryId)) {
      habitsByCategory.set(categoryId, []);
    }
    habitsByCategory.get(categoryId)!.push(habit);
  }
  
  return categories.map(category => ({
    category,
    habits: habitsByCategory.get(category.id) || [],
  }));
}

// ============================================================================
// Stats Hooks
// ============================================================================

/**
 * Get completion stats for a specific date
 */
export function useDailyStats(date: string) {
  const habitsWithLogs = useHabitsWithLogs(date);
  
  if (!habitsWithLogs) return undefined;
  
  const totalHabits = habitsWithLogs.length;
  const completedHabits = habitsWithLogs.filter(({ log }) => {
    if (!log) return false;
    if (log.skippedReason) return false;
    if (typeof log.value === 'boolean') return log.value;
    return true; // For rating, time, count - any logged value counts
  }).length;
  
  return {
    date,
    totalHabits,
    completedHabits,
    completionRate: totalHabits > 0 ? completedHabits / totalHabits : 0,
  };
}

