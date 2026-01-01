# ADR-004: PWA & Offline Strategy

**Status:** Accepted  
**Date:** 2026-01-01  
  

## Context

The app must work offline because:
1. Users log habits first thing in the morning (may not have connectivity)
2. Some users in rural areas have inconsistent internet
3. The original Android app works fully offline
4. Spiritual practice shouldn't depend on internet

### Requirements

- App shell loads instantly even offline
- All CRUD operations work offline
- Charts and analytics work offline
- Only cloud backup needs internet

## Decision

### PWA Implementation: vite-plugin-pwa + Workbox

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PWA ARCHITECTURE                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Service Worker (Workbox)                       │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │ │
│  │  │   Precache       │  │   Runtime Cache  │  │   Offline       │  │ │
│  │  │   Strategy       │  │   Strategy       │  │   Fallback      │  │ │
│  │  │                  │  │                  │  │                 │  │ │
│  │  │  • index.html    │  │  • Google Fonts  │  │  • /offline     │  │ │
│  │  │  • JS bundles    │  │  • API calls     │  │    page         │  │ │
│  │  │  • CSS           │  │    (for backup)  │  │                 │  │ │
│  │  │  • Icons         │  │                  │  │                 │  │ │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         Cache Storage                               │ │
│  │   workbox-precache-v2    │    runtime-cache    │    google-fonts   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Caching Strategies

| Resource Type | Strategy | Rationale |
|--------------|----------|-----------|
| App shell (HTML, JS, CSS) | Precache | Must work offline immediately |
| Icons, images | Precache | Part of app experience |
| Google Fonts | Stale-While-Revalidate | Performance, graceful update |
| Google API calls | Network-Only | Real-time data, can't cache |

### vite-plugin-pwa Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Adhyatmik Hisab',
        short_name: 'Adhyatmik',
        description: 'Spiritual Habit Tracker',
        theme_color: '#FF6B35',
        background_color: '#FDF6E3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
```

### Offline Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST DATA FLOW                               │
│                                                                          │
│     User Action                                                          │
│         │                                                                │
│         ▼                                                                │
│   ┌───────────┐     ┌─────────────┐     ┌─────────────────────────────┐ │
│   │   React   │────▶│   Dexie     │────▶│       IndexedDB             │ │
│   │Component  │     │ useLiveQuery│     │   (Always Available)        │ │
│   └───────────┘     └─────────────┘     └─────────────────────────────┘ │
│         │                                           │                    │
│         │                                           │                    │
│         ▼                                           ▼                    │
│   ┌───────────┐                           ┌─────────────────────────┐   │
│   │    UI     │                           │   Sync Queue            │   │
│   │  Updates  │                           │   (for cloud backup)    │   │
│   │ Instantly │                           │                         │   │
│   └───────────┘                           └─────────────────────────┘   │
│                                                     │                    │
│                                                     ▼                    │
│                                      ┌──────────────────────────────┐   │
│                                      │   When Online:               │   │
│                                      │   Sync to Google Sheets      │   │
│                                      └──────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Install Prompt UX

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTALL PROMPT STRATEGY                       │
│                                                                  │
│   1. User visits site                                           │
│                │                                                 │
│                ▼                                                 │
│   2. Wait for engagement (3+ habit logs or 2 visits)            │
│                │                                                 │
│                ▼                                                 │
│   3. Show subtle install banner (not intrusive)                 │
│      "Install for offline access and faster loading"            │
│                │                                                 │
│                ▼                                                 │
│   4. On install: Request persistent storage                     │
│      navigator.storage.persist()                                │
│                │                                                 │
│                ▼                                                 │
│   5. Hide banner, show success toast                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Alternatives Considered

### 1. No Service Worker (pure SPA)

**Why Not:**
- No offline support
- Slow subsequent loads
- Not installable

### 2. Custom Service Worker

**Why Not:**
- Workbox handles edge cases we'd forget
- Cache invalidation is hard to get right
- vite-plugin-pwa automates manifest generation

### 3. App Cache (deprecated)

**Why Not:**
- Deprecated and removed from browsers
- Service Workers are the standard

## Consequences

### Positive

- App works fully offline after first load
- Fast subsequent loads (cached assets)
- Installable on mobile home screen
- Native-like experience
- Automatic updates via autoUpdate

### Negative

- Service worker bugs are hard to debug
- Cache can get stale (mitigated by autoUpdate)
- Initial bundle must include everything needed

### Risks

- Browser storage pressure could evict our cache
  - Mitigated by: Requesting persistent storage on install
- Service worker update could fail silently
  - Mitigated by: Show update toast, prompt refresh

## Testing Checklist

- [ ] App loads when airplane mode is on
- [ ] Can create/edit/delete habits offline
- [ ] Can log entries offline
- [ ] Charts render with offline data
- [ ] App shows when update is available
- [ ] Install prompt appears at right time
- [ ] Works on Chrome, Firefox, Safari, Edge

