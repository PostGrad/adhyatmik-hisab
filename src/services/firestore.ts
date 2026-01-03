/**
 * Firestore Service
 * 
 * Handles user profiles and analytics events in Firestore
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseUser } from '../config/firebase';

// ============================================================================
// User Profile
// ============================================================================

export interface UserProfile {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  appVersion: string;
}

/**
 * Create or update user profile in Firestore
 */
export async function createUserProfile(
  user: FirebaseUser,
  appVersion: string
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized. Check your configuration.');
  }

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  const profileData: UserProfile = {
    email: user.email || '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: userDoc.exists() 
      ? (userDoc.data().createdAt as Timestamp)
      : serverTimestamp() as Timestamp,
    lastActiveAt: serverTimestamp() as Timestamp,
    appVersion,
  };

  await setDoc(userRef, profileData, { merge: true });
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  if (!db) {
    return null;
  }

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  return userDoc.data() as UserProfile;
}

/**
 * Update user's last active timestamp
 */
export async function updateLastActive(userId: string): Promise<void> {
  if (!db) {
    return;
  }

  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    { lastActiveAt: serverTimestamp() },
    { merge: true }
  );
}

// ============================================================================
// Analytics Events
// ============================================================================

export type AnalyticsEventType =
  | 'user_signed_up'
  | 'app_opened'
  | 'app_closed'
  | 'habit_created'
  | 'habit_logged'
  | 'backup_enabled'
  | 'report_viewed'
  | 'error_occurred'
  | 'session_started'
  | 'session_ended';

export interface AnalyticsEvent {
  userId: string;
  eventType: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
  appVersion: string;
}

/**
 * Log an analytics event
 * 
 * @param userId Firebase user ID
 * @param eventType Type of event
 * @param metadata Optional event metadata (no personal data!)
 * @param appVersion Current app version
 */
export async function logAnalyticsEvent(
  userId: string,
  eventType: AnalyticsEventType,
  metadata?: Record<string, unknown>,
  appVersion: string = '1.0.0'
): Promise<void> {
  if (!db) {
    // Silently fail if Firestore not initialized (offline mode)
    console.warn('Firestore not initialized, skipping analytics event');
    return;
  }

  try {
    const eventData: Omit<AnalyticsEvent, 'timestamp'> & { timestamp: Timestamp } = {
      userId,
      eventType,
      metadata: metadata || {},
      appVersion,
      timestamp: serverTimestamp() as Timestamp,
    };

    await addDoc(collection(db, 'analytics'), eventData);
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the app
    console.error('Failed to log analytics event:', error);
  }
}

/**
 * Log error event (for error tracking)
 */
export async function logError(
  userId: string,
  errorType: string,
  errorMessage: string,
  stackTrace?: string,
  appVersion: string = '1.0.0'
): Promise<void> {
  await logAnalyticsEvent(
    userId,
    'error_occurred',
    {
      errorType,
      errorMessage: errorMessage.substring(0, 500), // Limit length
      stackTrace: stackTrace?.substring(0, 1000), // Limit length
    },
    appVersion
  );
}

