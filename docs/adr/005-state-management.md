# ADR-005: State Management

**Status:** Accepted  
**Date:** 2026-01-01  
  

## Context

We need to manage:

1. **Server-like state**: Habits, categories, log entries (persisted in IndexedDB)
2. **UI state**: Current date selected, modal open/closed, active tab
3. **Auth state**: Google OAuth status, user info
4. **App state**: PIN lock status, theme preference, sync status

### Considerations

- Most data comes from IndexedDB (Dexie handles reactivity)
- Need to avoid prop drilling across component tree
- Should be simple - this isn't a complex app
- TypeScript support is important

## Decision

### Hybrid Approach: Dexie Live Queries + Zustand

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT ARCHITECTURE                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         React Component Tree                         ││
│  │                                                                      ││
│  │    ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   ││
│  │    │   Header    │    │   HabitList │    │   LoggingScreen     │   ││
│  │    └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘   ││
│  │           │                  │                      │              ││
│  └───────────┼──────────────────┼──────────────────────┼──────────────┘│
│              │                  │                      │               │
│              ▼                  ▼                      ▼               │
│  ┌───────────────────┐  ┌───────────────────────────────────────────┐  │
│  │   Zustand Store   │  │           Dexie useLiveQuery              │  │
│  │                   │  │                                           │  │
│  │  • UI state       │  │  • Habits data (reactive)                 │  │
│  │  • Auth state     │  │  • Categories data (reactive)             │  │
│  │  • Sync status    │  │  • Log entries (reactive)                 │  │
│  │  • PIN lock       │  │                                           │  │
│  │  • Selected date  │  │  Auto-updates when IndexedDB changes      │  │
│  │  • Theme          │  │                                           │  │
│  └───────────────────┘  └───────────────────────────────────────────┘  │
│           │                              │                              │
│           ▼                              ▼                              │
│  ┌───────────────────┐        ┌────────────────────────┐               │
│  │  localStorage     │        │      IndexedDB         │               │
│  │  (theme, PIN)     │        │   (Dexie database)     │               │
│  └───────────────────┘        └────────────────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Split?

| State Type | Solution | Why |
|------------|----------|-----|
| Persisted data (habits, logs) | Dexie useLiveQuery | Already reactive, no duplication |
| UI ephemeral state | Zustand | Lightweight, no boilerplate |
| Theme/PIN preferences | Zustand + persist middleware | Survives reload |

### Zustand Store Structure

```typescript
// store/appStore.ts
interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: GoogleUser | null;
  
  // UI
  selectedDate: string;  // YYYY-MM-DD
  activeTab: 'today' | 'habits' | 'stats' | 'settings';
  
  // Security
  isLocked: boolean;
  pinHash: string | null;
  
  // Sync
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt: Date | null;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  unlock: () => void;
  lock: () => void;
  setPin: (pin: string) => void;
  login: (user: GoogleUser) => void;
  logout: () => void;
  setSyncStatus: (status: AppState['syncStatus']) => void;
}
```

### Data Flow Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   EXAMPLE: User Logs a Habit                             │
│                                                                          │
│   1. User taps "Done" on "Morning Prayer"                               │
│                          │                                               │
│                          ▼                                               │
│   2. Component calls: db.logEntries.add({ ... })                        │
│                          │                                               │
│                          ▼                                               │
│   3. Dexie writes to IndexedDB                                          │
│                          │                                               │
│                          ▼                                               │
│   4. useLiveQuery in HabitCard detects change                           │
│                          │                                               │
│                          ▼                                               │
│   5. React re-renders HabitCard with new state                          │
│                          │                                               │
│                          ▼                                               │
│   6. (Later) Sync engine picks up change for cloud backup               │
│                                                                          │
│   Note: No manual state updates needed - Dexie handles reactivity       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Alternatives Considered

### 1. Redux Toolkit

**Why Not:**
- Overkill for this app size
- Lots of boilerplate
- Would duplicate what Dexie already provides (data state)

### 2. React Context Only

**Why Not:**
- Causes unnecessary re-renders
- Gets messy with multiple contexts
- No built-in persistence

### 3. Jotai

**Why Not:**
- Similar to Zustand but atom-based
- Slightly more complex mental model
- Less intuitive persistence story

### 4. TanStack Query

**Why Not:**
- Designed for server state, not local-first
- Would be useful if we had an API
- Dexie's live queries serve same purpose

### 5. All state in Zustand

**Why Not:**
- Would duplicate IndexedDB data in memory
- Have to manually sync Zustand ↔ IndexedDB
- Dexie already solves this with useLiveQuery

## Consequences

### Positive

- No state duplication (Dexie is source of truth for data)
- Zustand is tiny (~1KB)
- Simple mental model: data → Dexie, UI → Zustand
- TypeScript support is excellent in both
- Easy persistence with Zustand persist middleware

### Negative

- Two "state systems" to understand
  - Mitigated by: Clear separation of concerns
- New developers might not know Dexie
  - Mitigated by: Good documentation

### Risks

- Dexie live query might have performance issues with large datasets
  - Mitigated by: Proper indexing, pagination for history views

## Implementation Example

```typescript
// Using Dexie for data
function HabitList() {
  const habits = useLiveQuery(() => db.habits.where('isActive').equals(true).toArray());
  
  if (!habits) return <Loading />;
  
  return habits.map(habit => <HabitCard key={habit.id} habit={habit} />);
}

// Using Zustand for UI state  
function DateNavigator() {
  const selectedDate = useAppStore(state => state.selectedDate);
  const setSelectedDate = useAppStore(state => state.setSelectedDate);
  
  return (
    <div>
      <button onClick={() => setSelectedDate(yesterday(selectedDate))}>←</button>
      <span>{formatDate(selectedDate)}</span>
      <button onClick={() => setSelectedDate(tomorrow(selectedDate))}>→</button>
    </div>
  );
}
```

