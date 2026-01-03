/**
 * Authentication Service
 * 
 * Handles Google Sign-In via Firebase Authentication
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ============================================================================
// Google Sign-In
// ============================================================================

const googleProvider = new GoogleAuthProvider();

// Add additional scopes if needed (Firebase Auth handles basic profile automatically)
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in with Google
 * Tries popup first, falls back to redirect if popup is blocked
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Check your configuration.');
  }

  try {
    // Try popup first (better UX)
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle specific Firebase errors
      const errorCode = (error as { code?: string }).code || '';
      
      if (errorCode === 'auth/popup-blocked' || error.message.includes('popup-blocked')) {
        // Popup was blocked, use redirect instead
        console.warn('Popup blocked, using redirect flow');
        await signInWithRedirect(auth, googleProvider);
        // Redirect will happen, so we won't return here
        throw new Error('Redirecting to sign in...');
      }
      
      if (errorCode === 'auth/popup-closed-by-user' || error.message.includes('popup-closed-by-user')) {
        throw new Error('Sign-in was cancelled.');
      }
      
      if (errorCode === 'auth/unauthorized-domain') {
        throw new Error(
          'This domain is not authorized. Please add it to Firebase Console → Authentication → Settings → Authorized domains'
        );
      }
      
      // Check for redirect_uri_mismatch
      if (error.message.includes('redirect_uri_mismatch') || errorCode === 'auth/redirect-uri-mismatch') {
        throw new Error(
          'OAuth configuration error. Please ensure "localhost" is added to Firebase Console → Authentication → Settings → Authorized domains'
        );
      }
    }
    throw error;
  }
}

/**
 * Handle redirect result after Google sign-in redirect
 * Call this on app initialization to check if user just signed in via redirect
 */
export async function handleRedirectResult(): Promise<FirebaseUser | null> {
  if (!auth) {
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Redirect result error:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  await firebaseSignOut(auth);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Subscribe to authentication state changes
 * @param callback Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!auth) {
    // If Firebase not initialized, call callback with null
    callback(null);
    return () => {}; // Return no-op unsubscribe
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

