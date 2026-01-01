# ADR-003: Cloud Backup Architecture

**Status:** Accepted
**Date:** 2025-12-30

## Context

User data lives in IndexedDB which can be cleared. We need a backup mechanism that:

1. Stores data in user's own cloud account (privacy)
2. Works without our own backend (cost, maintenance)
3. Is transparent - user can see their data
4. Supports restore on new devices

### Options Evaluated

| Option              | Pros                           | Cons                         |
| ------------------- | ------------------------------ | ---------------------------- |
| Google Drive (JSON) | Simple API, user-owned         | Data opaque to user          |
| Google Sheets       | User can view/edit, structured | Row limits (10M cells)       |
| Firebase            | Real-time sync                 | Requires our backend/billing |
| Dropbox             | Simple API                     | Less common than Google      |

## Decision

### Primary: Google Sheets API

We'll use Google Sheets as our backup destination.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S GOOGLE ACCOUNT                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Google Drive                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │   📊 Adhyatmik Hisab Backup (Spreadsheet)                   │  │  │
│  │  │   ├── Sheet: "Categories"                                   │  │  │
│  │  │   ├── Sheet: "Habits"                                       │  │  │
│  │  │   ├── Sheet: "LogEntries"                                   │  │  │
│  │  │   ├── Sheet: "Settings"                                     │  │  │
│  │  │   └── Sheet: "_metadata" (sync timestamps)                  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Sheets over Drive JSON?

1. **Transparency**: User can open the spreadsheet and see all their habit data
2. **Portability**: Can export to CSV/Excel without our app
3. **Debugging**: Easier to diagnose sync issues by looking at the sheet
4. **Manual fixes**: User can fix corrupted data directly if needed

### Sync Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              PWA                                          │
│  ┌────────────────┐     ┌─────────────────┐     ┌────────────────────┐   │
│  │    IndexedDB   │────▶│   Sync Engine   │────▶│  Google API Client │   │
│  │  (Source of    │     │                 │     │                    │   │
│  │    Truth)      │◀────│  • Diff calc    │◀────│  • OAuth 2.0       │   │
│  └────────────────┘     │  • Conflict     │     │  • Sheets API      │   │
│                         │    resolution   │     │  • Batch writes    │   │
│                         │  • Retry logic  │     └────────────────────┘   │
│                         └─────────────────┘              │               │
│                                                          │               │
└──────────────────────────────────────────────────────────┼───────────────┘
                                                           │
                                                           ▼
                                              ┌────────────────────────┐
                                              │   Google Sheets API    │
                                              │   (sheets.google.com)  │
                                              └────────────────────────┘
```

### Sync Strategy: Last-Write-Wins with Timestamps

We're not building a collaborative app, so we use a simple strategy:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYNC FLOW                                 │
│                                                                  │
│   1. User clicks "Backup Now" or auto-backup triggers           │
│                         │                                        │
│                         ▼                                        │
│   2. Fetch _metadata sheet from Google                          │
│      └── Get last sync timestamp                                │
│                         │                                        │
│                         ▼                                        │
│   3. Query local changes since last sync                        │
│      └── SELECT * FROM logs WHERE updatedAt > lastSync          │
│                         │                                        │
│                         ▼                                        │
│   4. Batch write changed rows to Sheets                         │
│      └── Use batchUpdate for efficiency                         │
│                         │                                        │
│                         ▼                                        │
│   5. Update _metadata with new sync time                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Restore Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       RESTORE FLOW                               │
│                                                                  │
│   1. User clicks "Restore from Backup"                          │
│                         │                                        │
│                         ▼                                        │
│   2. OAuth: Ensure we have Sheets access                        │
│                         │                                        │
│                         ▼                                        │
│   3. Find "Adhyatmik Hisab Backup" spreadsheet                  │
│      └── Search in user's Drive                                 │
│                         │                                        │
│                         ▼                                        │
│   4. Read all sheets into memory                                │
│                         │                                        │
│                         ▼                                        │
│   5. CONFIRM with user (will overwrite local data)              │
│                         │                                        │
│                         ▼                                        │
│   6. Clear local IndexedDB tables                               │
│                         │                                        │
│                         ▼                                        │
│   7. Bulk insert all data from Sheets                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## OAuth Scopes

We request minimal scopes:

```
https://www.googleapis.com/auth/drive.file
```

This scope:

- ✅ Allows creating new files
- ✅ Allows accessing files created by our app
- ❌ Cannot access user's other Drive files
- ❌ Cannot see user's entire Drive

## Sheet Structure

### Categories Sheet

| id    | name          | color   | icon | order | createdAt            |
| ----- | ------------- | ------- | ---- | ----- | -------------------- |
| cat_1 | Daily Prayers | #FF6B35 | 🙏   | 0     | 2026-01-01T10:00:00Z |

### Habits Sheet

| id    | name               | categoryId | type    | options             | unit | target | order | isActive | createdAt            |
| ----- | ------------------ | ---------- | ------- | ------------------- | ---- | ------ | ----- | -------- | -------------------- |
| hab_1 | Morning Prayer     | cat_1      | boolean |                     |      |        | 0     | true     | 2026-01-01T10:00:00Z |
| hab_2 | Meditation Quality | cat_1      | rating  | Best,Good,Okay,Poor |      |        | 1     | true     | 2026-01-01T10:00:00Z |

### LogEntries Sheet

| id    | habitId | date       | value | note          | skippedReason | createdAt            | updatedAt            |
| ----- | ------- | ---------- | ----- | ------------- | ------------- | -------------------- | -------------------- |
| log_1 | hab_1   | 2026-01-01 | true  | Felt peaceful |               | 2026-01-01T06:00:00Z | 2026-01-01T06:00:00Z |

## Alternatives Considered

### 1. Google Drive with JSON file

**Why Not:**

- User can't easily view their data
- Large JSON = slow to parse on mobile
- No incremental updates (rewrite entire file)

### 2. Firebase Realtime DB / Firestore

**Why Not:**

- Requires billing account for production
- We'd need to manage user data (privacy concerns)
- Overkill for manual backup/restore

### 3. Local file export only

**Why Not:**

- User has to manually manage files
- No automatic backup
- Easy to lose files

## Consequences

### Positive

- User owns their data in their Google account
- Can view/export data without our app
- No backend costs for us
- Works across devices with same Google account
- Free tier handles our use case easily

### Negative

- Depends on Google API availability
- OAuth flow can be clunky on mobile
- Row limits (10M cells) but unlikely to hit
- No real-time sync (manual or scheduled only)

### Risks

- Google API changes could break sync
  - Mitigated by: Using stable v4 Sheets API
- Token refresh failures
  - Mitigated by: Clear error messaging, manual retry option

## Implementation Notes

### Google Cloud Console Setup

1. Create project "Adhyatmik Hisab PWA"
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized origins:
   - `http://localhost:5173` (dev)
   - Production URL

### Token Storage

- Store OAuth tokens in IndexedDB (encrypted with PIN)
- Refresh token automatically before expiry
- Handle token revocation gracefully
