import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav, ToastContainer } from './components/ui';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LockScreen } from './components/LockScreen';
import SignupScreen from './components/auth/SignupScreen';
import { useAppStore } from './store/appStore';
import { seedDefaultCategories, getSetting, setSetting } from './db';
import { onAuthStateChange } from './services/auth';
import { createUserProfile, logAnalyticsEvent, updateLastActive } from './services/firestore';
import { CURRENT_APP_VERSION } from './db';
import './index.css';

// Page components map
const pages = {
  today: TodayPage,
  habits: HabitsPage,
  stats: StatsPage,
  settings: SettingsPage,
};

function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const isLocked = useAppStore((s) => s.isLocked);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const theme = useAppStore((s) => s.theme);
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user needs to sign up and initialize auth
  useEffect(() => {
    async function checkAuth() {
      try {
        // First, check if we're returning from a redirect sign-in
        const { handleRedirectResult } = await import('./services/auth');
        const redirectUser = await handleRedirectResult();
        
        if (redirectUser) {
          // User just signed in via redirect
          await createUserProfile(redirectUser, CURRENT_APP_VERSION);
          await setSetting('firebaseUserId', redirectUser.uid);
          await setSetting('hasSignedUp', true);
          await logAnalyticsEvent(
            redirectUser.uid,
            'user_signed_up',
            {
              email: redirectUser.email,
              displayName: redirectUser.displayName,
            },
            CURRENT_APP_VERSION
          );
        }

        // Check local setting
        const hasSignedUp = await getSetting('hasSignedUp');
        
        if (!hasSignedUp && !redirectUser) {
          // User hasn't signed up yet
          setNeedsSignup(true);
          setIsCheckingAuth(false);
          return;
        }

        // User has signed up, check Firebase auth state
        const unsubscribe = onAuthStateChange(async (user) => {
          if (user) {
            // User is authenticated
            // Ensure profile exists
            await createUserProfile(user, CURRENT_APP_VERSION);
            
            // Update last active
            await updateLastActive(user.uid);
            
            // Log app open event
            await logAnalyticsEvent(
              user.uid,
              'app_opened',
              {},
              CURRENT_APP_VERSION
            );
          } else {
            // User signed out or not authenticated
            // Check if they previously signed up
            const firebaseUserId = await getSetting('firebaseUserId');
            if (firebaseUserId) {
              // They were signed up but now signed out
              // For now, allow them to use app (offline mode)
              // In future, we might want to require re-auth
              console.warn('User previously signed up but now signed out');
            }
          }
          setIsCheckingAuth(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Auth check error:', error);
        // If Firebase not configured, allow app to work offline
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  // Seed default categories on first load
  useEffect(() => {
    seedDefaultCategories()
      .then(() => {
        if (!isCheckingAuth) {
          setIsInitialized(true);
        }
      })
      .catch((err) => {
        console.error('Failed to seed categories:', err);
        if (!isCheckingAuth) {
          setIsInitialized(true);
        }
      });
  }, [isCheckingAuth]);

  // Mark initialized when auth check is done
  useEffect(() => {
    if (!isCheckingAuth && !needsSignup) {
      setIsInitialized(true);
    }
  }, [isCheckingAuth, needsSignup]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Request persistent storage on first load
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((granted) => {
        if (granted) {
          console.log('Persistent storage granted');
        }
      });
    }
  }, []);

  // Show signup screen for first-time users
  if (needsSignup) {
    return (
      <SignupScreen
        onSignupComplete={() => {
          setNeedsSignup(false);
          setIsInitialized(true);
        }}
      />
    );
  }

  // Show loading while initializing
  if (!isInitialized || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-saffron-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-saffron-600 dark:text-saffron-400 animate-pulse">
          <div className="text-4xl mb-2">🙏</div>
          <div className="text-sm font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Show lock screen if PIN is enabled and app is locked
  if (pinEnabled && isLocked) {
    return <LockScreen />;
  }

  const ActivePage = pages[activeTab];

  return (
    <div className="min-h-screen bg-saffron-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ActivePage />
        </motion.div>
      </AnimatePresence>
      
      <BottomNav />
      <ToastContainer />
    </div>
  );
}

export default App;
