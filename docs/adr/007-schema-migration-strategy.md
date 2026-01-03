# ADR-007: Schema Migration Strategy

**Status:** Accepted
**Date:** 2026-01-02

## Context

As the PWA evolves, we'll need to add new fields, change data types, or restructure our data. This affects:

1. **IndexedDB** (local storage via Dexie.js)
2. **Google Sheets** (cloud backup)

Without a migration strategy, schema changes will:

- ❌ Break existing user data
- ❌ Cause sync failures between local and cloud
- ❌ Lose data during app updates
- ❌ Prevent backward compatibility

## Decision

### Strategy: Versioned Schema with Explicit Migrations

We'll use a **dual-versioning system**:

1. **App Version** (`appVersion` in settings) - tracks overall app releases
2. **Schema Version** (Dexie DB version) - tracks database structure changes
3. **Sheet Schema Version** (metadata in Google Sheets) - tracks cloud backup format

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERSIONING LAYERS                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  App Version (1.0.0, 1.1.0, 2.0.0)                      │   │
│  │  └── Semantic versioning for releases                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IndexedDB Schema Version (1, 2, 3...)                   │   │
│  │  └── Dexie version() - tracks DB structure              │   │
│  │  └── Migration functions transform old → new data       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Google Sheets Schema Version (1, 2, 3...)              │   │
│  │  └── Stored in _metadata sheet                          │   │
│  │  └── Column mapping for backward compatibility           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## IndexedDB Migration Strategy

### How Dexie Migrations Work

Dexie automatically detects when the database version changes and runs migrations:

```typescript
// Current: v2
this.version(1).stores({ ... });  // Old schema
this.version(2).stores({ ... });  // New schema
this.version(2).upgrade(async (tx) => {
  // Migration logic runs ONCE when upgrading from v1 → v2
});
```

### Migration Rules

1. **Never delete old versions** - Keep all `version(N)` definitions
2. **Always add new versions** - Increment version number for each change
3. **Transform data explicitly** - Use `upgrade()` callback to migrate existing records
4. **Default values** - New fields get defaults if missing
5. **Test migrations** - Always test with real data from previous version

### Example: Adding `trackingInterval` Field

```typescript
// v1: No trackingInterval field
this.version(1).stores({
  habits: 'id, categoryId, order, isActive',
});

// v2: Add trackingInterval
this.version(2).stores({
  habits: 'id, categoryId, order, isActive, interval',
});

this.version(2).upgrade(async (tx) => {
  // Migrate all existing habits
  await tx.table('habits').toCollection().modify((habit) => {
    // Set default for old habits
    if (!habit.interval) {
      habit.interval = 'daily';  // Default value
    }
  });
});
```

### Migration Best Practices

```typescript
this.version(3).upgrade(async (tx) => {
  // ✅ DO: Transform existing data
  await tx.table('habits').toCollection().modify((habit) => {
    habit.newField = calculateFromOldField(habit.oldField);
  });
  
  // ✅ DO: Handle missing fields gracefully
  await tx.table('habits').toCollection().modify((habit) => {
    if (!habit.optionalField) {
      habit.optionalField = defaultValue;
    }
  });
  
  // ❌ DON'T: Delete data without user consent
  // ❌ DON'T: Change IDs (breaks relationships)
  // ❌ DON'T: Assume all records have new fields
});
```

## Google Sheets Migration Strategy

### Problem: Fixed Column Structure

Google Sheets has a fixed column structure. If we add a new field to `Habit`, the sheet columns won't match.

### Solution: Versioned Column Mapping

We store the **schema version** in the `_metadata` sheet and use **column mapping** during sync:

```
┌─────────────────────────────────────────────────────────────────┐
│              GOOGLE SHEETS STRUCTURE                             │
│                                                                  │
│  Sheet: _metadata                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  key              │ value                                │   │
│  ├──────────────────┼───────────────────────────────────────┤   │
│  │  schemaVersion   │ 2                                     │   │
│  │  appVersion      │ 1.2.0                                 │   │
│  │  lastSyncAt      │ 2026-01-15T10:30:00Z                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Sheet: Habits                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  id │ name │ categoryId │ ... │ interval │ trackingDay │   │
│  │     │      │            │     │ (v2)     │ (v2)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Column Mapping Strategy

```typescript
// Define column schemas for each version
const SCHEMA_VERSIONS = {
  1: {
    habits: ['id', 'name', 'categoryId', 'type', 'order', 'isActive'],
  },
  2: {
    habits: ['id', 'name', 'categoryId', 'type', 'order', 'isActive', 
             'interval', 'trackingDay', 'trackingDate'],
  },
  3: {
    habits: ['id', 'name', 'categoryId', 'type', 'order', 'isActive',
             'interval', 'trackingDay', 'trackingDate', 'reminderEnabled'],
  },
};

