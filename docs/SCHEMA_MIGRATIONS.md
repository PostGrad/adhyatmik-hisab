# Schema Migration Guide

## Quick Answer to Your Question

**Q: How to handle schema changes as our PWA evolves? Will it break due to earlier defined IndexedDB and sheet columns?**

**A: No, it won't break!** We've implemented a comprehensive migration strategy:

### ✅ IndexedDB Migrations (Automatic)

- **Dexie.js handles versioning automatically**
- When you add new fields, increment the DB version
- Migration functions transform old data → new format
- **Existing data is preserved and upgraded automatically**

### ✅ Google Sheets Migrations (Planned)

- **Versioned column mapping** - each schema version has its column layout
- **Automatic sheet upgrades** - when syncing, detect version mismatch and upgrade
- **Backward compatibility** - can read old sheet formats and transform them

## How It Works

### Example: Adding a New Field

Let's say we want to add a `tags` field to habits:

**Step 1: Update TypeScript Types**
```typescript
// src/types/index.ts
export interface Habit {
  // ... existing fields
  tags?: string[];  // NEW FIELD
}
```

**Step 2: Update Database Schema**
```typescript
// src/db/index.ts

// Increment version
export const CURRENT_DB_VERSION = 3;

// Add new version definition
this.version(3).stores({
  habits: 'id, categoryId, order, isActive, interval, tags',
});

// Add migration function
this.version(3).upgrade(async (tx) => {
  await tx.table('habits').toCollection().modify((habit) => {
    // Set default for existing habits
    if (!habit.tags) {
      habit.tags = [];
    }
  });
});
```

**Step 3: Update Google Sheets Schema** (when implementing backup)
```typescript
// src/services/sheetsSchema.ts

export const CURRENT_SHEET_SCHEMA_VERSION = 2;

export const SHEET_SCHEMA_VERSIONS = {
  // ... existing versions
  2: {
    habits: [
      // ... existing columns
      'tags',  // NEW COLUMN
    ],
  },
};
```

**Result:**
- ✅ Old databases automatically upgrade to v3
- ✅ Existing habits get `tags: []` by default
- ✅ New habits can have tags
- ✅ Google Sheets sync works with version detection

## Current Schema Versions

- **IndexedDB**: v2 (supports `hisabType`, `interval`, `trackingDay`, `trackingDate`)
- **Google Sheets**: v1 (not yet implemented, will start here)
- **App Version**: 1.0.0

## Migration Rules

### ✅ Safe Changes (Non-Breaking)

- Adding optional fields with defaults
- Adding new tables/collections
- Adding indexes
- Changing field types if compatible

### ⚠️ Careful Changes (Breaking)

- Removing fields (deprecate first, remove later)
- Changing field types incompatibly
- Renaming fields (use aliases)
- Changing ID format

## Testing Migrations

Before deploying a migration:

1. ✅ Create test database with old schema
2. ✅ Populate with realistic data
3. ✅ Run migration
4. ✅ Verify all data transformed correctly
5. ✅ Test sync with Google Sheets (when implemented)

## Files to Update When Adding Fields

1. **`src/types/index.ts`** - Add field to TypeScript interface
2. **`src/db/index.ts`** - Increment version, add migration
3. **`src/services/sheetsSchema.ts`** - Add column mapping (for backup)
4. **`docs/adr/007-schema-migration-strategy.md`** - Document the change

## See Also

- [ADR-007: Schema Migration Strategy](./adr/007-schema-migration-strategy.md) - Full technical details
- [Dexie.js Migrations Guide](https://dexie.org/docs/Tutorial/Design#database-versioning)

