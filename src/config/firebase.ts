/**
 * Firebase Configuration and Initialization
 * 
 * This module initializes Firebase services:
 * - Authentication (Google Sign-In)
 * - Firestore (user profiles and analytics)
 * 
 * Configuration comes from environment variables (VITE_FIREBASE_*)
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// ============================================================================
// Firebase Configuration
// ============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.warn(
    `Missing Firebase environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file. See docs/GOOGLE_CONSOLE_SETUP.md for setup instructions.'
  );
}

// ============================================================================
// Initialize Firebase
// ============================================================================

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  // App can still work without Firebase (offline mode)
  // But signup/analytics will be disabled
}

// ============================================================================
// Exports
// ============================================================================

export { app, auth, db };

// Re-export Firebase types for convenience
export type { User as FirebaseUser } from 'firebase/auth';
export type { DocumentData, Timestamp } from 'firebase/firestore';

