/**
 * Google Sheets Schema Versioning
 * 
 * This module defines the column structure for each schema version
 * to ensure backward compatibility when syncing with Google Sheets.
 * 
 * When adding new fields to our data types, we need to:
 * 1. Increment CURRENT_SHEET_SCHEMA_VERSION
 * 2. Add new column mapping to SHEET_SCHEMA_VERSIONS
 * 3. Implement upgrade logic in upgradeSheetSchema()
 */

// ============================================================================
// Schema Version Constants
// ============================================================================

/**
 * Current Google Sheets schema version
 * This should match the latest version in SHEET_SCHEMA_VERSIONS
 */
export const CURRENT_SHEET_SCHEMA_VERSION = 1;

/**
 * Sheet schema definitions for each version
 * Maps version number to column arrays for each table
 */
export const SHEET_SCHEMA_VERSIONS: Record<number, {
  categories: string[];
  habits: string[];
  logEntries: string[];
  settings: string[];
}> = {
  1: {
    categories: [
      'id',
      'name',
      'nameHindi',
      'color',
      'icon',
      'order',
      'isFixed',
      'hisabType',
      'createdAt',
    ],
    habits: [
      'id',
      'name',
      'description',
      'image',
      'categoryId',
      'type',
      'options',
      'unit',
      'target',
      'interval',
      'trackingDay',
      'trackingDate',
      'reminderEnabled',
      'reminderTime',
      'order',
      'isActive',
      'createdAt',
    ],
    logEntries: [
      'id',
      'habitId',
      'date',
      'value',
      'note',
      'skippedReason',
      'createdAt',
      'updatedAt',
    ],
    settings: [
      'key',
      'value',
    ],
  },
  // Future versions will be added here:
  // 2: { ... },
};

// ============================================================================
// Default Values for Missing Fields
// ============================================================================

/**
 * Get default values for a specific schema version
 * Used when reading data from older sheet versions
 */
export function getDefaultValuesForVersion(version: number): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    1: {
      categories: {
        nameHindi: '',
        isFixed: false,
        hisabType: 'shubh',
      },
      habits: {
        description: '',
        image: '',
        options: null,
        unit: '',
        target: null,
        interval: 'daily',
        trackingDay: null,
        trackingDate: null,
        reminderEnabled: false,
        reminderTime: null,
      },
      logEntries: {
        note: '',
        skippedReason: '',
      },
    },
  };

  return defaults[version] || {};
}

// ============================================================================
// Schema Upgrade Functions
// ============================================================================

/**
 * Upgrade sheet data from one schema version to another
 * This transforms the data structure to match the new column layout
 */
export function upgradeSheetData(
  data: Record<string, unknown>[],
  fromVersion: number,
  toVersion: number,
  tableName: 'categories' | 'habits' | 'logEntries' | 'settings'
): Record<string, unknown>[] {
  if (fromVersion >= toVersion) {
    return data; // No upgrade needed
  }

  const fromColumns = SHEET_SCHEMA_VERSIONS[fromVersion]?.[tableName] || [];
  const toColumns = SHEET_SCHEMA_VERSIONS[toVersion]?.[tableName] || [];
  const defaults = getDefaultValuesForVersion(toVersion)[tableName] || {};

  return data.map((row) => {
    const upgraded: Record<string, unknown> = {};

    // Copy existing fields
    fromColumns.forEach((col) => {
      if (col in row) {
        upgraded[col] = row[col];
      }
    });

    // Add new fields with defaults
    toColumns.forEach((col) => {
      if (!(col in upgraded)) {
        upgraded[col] = defaults[col] ?? null;
      }
    });

    return upgraded;
  });
}

/**
 * Map row data to object using column schema
 * Used when reading from sheets with version-specific column order
 */
export function mapRowToObject(
  row: unknown[],
  columns: string[],
  version: number,
  tableName: 'categories' | 'habits' | 'logEntries' | 'settings'
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const defaults = getDefaultValuesForVersion(version)[tableName] || {};

  columns.forEach((col, index) => {
    const value = row[index];
    // Use default if value is null/undefined/empty string
    obj[col] = value !== null && value !== undefined && value !== '' 
      ? value 
      : (defaults[col] ?? null);
  });

  return obj;
}

/**
 * Map object to row data using column schema
 * Used when writing to sheets with version-specific column order
 */
export function mapObjectToRow(
  obj: Record<string, unknown>,
  columns: string[]
): unknown[] {
  return columns.map((col) => {
    const value = obj[col];
    // Handle special cases
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value); // Serialize arrays as JSON strings
    }
    if (value instanceof Date) {
      return value.toISOString(); // Serialize dates as ISO strings
    }
    return value;
  });
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * Validate that data matches expected schema version
 */
export function validateSchemaVersion(
  data: Record<string, unknown>[],
  columns: string[],
  tableName: 'categories' | 'habits' | 'logEntries' | 'settings'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check that all required columns exist in first row
  const firstRow = data[0];
  columns.forEach((col) => {
    if (!(col in firstRow)) {
      errors.push(`Missing column: ${col}`);
    }
  });

  // Check for unexpected columns (warn only, not error)
  Object.keys(firstRow).forEach((key) => {
    if (!columns.includes(key)) {
      console.warn(`Unexpected column in ${tableName}: ${key}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