// During sync:
async function syncToSheets() {
  const currentVersion = await getSheetSchemaVersion();
  const columns = SCHEMA_VERSIONS[currentVersion].habits;
  
  // Read existing sheet
  const existingRows = await readSheet('Habits');
  
  // If sheet version < app version, upgrade sheet
  if (currentVersion < APP_SCHEMA_VERSION) {
    await upgradeSheetSchema(currentVersion, APP_SCHEMA_VERSION);
  }
  
  // Write data using current column mapping
  await writeSheet('Habits', columns, data);
}
```

### Sheet Upgrade Process

```typescript
async function upgradeSheetSchema(fromVersion: number, toVersion: number) {
  // 1. Read all data from old column structure
  const oldData = await readSheetWithMapping('Habits', fromVersion);
  
  // 2. Add new columns to sheet
  await addColumnsToSheet('Habits', SCHEMA_VERSIONS[toVersion].habits);
  
  // 3. Transform data (add defaults for new fields)
  const newData = oldData.map(record => ({
    ...record,
    ...getDefaultValuesForVersion(toVersion),
  }));
  
  // 4. Write transformed data
  await writeSheet('Habits', SCHEMA_VERSIONS[toVersion].habits, newData);
  
  // 5. Update metadata version
  await updateSheetMetadata('schemaVersion', toVersion);
}
```

### Backward Compatibility

When reading from sheets:

```typescript
async function readSheetWithMapping(sheetName: string, version: number) {
  const columns = SCHEMA_VERSIONS[version][sheetName];
  const rows = await readSheet(sheetName);
  
  // Map rows to objects using version-specific columns
  return rows.map((row, index) => {
    const record: any = {};
    columns.forEach((col, i) => {
      record[col] = row[i] || getDefaultValue(col, version);
    });
    return record;
  });
}
```

## Migration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP UPDATE FLOW                                │
│                                                                  │
│  1. User opens updated app                                      │
│     └── App version: 1.0.0 → 1.1.0                             │
│                         │                                        │
│                         ▼                                        │
│  2. Dexie detects DB version mismatch                            │
│     └── Current DB: v1, Required: v2                             │
│                         │                                        │
│                         ▼                                        │
│  3. Run IndexedDB migrations                                     │
│     └── v1 → v2: Add trackingInterval field                     │
│     └── Transform existing habits                                │
│                         │                                        │
│                         ▼                                        │
│  4. Check Google Sheets schema version                           │
│     └── Read _metadata sheet                                    │
│                         │                                        │
│                         ▼                                        │
│  5. If sheet version < app version:                             │
│     └── Upgrade sheet columns                                   │
│     └── Transform sheet data                                    │
│     └── Update _metadata                                        │
│                         │                                        │
│                         ▼                                        │
│  6. Sync resumes with new schema                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Breaking Changes Policy

### Non-Breaking Changes (Safe)

- ✅ Adding optional fields (with defaults)
- ✅ Adding new tables/collections
- ✅ Adding indexes
- ✅ Changing field types if compatible (string → number with parsing)

### Breaking Changes (Require Care)

- ⚠️ Removing fields (deprecate first, remove later)
- ⚠️ Changing field types incompatibly
- ⚠️ Renaming fields (use aliases during migration)
- ⚠️ Changing ID format (requires full data migration)

### Deprecation Strategy

```typescript
// v2: Deprecate oldField, add newField
this.version(2).upgrade(async (tx) => {
  await tx.table('habits').toCollection().modify((habit) => {
    // Migrate old → new
    habit.newField = habit.oldField || defaultValue;
    // Keep oldField for backward compatibility (remove in v3)
  });
});

// v3: Remove oldField
this.version(3).upgrade(async (tx) => {
  await tx.table('habits').toCollection().modify((habit) => {
    delete habit.oldField;  // Safe to remove after v2 migration
  });
});
```

## Testing Migrations

### Test Checklist

1. ✅ Create database with old schema version
2. ✅ Populate with realistic test data
3. ✅ Run migration
4. ✅ Verify all data transformed correctly
5. ✅ Verify new fields have correct defaults
6. ✅ Test sync with Google Sheets (both directions)
7. ✅ Test rollback scenario (if possible)

### Migration Test Helper

```typescript
async function testMigration(fromVersion: number, toVersion: number) {
  // 1. Create old DB
  const oldDb = await createDatabaseAtVersion(fromVersion);
  await populateTestData(oldDb);
  
  // 2. Upgrade
  await upgradeDatabase(oldDb, toVersion);
  
  // 3. Verify
  const habits = await oldDb.habits.toArray();
  habits.forEach(habit => {
    assert(habit.interval !== undefined, 'trackingInterval must exist');
    assert(habit.interval === 'daily' || habit.interval === 'weekly', 
           'valid interval');
  });
}
```

## Consequences

### Positive

- ✅ Smooth upgrades for users (no data loss)
- ✅ Backward compatibility maintained
- ✅ Can sync between different app versions
- ✅ Clear migration path documented

### Negative

- ⚠️ Migration code adds complexity
- ⚠️ Must test migrations thoroughly
- ⚠️ Sheet upgrades require API calls (slower)
- ⚠️ Need to maintain multiple schema versions

### Risks

- **Migration failures** could corrupt data
  - Mitigated by: Transaction-based migrations, backup before upgrade
- **Sheet sync breaks** if versions mismatch
  - Mitigated by: Version detection and automatic upgrade
- **Performance** degradation with many migrations
  - Mitigated by: Batch migrations, optimize upgrade logic

## Implementation Notes

### Current Schema Versions

- **IndexedDB**: v2 (supports `hisabType`, `interval`, `trackingDay`, `trackingDate`)
- **Google Sheets**: Not yet implemented (will start at v1)
- **App Version**: 1.0.0

### Future Migration Examples

**v3 Migration** (hypothetical - adding tags):

```typescript
this.version(3).stores({
  habits: 'id, categoryId, order, isActive, interval, tags',
});

this.version(3).upgrade(async (tx) => {
  await tx.table('habits').toCollection().modify((habit) => {
    habit.tags = [];  // Initialize empty tags array
  });
});
```

**v4 Migration** (hypothetical - adding reminder fields):

```typescript
this.version(4).stores({
  habits: 'id, categoryId, order, isActive, interval, reminderEnabled',
});

this.version(4).upgrade(async (tx) => {
  await tx.table('habits').toCollection().modify((habit) => {
    habit.reminderEnabled = false;  // Default: no reminders
    habit.reminderTime = null;
  });
});
```

## References

- [Dexie.js Migrations Guide](https://dexie.org/docs/Tutorial/Design#database-versioning)
- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [Semantic Versioning](https://semver.org/)
