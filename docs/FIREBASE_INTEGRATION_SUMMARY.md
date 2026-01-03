# Google Signup & Firebase Analytics - Integration Summary

## 1. Documentation

- **ADR-008**: Google Signup & Firebase Analytics decision document
- **Google Console Setup Guide**: Step-by-step Firebase setup instructions
- **Updated ADR-003**: Reflects Firebase integration alongside Google Sheets

### 2. Firebase Configuration

- **`src/config/firebase.ts`**: Firebase initialization with environment variables
- **Environment variables**: Configuration via `VITE_FIREBASE_*` variables

### 3. Authentication Service

- **`src/services/auth.ts`**: Google Sign-In implementation
  - `signInWithGoogle()`: Popup-based Google authentication
  - `signOut()`: Sign out current user
  - `getCurrentUser()`: Get current authenticated user
  - `onAuthStateChange()`: Subscribe to auth state changes
  - `isAuthenticated()`: Check authentication status

### 4. Firestore Service

- **`src/services/firestore.ts`**: User profiles and analytics
  - `createUserProfile()`: Create/update user profile
  - `getUserProfile()`: Get user profile
  - `updateLastActive()`: Update last active timestamp
  - `logAnalyticsEvent()`: Log analytics events
  - `logError()`: Log error events

### 5. UI Components

- **`src/components/auth/SignupScreen.tsx`**: First-time user signup screen
  - Beautiful welcome screen
  - Google Sign-In button
  - Privacy information
  - Error handling

### 6. App Integration

- **`src/App.tsx`**: Integrated signup flow
  - Checks if user has signed up
  - Shows signup screen for first-time users
  - Monitors auth state changes
  - Logs analytics events (app_open, user_signed_up)

### 7. Type Updates

- **`src/types/index.ts`**: Added Firebase-related fields
  - `firebaseUserId`: Store Firebase user ID
  - `hasSignedUp`: Track if user completed signup

### 8. Database Updates

- **`src/db/index.ts`**: Updated default settings
  - Added `firebaseUserId` and `hasSignedUp` to default settings

## How It Works

### First-Time User Flow

```
1. User opens app
   ↓
2. App checks: hasSignedUp setting
   ↓ (No)
3. Show SignupScreen component
   ↓
4. User clicks "Sign in with Google"
   ↓
5. Firebase Auth: Google Sign-In popup
   ↓
6. User approves → Firebase creates account
   ↓
7. Create user profile in Firestore
   ↓
8. Log analytics event: "user_signed_up"
   ↓
9. Store firebaseUserId and hasSignedUp in local settings
   ↓
10. Show main app
```

### Returning User Flow

```
1. User opens app
   ↓
2. App checks: hasSignedUp = true
   ↓
3. Check Firebase auth state
   ↓
4. If authenticated:
   - Update lastActiveAt
   - Log "app_opened" event
   ↓
5. Show main app
```

## Analytics Events Tracked

- `user_signed_up`: When user first signs up
- `app_opened`: When app is opened
- `app_closed`: When app is closed (future)
- `habit_created`: When user creates a habit (future)
- `habit_logged`: When user logs a habit entry (future)
- `backup_enabled`: When user enables Google Sheets backup (future)
- `report_viewed`: When user views analytics report (future)
- `error_occurred`: When an error occurs (future)
- `session_started`: When user session starts (future)
- `session_ended`: When user session ends (future)

## Privacy & Security

### What We Store in Firebase

- User email, name, profile picture (from Google)
- App usage events (anonymized)
- Error logs (no personal data)

### What We DON'T Store

- Habit names or descriptions
- Log entry values or notes
- Personal reflections
- PIN or security settings

### Security Rules

Firestore security rules ensure:

- Users can only read/write their own profile
- Users can only write their own analytics events
- No reading of analytics (admin only)

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
