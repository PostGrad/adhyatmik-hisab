/**
 * Core type definitions for Adhyatmik Hisab
 * 
 * These types define the shape of data throughout the application.
 * All IDs use nanoid format for offline-first generation.
 */

// ============================================================================
// Fixed Category IDs
// ============================================================================

/**
 * The two fixed categories in Adhyatmik Hisab:
 * - shubh: Shubh Hisab (Good Habits) - habits to be done/completed
 * - ashubh: Ashubh Hisab (Bad Habits) - habits to be avoided
 */
export const SHUBH_HISAB_ID = 'shubh-hisab';
export const ASHUBH_HISAB_ID = 'ashubh-hisab';

export type HisabType = 'shubh' | 'ashubh';

// ============================================================================
// Habit Tracking Types
// ============================================================================

/**
 * The four types of habit tracking supported:
 * - boolean: Simple yes/no completion
 * - rating: Quality-based options (e.g., Best/Good/Okay/Poor)
 * - time: Duration tracking in minutes
 * - count: Numerical value tracking (e.g., mantras counted)
 */
export type HabitType = 'boolean' | 'rating' | 'time' | 'count';

/**
 * Tracking interval - how often the habit should be tracked
 */
export type TrackingInterval = 'daily' | 'weekly' | 'monthly';

/**
 * Category for organizing habits into groups
 */
export interface Category {
  id: string;
  name: string;
  nameHindi?: string;  // Hindi name for display
  color: string;       // Hex color for visual distinction
  icon: string;        // Emoji or icon identifier
  order: number;       // Display order (0-indexed)
  isFixed: boolean;    // Fixed categories cannot be deleted
  hisabType: HisabType; // Whether it's for good or bad habits
  createdAt: Date;
}

/**
 * Day of week type (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A habit definition - what the user wants to track
 */
export interface Habit {
  id: string;
  name: string;
  description?: string;
  image?: string;      // Optional image URL or base64
  categoryId: string;
  type: HabitType;
  
  // Type-specific configuration
  options?: string[];   // For 'rating' type - the available options
  unit?: string;        // For 'time' (e.g., "minutes") or 'count' (e.g., "times")
  target?: number;      // Daily target for time/count types
  
  // Tracking configuration
  interval: TrackingInterval;  // How often to track
  trackingDay?: DayOfWeek;     // Day of week for weekly tracking (0=Sun, 6=Sat)
  trackingDate?: number;       // Date of month for monthly tracking (1-31)
  reminderEnabled: boolean;    // Whether reminder is enabled
  reminderTime?: string;       // HH:mm format
  
  order: number;        // Display order within category
  isActive: boolean;    // Inactive habits are hidden but data preserved
  createdAt: Date;
}

/**
 * A single log entry - records a habit completion for a specific date
 * 
 * The value type depends on the habit type:
 * - boolean habit → boolean value
 * - rating habit → string value (one of the options)
 * - time habit → number value (minutes)
 * - count habit → number value
 */
export interface LogEntry {
  id: string;
  habitId: string;
  date: string;         // YYYY-MM-DD format for easy indexing
  value: boolean | string | number;
  note?: string;        // Optional notes about this entry
  skippedReason?: string; // If skipped, why?
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Value Types for Each Habit Type
// ============================================================================

export interface BooleanLogValue {
  type: 'boolean';
  value: boolean;
}

export interface RatingLogValue {
  type: 'rating';
  value: string;
}

export interface TimeLogValue {
  type: 'time';
  value: number;  // minutes
}

export interface CountLogValue {
  type: 'count';
  value: number;
}

export type TypedLogValue = BooleanLogValue | RatingLogValue | TimeLogValue | CountLogValue;

// ============================================================================
// Settings & Configuration
// ============================================================================

export interface AppSettings {
  // Security
  pinHash: string | null;
  pinEnabled: boolean;
  autoLockTimeout: number;  // minutes, 0 = disabled
  
  // Display
  theme: 'light' | 'dark' | 'system';
  startOfWeek: 0 | 1;  // 0 = Sunday, 1 = Monday
  
  // Backup
  googleBackupEnabled: boolean;
  lastBackupAt: Date | null;
  autoBackupEnabled: boolean;
  
  // Authentication
  firebaseUserId: string | null;  // Firebase user ID after signup
  hasSignedUp: boolean;  // Whether user has completed Google signup
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  hasSeededCategories: boolean;  // Whether default categories have been created
  appVersion: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  pinHash: null,
  pinEnabled: false,
  autoLockTimeout: 5,
  theme: 'system',
  startOfWeek: 0,
  googleBackupEnabled: false,
  lastBackupAt: null,
  autoBackupEnabled: false,
  firebaseUserId: null,
  hasSignedUp: false,
  hasCompletedOnboarding: false,
  hasSeededCategories: false,
  appVersion: '1.0.0',
};

// ============================================================================
// Google Auth Types
// ============================================================================

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // Unix timestamp in ms
  scope: string;
}

// ============================================================================
// Analytics & Reports
// ============================================================================

export interface DailyStats {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;  // 0-1
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;  // 0-1
  averageValue?: number;   // For time/count types
}

export interface WeeklyReport {
  weekStart: string;  // YYYY-MM-DD
  weekEnd: string;
  dailyStats: DailyStats[];
  habitStats: HabitStats[];
  overallCompletionRate: number;
}

// ============================================================================
// UI State Types
// ============================================================================

export type TabId = 'today' | 'habits' | 'stats' | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// ============================================================================
// Sync Types
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
  pendingChanges: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface HabitFormData {
  name: string;
  description?: string;
  image?: string;
  categoryId: string;
  type: HabitType;
  options?: string[];
  unit?: string;
  target?: number;
  interval: TrackingInterval;
  trackingDay?: DayOfWeek;
  trackingDate?: number;
  reminderEnabled: boolean;
  reminderTime?: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}
