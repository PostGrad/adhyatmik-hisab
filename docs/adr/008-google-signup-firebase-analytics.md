# ADR-008: Google Signup & Firebase Analytics

**Status:** Accepted
**Date:** 2026-01-03

## Context

We need to:

1. **Identify first-time users** - Require Google signup for new users
2. **Collect analytics** - Understand user behavior, app usage patterns, and feature adoption
3. **Maintain privacy** - Store only basic user info, not personal habit data
4. **Enable cross-device sync** - User account enables future multi-device features

### Requirements

- First-time users must sign up with Google
- Store basic user profile (email, name, profile picture)
- Track analytics events (app opens, feature usage, errors)
- Habit data remains local-only (IndexedDB)
- Analytics data separate from personal data

## Decision

### Architecture: Firebase Authentication + Firestore Analytics

We'll use **Firebase** for:

1. **Authentication** - Google Sign-In via Firebase Auth
2. **Analytics** - User events and app metrics via Firestore
3. **User Profiles** - Basic user info storage

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER DATA SEPARATION                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LOCAL STORAGE (IndexedDB)                   │   │
│  │  • Habits                                                 │   │
│  │  • Log Entries                                            │   │
│  │  • Categories                                              │   │
│  │  • Settings (PIN, theme, etc.)                            │   │
│  │  └── NEVER synced to Firebase                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FIREBASE (Cloud)                             │   │
│  │  • User Profile (email, name, photo)                     │   │
│  │  • Analytics Events (app_opens, feature_used, etc.)     │   │
│  │  • Error Logs (anonymized)                               │   │
│  │  └── NO personal habit data                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              GOOGLE SHEETS (User's Drive)                │   │
│  │  • Backup of IndexedDB data (when user enables backup)   │   │
│  │  • User-controlled, transparent                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Firebase?

| Criteria                  | Firebase              | Custom Backend    | Google Analytics    |
| ------------------------- | --------------------- | ----------------- | ------------------- |
| **Setup Time**      | ✅ Minutes            | ❌ Weeks          | ⚠️ Limited events |
| **Cost**            | ✅ Free tier generous | ❌ Server costs   | ✅ Free             |
| **Google Sign-In**  | ✅ Built-in           | ⚠️ Manual OAuth | ❌ No auth          |
| **Real-time**       | ✅ Yes                | ⚠️ Complex      | ❌ No               |
| **Privacy Control** | ✅ We control data    | ✅ Full control   | ⚠️ Google-owned   |

**Decision**: Firebase provides the best balance of ease, cost, and functionality.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRST-TIME USER FLOW                           │
│                                                                  │
│  1. User opens app for first time                               │
│         │                                                        │
│         ▼                                                        │
│  2. Check: Is user signed in?                                   │
│         │ No                                                    │
│         ▼                                                        │
│  3. Show "Welcome! Sign up with Google" screen                 │
│         │                                                        │
│         ▼                                                        │
│  4. User clicks "Sign in with Google"                          │
│         │                                                        │
│         ▼                                                        │
│  5. Firebase Auth: Google Sign-In flow                          │
│     └── User approves permissions                               │
│         │                                                        │
│         ▼                                                        │
│  6. Firebase creates user account                               │
│     └── Store: email, name, photo, createdAt                   │
│         │                                                        │
│         ▼                                                        │
│  7. Log analytics event: "user_signed_up"                       │
│         │                                                        │
│         ▼                                                        │
│  8. Store Firebase user ID in local settings                   │
│         │                                                        │
│         ▼                                                        │
│  9. Show app onboarding                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Firebase Collections Structure

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── createdAt: timestamp
│       ├── lastActiveAt: timestamp
│       └── appVersion: string
│
└── analytics/
    └── {eventId}/
        ├── userId: string
        ├── eventType: string (app_open, feature_used, error, etc.)
        ├── metadata: object
        ├── timestamp: timestamp
        └── appVersion: string
```

### Privacy Considerations

**What we store:**

- ✅ User email, name, profile picture (from Google account)
- ✅ App usage events (anonymized)
- ✅ Error logs (no personal data)

**What we DON'T store:**

- ❌ Habit names or descriptions
- ❌ Log entry values or notes
- ❌ Personal reflections or reasons
- ❌ PIN or security settings

**User Control:**

- User can delete their Firebase account (removes profile + analytics)
- Analytics events can be anonymized (remove userId after 90 days)
- All habit data remains local-only

### Analytics Events

We'll track:

```typescript
// User lifecycle
'user_signed_up'        // First signup
'app_opened'            // App launch
'app_closed'            // App close

// Feature usage
'habit_created'         // User created a habit
'habit_logged'           // User logged a habit entry
'backup_enabled'         // User enabled Google Sheets backup
'report_viewed'          // User viewed analytics report

// Errors
'error_occurred'        // App error (with error type, no personal data)

// Engagement
'session_started'        // User session start
'session_ended'          // User session end (with duration)
```

**No Personal Data in Events:**

- Events contain only event type, timestamp, app version
- No habit names, log values, or personal notes
- User ID is stored but can be anonymized later

## Alternatives Considered

### 1. No Signup Required

**Why Not:**

- Can't identify users for analytics
- Can't enable future cross-device features
- Can't provide user support

### 2. Optional Signup

**Why Not:**

- User might skip, missing analytics
- Inconsistent user experience
- Harder to implement features that require user identity

### 3. Custom Backend (Node.js + PostgreSQL)

**Why Not:**

- Requires server infrastructure (cost, maintenance)
- Need to handle scaling, security, backups
- Overkill for analytics use case
- Firebase free tier is sufficient

### 4. Google Analytics Only

**Why Not:**

- Limited event customization
- No user profiles
- Can't build user-specific features later
- Less control over data

## Consequences

### Positive

- ✅ Easy user identification
- ✅ Rich analytics capabilities
- ✅ Foundation for future features (cloud sync, sharing)
- ✅ Free tier covers our needs
- ✅ Google Sign-In is familiar to users
- ✅ Privacy maintained (habit data stays local)

### Negative

- ⚠️ Requires internet for first signup
- ⚠️ Adds dependency on Firebase
- ⚠️ Some users may not want to sign up
  - Mitigated by: Clear explanation of why (analytics only, no personal data)

### Risks

- **Firebase outage** could prevent new signups
  - Mitigated by: App works offline after signup, only blocks first-time users
- **Privacy concerns** from users
  - Mitigated by: Clear privacy policy, transparent data usage, local-only habit storage
- **Firebase costs** if we scale beyond free tier
  - Mitigated by: Free tier is generous (50K reads/day), monitor usage

## Implementation Notes

### Firebase Project Setup

1. Create Firebase project in Google Cloud Console
2. Enable Authentication (Google provider)
3. Enable Firestore Database
4. Configure security rules (users can only read/write their own data)
5. Add Firebase config to app

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  
    // Users can only write their own analytics events
    match /analytics/{eventId} {
      allow write: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
      allow read: if false; // No reading analytics (admin only)
    }
  }
}
```

### Onboarding Flow

```typescript
// Check if user is signed in
const user = await getCurrentUser();

if (!user) {
  // Show signup screen
  // After signup, proceed to app
} else {
  // User already signed in, show app
  // Log app_open event
}
```

## References

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)
