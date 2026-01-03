# Google Console Setup Guide

This guide walks you through setting up Google Cloud Console and Firebase for the Adhyatmik Hisab PWA.

## Prerequisites

- Google account
- Access to Google Cloud Console

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**

### 1.2 Project Details

```
Project name: Adhyatmik Hisab
Project ID: adhyatmik-hisab (or any other preferred ID)
```

- Click **"Continue"**
- **Disable** Google Analytics for Firebase (optional, we'll use Firestore directly)
- Click **"Create project"**
- Wait for project creation (~30 seconds)
- Click **"Continue"**

## Step 2: Enable Authentication

### 2.1 Navigate to Authentication

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"** (if first time)

### 2.2 Enable Google Sign-In Provider

1. Click **"Sign-in method"** tab
2. Click on **"Google"** provider
3. Toggle **"Enable"** switch to ON
4. Set **Project support email** (your email)
5. Click **"Save"**

**Note:** Firebase will automatically configure OAuth consent screen in Google Cloud Console.

## Step 3: Create Firestore Database

### 3.1 Create Database

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security rules next)
4. Choose **location** (closest to app users, e.g., `us-central1`)
5. Click **"Enable"**

### 3.2 Set Security Rules

1. Click **"Rules"** tab in Firestore
2. Replace the default rules with:

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
  
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

### 3.3 Create Collections (Optional - will be created automatically)

Firestore creates collections automatically when you write data, but you can pre-create them:

1. Click **"Start collection"**
2. Collection ID: `users`
3. Click **"Next"** (no initial document needed)
4. Repeat for `analytics` collection

## Step 4: Get Firebase Configuration

### 4.1 Web App Configuration

1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click **"</>"** (Web app icon)
5. Register app:
   - App nickname: `Adhyatmik Hisab PWA`
   - **Don't** check "Also set up Firebase Hosting"
   - Click **"Register app"**

### 4.2 Copy Configuration

You'll see a code snippet like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "adhyatmik-hisab.firebaseapp.com",
  projectId: "adhyatmik-hisab",
  storageBucket: "adhyatmik-hisab.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Save this configuration** - you'll need it in the next step.

## Step 5: Configure Authorized Domains

### 5.1 Add Authorized Domains (CRITICAL FOR FIREBASE AUTH)

**Important:** Firebase Auth uses its own OAuth client and redirect URIs. You MUST configure authorized domains in Firebase Console, NOT in Google Cloud Console.

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll to **"Authorized domains"** section
3. Verify `localhost` is in the list (it should be there by default)
4. If `localhost` is missing, click **"Add domain"** and add:
   - `localhost`
5. For production, add your domain:
   - Click **"Add domain"**
   - Enter your production domain (e.g., `adhyatmik-hisab.web.app`)
   - Click **"Add"**

**Note:** Firebase Auth automatically creates an OAuth client in Google Cloud Console. You don't need to manually configure redirect URIs for Firebase Auth - it handles them automatically. The OAuth client configuration in Step 6 is ONLY for Google Sheets backup feature.

## Step 6: Enable Google Sheets API (For Backup Feature)

### 6.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create new project)

### 6.2 Enable Google Sheets API

1. Click **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on **"Google Sheets API"**
4. Click **"Enable"**

### 6.3 Create OAuth 2.0 Credentials (For Google Sheets Backup Only)

**⚠️ CRITICAL WARNING:** Firebase Auth uses its own OAuth client (automatically created). **DO NOT rename, modify, or delete the auto-created OAuth client!**

**You should have TWO separate OAuth clients:**

1. **Firebase Auth Client** (auto-created) - For Google Sign-In

   - Name: `Web client (auto created by Google Service)` or similar
   - **DO NOT TOUCH THIS ONE**
   - Firebase manages it automatically
2. **Google Sheets Backup Client** (manually created) - For backup feature

   - This is the one you'll create below
   - Safe to customize

**Steps to create Google Sheets Backup OAuth client:**

1. Go to **"APIs & Services"** → **"Credentials"**
2. You'll see Firebase already created an OAuth client (for Firebase Auth) - **DO NOT MODIFY IT**
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure OAuth consent screen:

   - User type: **External**
   - App name: `Adhyatmik Hisab`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**
   - Scopes: Click **"Add or Remove Scopes"**
     - Add: `https://www.googleapis.com/auth/drive.file`
     - Click **"Update"** → **"Save and Continue"**
   - Test users: Add your email (for testing)
   - Click **"Save and Continue"** → **"Back to Dashboard"**
5. Create OAuth Client (for Google Sheets):

   - Application type: **Web application**
   - Name: `Adhyatmik Hisab Sheets Backup Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://your-production-domain.com`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `https://your-production-domain.com/auth/callback`
   - Click **"Create"**
6. **Save the Client ID and Client Secret** (you'll need these for Google Sheets backup)

**Note:** If you see multiple OAuth clients:

- One will be named something like "Web client (auto created by Google Service)" - this is for Firebase Auth, don't modify it
- The one you just created is for Google Sheets backup

## Step 7: Environment Variables Setup

Create a `.env` file in your project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=adhyatmik-hisab.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adhyatmik-hisab
VITE_FIREBASE_STORAGE_BUCKET=adhyatmik-hisab.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Google OAuth (for Sheets backup)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
```

**Important:**

- Never commit `.env` file to git
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation

## Step 8: Verify Setup

### 8.1 Test Authentication

1. Run your app: `pnpm dev`
2. Try signing in with Google
3. Check Firebase Console → Authentication → Users
4. You should see your test user

### 8.2 Test Firestore

1. Sign in to your app
2. Check Firebase Console → Firestore Database
3. You should see:
   - `users/{userId}` document created
   - `analytics/{eventId}` documents created

## Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"

**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### Issue: "Firebase: Error (auth/popup-blocked)"

**Solution:** Browser blocked popup. The app will automatically fall back to redirect flow.

### Issue: "Error 400: redirect_uri_mismatch" (Firebase Auth)

**Solution:**

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Make sure `localhost` is in the list
3. If using a custom domain, add it to authorized domains
4. **Don't** configure redirect URIs in Google Cloud Console for Firebase Auth - Firebase handles this automatically
5. Clear browser cache and try again

### Issue: "Firestore: Missing or insufficient permissions"

**Solution:** Check security rules. Make sure user is authenticated (`request.auth != null`)

### Issue: "Google OAuth: redirect_uri_mismatch" (Google Sheets backup)

**Solution:** Add exact redirect URI to Google Cloud Console → Credentials → OAuth Client (the one you created for Sheets backup, NOT the Firebase Auth one)

## Security Checklist

- [X] Firebase security rules are configured
- [X] Authorized domains are set correctly
- [X] OAuth client has correct redirect URIs
- [X] `.env` file is in `.gitignore`
- [ ] Production environment variables are set in hosting platform
- [ ] Test users are added to OAuth consent screen (for testing)

## Next Steps

1. Implement Firebase initialization
2. Create signup/login components
3. Set up analytics event tracking
4. Test end-to-end flow

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
