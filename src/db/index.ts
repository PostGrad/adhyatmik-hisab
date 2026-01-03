/**
 * Database Schema - Dexie.js IndexedDB Wrapper
 * 
 * This is the single source of truth for all persistent data.
 * We use Dexie for its excellent React integration (useLiveQuery)
 * and painless schema migrations.
 */

import Dexie, { type Table } from 'dexie';
import type { Category, Habit, LogEntry, AppSettings } from '../types';
import { SHUBH_HISAB_ID, ASHUBH_HISAB_ID } from '../types';

// ============================================================================
// Schema Version Constants
// ============================================================================

/**
 * Current database schema version
 * Increment this when making schema changes
 */
export const CURRENT_DB_VERSION = 2;

/**
 * Current app version (semantic versioning)
 * Update this in package.json and sync here
 */
export const CURRENT_APP_VERSION = '1.0.0';

// ============================================================================
// Database Class
// ============================================================================

export class AdhyatmikDatabase extends Dexie {
  categories!: Table<Category, string>;
  habits!: Table<Habit, string>;
  logEntries!: Table<LogEntry, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('adhyatmik-hisab');

    // Schema definition v1 - original schema
    this.version(1).stores({
      categories: 'id, order',
      habits: 'id, categoryId, order, isActive',
      logEntries: 'id, habitId, date, [date+habitId], [habitId+date]',
      settings: 'key',
    });

    // Schema definition v2 - added new fields for Shubh/Ashubh Hisab and tracking intervals
    this.version(2).stores({
      categories: 'id, order, hisabType',
      habits: 'id, categoryId, order, isActive, interval',
      logEntries: 'id, habitId, date, [date+habitId], [habitId+date]',
      settings: 'key',
    }).upgrade(async (tx) => {
      // Migration v1 → v2: Add new fields with defaults
      
      // Migrate categories: Add hisabType field
      await tx.table('categories').toCollection().modify((category) => {
        // Default to 'shubh' for existing categories (backward compatibility)
        if (!('hisabType' in category)) {
          category.hisabType = 'shubh';
        }
      });

      // Migrate habits: Add interval, trackingDay, trackingDate, reminderEnabled fields
      await tx.table('habits').toCollection().modify((habit) => {
        // Default to 'daily' interval for existing habits
        if (!('interval' in habit)) {
          habit.interval = 'daily';
        }
        // Initialize optional tracking fields
        if (!('trackingDay' in habit)) {
          habit.trackingDay = undefined;
        }
        if (!('trackingDate' in habit)) {
          habit.trackingDate = undefined;
        }
        // Default reminder to disabled
        if (!('reminderEnabled' in habit)) {
          habit.reminderEnabled = false;
        }
        if (!('reminderTime' in habit)) {
          habit.reminderTime = undefined;
        }
      });
    });

    // Hooks for automatic timestamps
    this.logEntries.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.logEntries.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.categories.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
    });

    this.habits.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
    });
  }
}

