import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav, ToastContainer } from './components/ui';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LockScreen } from './components/LockScreen';
import { useAppStore } from './store/appStore';
import { seedDefaultCategories } from './db';
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

  // Seed default categories on first load
  useEffect(() => {
    seedDefaultCategories()
      .then(() => setIsInitialized(true))
      .catch((err) => {
        console.error('Failed to seed categories:', err);
        setIsInitialized(true);
      });
  }, []);

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

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-saffron-50 flex items-center justify-center">
        <div className="text-saffron-600 animate-pulse">
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
