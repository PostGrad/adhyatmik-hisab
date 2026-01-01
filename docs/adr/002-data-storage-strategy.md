# ADR-002: Data Storage Strategy

**Status:** Accepted
**Date:** 2025-12-30

## Context

The app needs to store:

1. Habit definitions (name, type, options, category)
2. Daily log entries (date, habit, value, notes)
3. User settings (theme, PIN hash, backup preferences)

Data characteristics:

- Moderate volume (~100 habits max, ~365 entries/habit/year = ~36,500 entries/year worst case)
- Relational nature (habits have logs, categories have habits)
- Needs to support complex queries (date ranges, aggregations for charts)
- Must work completely offline

## Decision

### Primary Storage: IndexedDB via Dexie.js

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Application Layer                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              React Components                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                 │  │
│  │                          ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │         Dexie.js (IndexedDB Wrapper)                │  │  │
│  │  │  • Promise-based API                                 │  │  │
│  │  │  • Live queries (useLiveQuery hook)                  │  │  │
│  │  │  • Schema versioning & migrations                    │  │  │
│  │  │  • Compound indexes for complex queries              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                 │  │
│  │                          ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              IndexedDB (Browser API)                 │  │  │
│  │  │  • Persistent storage                                │  │  │
│  │  │  • Survives browser close                            │  │  │
│  │  │  • ~50MB-unlimited (browser dependent)               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│     Category     │       │      Habit       │
├──────────────────┤       ├──────────────────┤
│ id: string (PK)  │───┐   │ id: string (PK)  │
│ name: string     │   │   │ name: string     │
│ color: string    │   └──▶│ categoryId: FK   │
│ icon: string     │       │ type: enum       │
│ order: number    │       │ options?: array  │
│ createdAt: Date  │       │ unit?: string    │
└──────────────────┘       │ target?: number  │
                           │ order: number    │
                           │ isActive: bool   │
                           │ createdAt: Date  │
                           └────────┬─────────┘
                                    │
                                    │ 1:N
                                    ▼
┌──────────────────────────────────────────────┐
│                   LogEntry                    │
├──────────────────────────────────────────────┤
│ id: string (PK)                              │
│ habitId: string (FK, indexed)                │
│ date: string (YYYY-MM-DD, indexed)           │
│ value: boolean | string | number             │
│ note?: string                                │
│ skippedReason?: string                       │
│ createdAt: Date                              │
│ updatedAt: Date                              │
└──────────────────────────────────────────────┘

┌──────────────────┐
│    Settings      │
├──────────────────┤
│ key: string (PK) │
│ value: any       │
└──────────────────┘
```

### Indexes Strategy

```typescript
// Compound index for common query pattern: 
// "Get all logs for a date range"
db.logEntries.where('[date+habitId]').between(
  [startDate, Dexie.minKey],
  [endDate, Dexie.maxKey]
)

// Simple index for habit filtering
db.logEntries.where('habitId').equals(habitId)
```

## Alternatives Considered

### 1. localStorage

**Why Not:**

- 5MB limit - will hit it within months of use
- Synchronous API blocks main thread
- No querying capability
- No indexing

### 2. SQLite (via sql.js or wa-sqlite)

**Why Not:**

- Larger bundle size (~400kb wasm)
- More complex setup
- Overkill for our query patterns
- Dexie handles our needs with less overhead

### 3. PouchDB

**Why Not:**

- Designed for CouchDB sync (not using)
- Heavier than Dexie
- More abstraction than needed

### 4. Plain IndexedDB

**Why Not:**

- Callback-based API is painful
- No schema migration helpers
- No React integration
- Would reinvent what Dexie provides

## Consequences

### Positive

- Dexie's `useLiveQuery` gives us reactive data binding to React
- Schema versioning handles future migrations cleanly
- Performance is excellent for our data volumes
- Zero network dependency for core functionality

### Negative

- IndexedDB storage can be cleared by browser in low-storage situations
  - Mitigated by: Cloud backup feature (ADR-003)
- Different browsers have different storage limits
  - Mitigated by: PWA installation requests persistent storage

### Risks

- Data loss if user clears browser data without backup
- Schema migrations need careful testing

## Implementation Notes

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  categoryId: string;
  type: 'boolean' | 'rating' | 'time' | 'count';
  options?: string[];  // For rating type
  unit?: string;       // For time/count
  target?: number;     // Daily target
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  habitId: string;
  date: string;  // YYYY-MM-DD for easy indexing
  value: boolean | string | number;
  note?: string;
  skippedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdhyatmikDB extends Dexie {
  categories!: Table<Category>;
  habits!: Table<Habit>;
  logEntries!: Table<LogEntry>;
  settings!: Table<{ key: string; value: unknown }>;

  constructor() {
    super('adhyatmik-hisab');
  
    this.version(1).stores({
      categories: 'id, order',
      habits: 'id, categoryId, order, isActive',
      logEntries: 'id, habitId, date, [date+habitId]',
      settings: 'key'
    });
  }
}

export const db = new AdhyatmikDB();
```
