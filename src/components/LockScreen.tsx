import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { PinInput } from './ui/Input';
import { useAppStore } from '../store/appStore';
import { verifyPin } from '../utils';

export function LockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  
  const pinHash = useAppStore((s) => s.pinHash);
  const unlock = useAppStore((s) => s.unlock);

  // Check lockout status
  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const timer = setTimeout(() => {
        setLockoutUntil(null);
        setAttempts(0);
      }, lockoutUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [lockoutUntil]);

  // Auto-verify when PIN is complete
  useEffect(() => {
    const verifyPinAsync = async () => {
      if (pin.length === 4 && pinHash) {
        const isValid = await verifyPin(pin, pinHash);
        
        if (isValid) {
          setError(false);
          unlock();
        } else {
          setError(true);
          setPin('');
          setAttempts((a) => a + 1);
          
          // Lockout after 3 failed attempts
          if (attempts >= 2) {
            setLockoutUntil(Date.now() + 30000); // 30 second lockout
          }
        }
      }
    };
    
    verifyPinAsync();
  }, [pin, pinHash, unlock, attempts]);

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;
  const remainingSeconds = lockoutUntil 
    ? Math.ceil((lockoutUntil - Date.now()) / 1000) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-saffron-50 to-saffron-100 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-card flex items-center justify-center mb-4"
          >
            <span className="text-4xl">📿</span>
          </motion.div>
          <h1 className="text-2xl font-bold font-display text-ink">
            Adhyatmik Hisab
          </h1>
          <p className="text-ink-light mt-1">Enter PIN to unlock</p>
        </div>

        {/* Lock icon */}
        <motion.div
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            error ? 'bg-red-100' : 'bg-saffron-100'
          }`}>
            <Lock className={`w-8 h-8 ${error ? 'text-red-600' : 'text-saffron-600'}`} />
          </div>
        </motion.div>

        {/* PIN Input */}
        {isLockedOut ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Too many attempts</span>
            </div>
            <p className="text-ink-light">
              Try again in {remainingSeconds} seconds
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <PinInput
              value={pin}
              onChange={setPin}
              error={error}
              autoFocus
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-red-600 text-sm"
              >
                Incorrect PIN. {3 - attempts} attempts remaining.
              </motion.p>
            )}
          </div>
        )}

        {/* Forgot PIN hint */}
        <p className="text-center text-xs text-ink-light/60 mt-8">
          Forgot PIN? Clear app data in browser settings to reset.
        </p>
      </motion.div>
    </div>
  );
}

