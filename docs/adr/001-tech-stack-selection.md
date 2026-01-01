# ADR-001: Tech Stack Selection

**Status:** Accepted
**Date:** 2025-12-30

## Context

We're building a PWA version of Adhyatmik Hisab - a spiritual habit tracking app inspired by the Swaminarayan tradition. The original app exists on Android, but we need a cross-platform solution that works on any device with a browser.

### Requirements

1. Must work offline (primary use case is daily logging without internet)
2. Must support cloud backup to user's Google account
3. Needs to feel native-like on mobile devices
4. Should have good chart/visualization capabilities
5. Development speed matters - single developer project

### Constraints

- No backend server (cost, maintenance overhead)
- Data privacy is paramount - user data stays with user
- Must be installable as PWA

## Decision

We will use the following tech stack:

### Frontend Framework: React 18 + TypeScript + Vite

```
┌─────────────────────────────────────────────────────────┐
│                    BUILD TOOLING                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │                    Vite                          │   │
│  │  • Fast HMR (< 50ms)                            │   │
│  │  • Native ESM dev server                        │   │
│  │  • Optimized production builds                  │   │
│  │  • First-class PWA plugin support               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   UI FRAMEWORK                          │
│  ┌───────────────────┐  ┌───────────────────────────┐  │
│  │     React 18      │  │      TypeScript 5.x       │  │
│  │  • Concurrent     │  │  • Type safety            │  │
│  │  • Suspense       │  │  • Better DX              │  │
│  │  • Transitions    │  │  • Catch bugs early       │  │
│  └───────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Styling: Tailwind CSS v4

Picked over alternatives because:

- Utility-first = faster iteration
- v4 has native CSS variables = easy theming for spiritual color palette
- No runtime CSS-in-JS overhead
- Great for responsive design (mobile-first PWA)

### Charts: Recharts

Considered options:

| Library  | Bundle Size | React Integration | Customization |
| -------- | ----------- | ----------------- | ------------- |
| Chart.js | 63kb        | Wrapper needed    | Medium        |
| Recharts | 48kb        | Native React      | Excellent     |
| Victory  | 85kb        | Native React      | Good          |
| Nivo     | 120kb+      | Native React      | Excellent     |

Recharts wins on bundle size + customization balance. The declarative API fits React patterns well.

## Alternatives Considered

### 1. Vue 3 + Nuxt

**Pros:**

- Simpler reactivity model
- Great docs

**Cons:**

- Smaller ecosystem for charting libs
- Team familiarity is lower
- PWA plugin ecosystem less mature than Vite

### 2. SvelteKit

**Pros:**

- Smallest bundle size
- No virtual DOM overhead

**Cons:**

- Ecosystem still maturing
- Fewer battle-tested libraries for our needs
- IndexedDB wrappers less mature

### 3. Next.js

**Pros:**

- Industry standard
- Great SSR/SSG

**Cons:**

- Overkill for offline-first PWA
- SSR not useful here (everything client-side)
- Heavier build output

## Consequences

### Positive

- Fast development with Vite's HMR
- Type safety catches errors before runtime
- React's ecosystem gives us mature solutions for every need
- Tailwind v4's CSS variables make theming trivial
- Good long-term maintainability

### Negative

- React's bundle size is larger than Svelte
- Need to manage TypeScript complexity
- Tailwind classes can get verbose (mitigated with component extraction)

### Risks

- Vite major version changes could require migration effort
- React 19 is out but we're on 18 - may need upgrade later

## Dependencies

This decision affects:

- ADR-002 (Storage) - React hooks integration with Dexie
- ADR-004 (PWA) - Vite PWA plugin selection
- ADR-005 (State) - React-compatible state management
