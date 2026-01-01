/**
 * Utility functions
 */

import { format, isToday, isYesterday, isTomorrow, parseISO } from 'date-fns';

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a date string (YYYY-MM-DD) for display
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr);
  
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  
  return format(date, 'EEEE, MMM d');
}

/**
 * Format a date string for short display (e.g., in calendars)
 */
export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

/**
 * Format a date string to show day of week
 */
export function formatDayOfWeek(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE');
}

/**
 * Format time duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number with appropriate suffix (1.2k, 1.5M, etc)
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Format a percentage (0-1 to "85%")
 */
export function formatPercentage(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ============================================================================
// PIN Hashing
// ============================================================================

/**
 * Hash a PIN for storage
 * Note: This is a convenience lock, not cryptographic security
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'adhyatmik-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against stored hash
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}

// ============================================================================
// Classname Helper
// ============================================================================

/**
 * Combine class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// Debounce
// ============================================================================

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================================
// Color Helpers
// ============================================================================

/**
 * Adjust color brightness
 */
export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * Get contrasting text color for a background
 */
export function getContrastColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#2D2926' : '#FFFFFF';
}

// ============================================================================
// Array Helpers
// ============================================================================

/**
 * Group array items by a key
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Move an item in an array from one index to another
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a string is a valid YYYY-MM-DD date
 */
export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
}

/**
 * Check if a 4-digit PIN is valid
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