// Singleton instance
export const db = new AdhyatmikDatabase();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for new records
 * Uses a simple but effective approach for offline-first
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomPart}`;
}

/**
 * Format date to YYYY-MM-DD for consistent storage
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string back to Date
 */
export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ============================================================================
// Seed Default Categories
// ============================================================================

/**
 * Seed the two fixed categories if they don't exist
 */
export async function seedDefaultCategories(): Promise<void> {
  try {
    // Check if both fixed categories exist
    const shubhExists = await db.categories.get(SHUBH_HISAB_ID);
    const ashubhExists = await db.categories.get(ASHUBH_HISAB_ID);

    // If both exist, we're done
    if (shubhExists && ashubhExists) {
      return;
    }

    await db.transaction('rw', db.categories, db.settings, async () => {
      // Shubh Hisab - Good Habits (to be done)
      if (!shubhExists) {
        await db.categories.put({
          id: SHUBH_HISAB_ID,
          name: 'Shubh Hisab',
          nameHindi: 'शुभ हिसाब',
          color: '#3A9173',
          icon: '🙏',
          order: 0,
          isFixed: true,
          hisabType: 'shubh',
          createdAt: new Date(),
        });
      }

      // Ashubh Hisab - Bad Habits (to be avoided)
      if (!ashubhExists) {
        await db.categories.put({
          id: ASHUBH_HISAB_ID,
          name: 'Ashubh Hisab',
          nameHindi: 'अशुभ हिसाब',
          color: '#DC2626',
          icon: '⚠️',
          order: 1,
          isFixed: true,
          hisabType: 'ashubh',
          createdAt: new Date(),
        });
      }

      await db.settings.put({ key: 'hasSeededCategories', value: true });
    });

    console.log('Default categories seeded successfully');
  } catch (error) {
    console.error('Failed to seed default categories:', error);
    throw error;
  }
}

// ============================================================================
// Settings Helpers
// ============================================================================

const DEFAULT_SETTINGS_VALUES: AppSettings = {
  pinHash: null,
  pinEnabled: false,
  autoLockTimeout: 5,
  theme: 'system',
  startOfWeek: 0,
  googleBackupEnabled: false,
  lastBackupAt: null,
  autoBackupEnabled: false,
  hasCompletedOnboarding: false,
  hasSeededCategories: false,
  appVersion: '1.0.0',
};

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof AppSettings>(
  key: K
): Promise<AppSettings[K]> {
  const record = await db.settings.get(key);
  if (record === undefined) {
    return DEFAULT_SETTINGS_VALUES[key];
  }
  return record.value as AppSettings[K];
}

/**
 * Set a specific setting value
 */
export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  await db.settings.put({ key, value });
}

/**
 * Get all settings as an object
 */
export async function getAllSettings(): Promise<AppSettings> {
  const records = await db.settings.toArray();
  const settings = { ...DEFAULT_SETTINGS_VALUES };
  
  for (const record of records) {
    if (record.key in settings) {
      (settings as Record<string, unknown>)[record.key] = record.value;
    }
  }
  
  return settings;
}

// ============================================================================
// Category Operations
// ============================================================================

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'order' | 'isFixed'>): Promise<string> {
  const maxOrder = await db.categories.orderBy('order').last();
  const order = maxOrder ? maxOrder.order + 1 : 0;
  
  const id = generateId();
  await db.categories.add({
    ...data,
    id,
    order,
    isFixed: false,
    createdAt: new Date(),
  });
  
  return id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await db.categories.update(id, data);
}

export async function deleteCategory(id: string): Promise<void> {
  // Check if fixed category
  const category = await db.categories.get(id);
  if (category?.isFixed) {
    throw new Error('Cannot delete fixed category');
  }
  
  // Move all habits to Shubh Hisab
  await db.habits.where('categoryId').equals(id).modify({ categoryId: SHUBH_HISAB_ID });
  await db.categories.delete(id);
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.categories.update(orderedIds[i], { order: i });
    }
  });
}

// ============================================================================
// Habit Operations
// ============================================================================

export async function createHabit(data: Omit<Habit, 'id' | 'createdAt' | 'order' | 'isActive'>): Promise<string> {
  const maxOrder = await db.habits
    .where('categoryId')
    .equals(data.categoryId)
    .filter(h => h.isActive === true)
    .last();
  
  const order = maxOrder ? maxOrder.order + 1 : 0;
  
  const id = generateId();
  await db.habits.add({
    ...data,
    id,
    order,
    isActive: true,
    createdAt: new Date(),
  });
  
  return id;
}

export async function updateHabit(id: string, data: Partial<Habit>): Promise<void> {
  await db.habits.update(id, data);
}

export async function archiveHabit(id: string): Promise<void> {
  await db.habits.update(id, { isActive: false });
}

export async function disableHabit(id: string): Promise<void> {
  await db.habits.update(id, { isActive: false });
}

export async function enableHabit(id: string): Promise<void> {
  await db.habits.update(id, { isActive: true });
}

export async function deleteHabit(id: string, deleteEntries = false): Promise<void> {
  await db.transaction('rw', [db.habits, db.logEntries], async () => {
    if (deleteEntries) {
      await db.logEntries.where('habitId').equals(id).delete();
    }
    await db.habits.delete(id);
  });
}

export async function reorderHabits(_categoryId: string, orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.habits, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.habits.update(orderedIds[i], { order: i });
    }
  });
}

// ============================================================================
// Log Entry Operations
// ============================================================================

export async function logHabit(
  habitId: string,
  date: string,
  value: boolean | string | number,
  note?: string
): Promise<string> {
  // Check if entry already exists for this habit+date
  const existing = await db.logEntries
    .where('[habitId+date]')
    .equals([habitId, date])
    .first();
  
  if (existing) {
    // Update existing entry
    await db.logEntries.update(existing.id, {
      value,
      note,
      updatedAt: new Date(),
    });
    return existing.id;
  }
  
  // Create new entry
  const id = generateId();
  await db.logEntries.add({
    id,
    habitId,
    date,
    value,
    note,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return id;
}

export async function skipHabit(
  habitId: string,
  date: string,
  reason: string
): Promise<string> {
  const existing = await db.logEntries
    .where('[habitId+date]')
    .equals([habitId, date])
    .first();
  
  if (existing) {
    await db.logEntries.update(existing.id, {
      skippedReason: reason,
      updatedAt: new Date(),
    });
    return existing.id;
  }
  
  const id = generateId();
  await db.logEntries.add({
    id,
    habitId,
    date,
    value: false,
    skippedReason: reason,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return id;
}

export async function getLogEntriesForDate(date: string): Promise<LogEntry[]> {
  return db.logEntries.where('date').equals(date).toArray();
}

export async function getLogEntriesForHabit(
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<LogEntry[]> {
  const query = db.logEntries.where('habitId').equals(habitId);
  
  if (startDate && endDate) {
    const entries = await query.toArray();
    return entries.filter(e => e.date >= startDate && e.date <= endDate);
  }
  
  return query.toArray();
}

export async function getLogEntriesInRange(
  startDate: string,
  endDate: string
): Promise<LogEntry[]> {
  return db.logEntries
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

// ============================================================================
// Statistics Helpers
// ============================================================================

export async function calculateStreak(habitId: string, upToDate: string): Promise<number> {
  const entries = await db.logEntries
    .where('habitId')
    .equals(habitId)
    .filter(e => e.date <= upToDate && e.value === true)
    .sortBy('date');
  
  if (entries.length === 0) return 0;
  
  // Work backwards from the most recent entry
  entries.reverse();
  let streak = 0;
  const expectedDate = new Date(upToDate);
  
  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor(
      (expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays === 0) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays === 1) {
      streak++;
      expectedDate.setTime(entryDate.getTime());
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// ============================================================================
// Data Export/Import
// ============================================================================

export interface ExportData {
  version: string;
  schemaVersion: number;
  exportedAt: string;
  categories: Category[];
  habits: Habit[];
  logEntries: LogEntry[];
  settings: Array<{ key: string; value: unknown }>;
}

export async function exportAllData(): Promise<ExportData> {
  const [categories, habits, logEntries, settings] = await Promise.all([
    db.categories.toArray(),
    db.habits.toArray(),
    db.logEntries.toArray(),
    db.settings.toArray(),
  ]);
  
  return {
    version: CURRENT_APP_VERSION,
    schemaVersion: CURRENT_DB_VERSION,
    exportedAt: new Date().toISOString(),
    categories,
    habits,
    logEntries,
    settings,
  };
}

export async function importAllData(data: ExportData): Promise<void> {
  await db.transaction('rw', [db.categories, db.habits, db.logEntries, db.settings], async () => {
    // Check if imported data is from older schema version
    const importedSchemaVersion = data.schemaVersion || 1;
    
    if (importedSchemaVersion < CURRENT_DB_VERSION) {
      console.warn(
        `Importing data from schema v${importedSchemaVersion}, current is v${CURRENT_DB_VERSION}. ` +
        'Data will be migrated automatically during import.'
      );
    }
    
    // Clear existing data
    await Promise.all([
      db.categories.clear(),
      db.habits.clear(),
      db.logEntries.clear(),
      db.settings.clear(),
    ]);
    
    // Import new data - Dexie will automatically apply migrations if needed
    // We use bulkPut instead of bulkAdd to handle potential ID conflicts
    await Promise.all([
      db.categories.bulkPut(data.categories),
      db.habits.bulkPut(data.habits),
      db.logEntries.bulkPut(data.logEntries),
      db.settings.bulkPut(data.settings),
    ]);
    
    // Ensure default categories exist after import
    await seedDefaultCategories();
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.categories, db.habits, db.logEntries, db.settings], async () => {
    await Promise.all([
      db.categories.clear(),
      db.habits.clear(),
      db.logEntries.clear(),
      db.settings.clear(),
    ]);
  });
  
  // Re-seed default categories
  await seedDefaultCategories();
}
