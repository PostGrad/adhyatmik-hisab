/**
 * Signup Screen Component
 * 
 * Shown to first-time users to sign up with Google
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, BarChart3, Cloud } from 'lucide-react';
import {Button} from '../ui/Button';
import { signInWithGoogle } from '../../services/auth';
import { createUserProfile, logAnalyticsEvent } from '../../services/firestore';
import { setSetting, getSetting } from '../../db';
import { CURRENT_APP_VERSION } from '../../db';

interface SignupScreenProps {
  onSignupComplete: () => void;
}

export default function SignupScreen({ onSignupComplete }: SignupScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Google
      const user = await signInWithGoogle();

      // Create user profile in Firestore
      await createUserProfile(user, CURRENT_APP_VERSION);

      // Log signup event
      await logAnalyticsEvent(
        user.uid,
        'user_signed_up',
        {
          email: user.email,
          displayName: user.displayName,
        },
        CURRENT_APP_VERSION
      );

      // Store Firebase user ID in local settings
      await setSetting('firebaseUserId', user.uid);
      await setSetting('hasSignedUp', true);

      // Log app open event
      await logAnalyticsEvent(
        user.uid,
        'app_opened',
        {},
        CURRENT_APP_VERSION
      );

      onSignupComplete();
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo/Icon */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <span className="text-4xl">🙏</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Adhyatmik Hisab
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your spiritual journey tracking companion
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Privacy First
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your habit data stays on your device. We only store basic profile info.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Analytics & Insights
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Help us improve the app by sharing anonymous usage data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Future Features
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sign up now to enable future cross-device sync features.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
            >
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </span>
            )}
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By signing in, you agree to our privacy policy. We only collect basic profile information and anonymous usage analytics. Your personal habit data remains private and stored locally on your device.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

