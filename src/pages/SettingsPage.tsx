import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  CloudOff,
  Download, 
  Upload, 
  Trash2, 
  Info,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, BottomSheet } from '../components/ui/Modal';
import { PinInput } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';
import { exportAllData, importAllData, clearAllData } from '../db';
import { hashPin, verifyPin } from '../utils';

export function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const pinHash = useAppStore((s) => s.pinHash);
  const setPin = useAppStore((s) => s.setPin);
  const removePin = useAppStore((s) => s.removePin);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinRemove, setShowPinRemove] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleSetupPin = async () => {
    if (pinStep === 'enter') {
      if (pinValue.length === 4) {
        setPinStep('confirm');
        setPinError(false);
      }
    } else {
      if (pinValue === confirmPinValue) {
        const hash = await hashPin(pinValue);
        setPin(hash);
        setShowPinSetup(false);
        setPinValue('');
        setConfirmPinValue('');
        setPinStep('enter');
        addToast({ type: 'success', message: 'PIN set successfully! 🔒' });
      } else {
        setPinError(true);
        setConfirmPinValue('');
      }
    }
  };

  const handleRemovePin = async () => {
    if (pinValue.length === 4 && pinHash) {
      const isValid = await verifyPin(pinValue, pinHash);
      if (isValid) {
        removePin();
        setShowPinRemove(false);
        setPinValue('');
        addToast({ type: 'success', message: 'PIN removed' });
      } else {
        setPinError(true);
        setPinValue('');
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adhyatmik-hisab-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Data exported! 📦' });
    } catch (error) {
      addToast({ type: 'error', message: 'Export failed' });
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.version || !data.categories || !data.habits) {
          throw new Error('Invalid backup file');
        }
        
        if (window.confirm('This will replace all your current data. Continue?')) {
          await importAllData(data);
          addToast({ type: 'success', message: 'Data imported! 📥' });
        }
      } catch (error) {
        addToast({ type: 'error', message: 'Invalid backup file' });
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (window.confirm('This will delete ALL your data permanently. This cannot be undone!')) {
      if (window.confirm('Are you absolutely sure? Type OK to confirm.')) {
        await clearAllData();
        addToast({ type: 'success', message: 'All data cleared' });
      }
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="Settings" 
        subtitle="Customize your experience"
      />

      <main className="px-4 py-4 space-y-4">
        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h3 className="font-semibold text-ink mb-3">Appearance</h3>
            <div className="flex gap-2">
              {([
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
                    theme === value
                      ? 'bg-saffron-100 text-saffron-700 ring-2 ring-saffron-500'
                      : 'bg-gray-50 text-ink-light hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <h3 className="font-semibold text-ink mb-3">Security</h3>
            <button
              onClick={() => pinEnabled ? setShowPinRemove(true) : setShowPinSetup(true)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <div className="flex items-center gap-3">
                {pinEnabled ? (
                  <Lock className="w-5 h-5 text-forest-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-ink-light" />
                )}
                <div>
                  <p className="font-medium text-ink">PIN Protection</p>
                  <p className="text-sm text-ink-light">
                    {pinEnabled ? 'Enabled - tap to remove' : 'Add 4-digit PIN lock'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-light" />
            </button>
          </Card>
        </motion.div>

        {/* Cloud Backup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="font-semibold text-ink mb-3">Cloud Backup</h3>
            
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-forest-50 rounded-xl">
                  <Cloud className="w-5 h-5 text-forest-600" />
                  <div className="flex-1">
                    <p className="font-medium text-forest-800">Connected</p>
                    <p className="text-sm text-forest-600">{user.email}</p>
                  </div>
                </div>
                <Button variant="secondary" fullWidth>
                  Backup Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <CloudOff className="w-5 h-5 text-ink-light" />
                  <div>
                    <p className="font-medium text-ink">Not connected</p>
                    <p className="text-sm text-ink-light">
                      Backup your data to Google Sheets
                    </p>
                  </div>
                </div>
                <Button fullWidth icon={<Cloud className="w-4 h-4" />}>
                  Connect Google Account
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Local Backup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="font-semibold text-ink mb-3">Local Backup</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                fullWidth 
                icon={<Download className="w-4 h-4" />}
                onClick={handleExport}
              >
                Export Data
              </Button>
              <Button 
                variant="ghost" 
                fullWidth 
                icon={<Upload className="w-4 h-4" />}
                onClick={handleImport}
              >
                Import Data
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-red-100">
            <h3 className="font-semibold text-red-600 mb-3">Danger Zone</h3>
            <Button 
              variant="danger" 
              fullWidth 
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleClearData}
            >
              Clear All Data
            </Button>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <button
              onClick={() => setShowAbout(true)}
              className="w-full flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-saffron-600" />
                <span className="font-medium text-ink">About Adhyatmik Hisab</span>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-light" />
            </button>
          </Card>
        </motion.div>
      </main>

      {/* PIN Setup Sheet */}
      <BottomSheet
        isOpen={showPinSetup}
        onClose={() => {
          setShowPinSetup(false);
          setPinValue('');
          setConfirmPinValue('');
          setPinStep('enter');
          setPinError(false);
        }}
        title={pinStep === 'enter' ? 'Set PIN' : 'Confirm PIN'}
      >
        <div className="space-y-6 py-4">
          <p className="text-center text-ink-light">
            {pinStep === 'enter' 
              ? 'Enter a 4-digit PIN to protect your data'
              : 'Enter the same PIN again to confirm'}
          </p>
          
          <PinInput
            value={pinStep === 'enter' ? pinValue : confirmPinValue}
            onChange={pinStep === 'enter' ? setPinValue : setConfirmPinValue}
            error={pinError}
            autoFocus
          />
          
          {pinError && (
            <p className="text-center text-red-600 text-sm">
              PINs don't match. Try again.
            </p>
          )}
          
          <Button 
            onClick={handleSetupPin}
            disabled={(pinStep === 'enter' ? pinValue : confirmPinValue).length !== 4}
            fullWidth
          >
            {pinStep === 'enter' ? 'Continue' : 'Set PIN'}
          </Button>
        </div>
      </BottomSheet>

      {/* PIN Remove Sheet */}
      <BottomSheet
        isOpen={showPinRemove}
        onClose={() => {
          setShowPinRemove(false);
          setPinValue('');
          setPinError(false);
        }}
        title="Remove PIN"
      >
        <div className="space-y-6 py-4">
          <p className="text-center text-ink-light">
            Enter your current PIN to remove it
          </p>
          
          <PinInput
            value={pinValue}
            onChange={setPinValue}
            error={pinError}
            autoFocus
          />
          
          {pinError && (
            <p className="text-center text-red-600 text-sm">
              Incorrect PIN. Try again.
            </p>
          )}
          
          <Button 
            onClick={handleRemovePin}
            disabled={pinValue.length !== 4}
            fullWidth
          >
            Remove PIN
          </Button>
        </div>
      </BottomSheet>

      {/* About Modal */}
      <Modal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        title="About"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-saffron-100 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">📿</span>
          </div>
          
          <div>
            <h3 className="text-xl font-bold font-display text-ink">
              Adhyatmik Hisab
            </h3>
            <p className="text-ink-light">Spiritual Ledger</p>
          </div>
          
          <p className="text-sm text-ink-light">
            A digital tool inspired by the Swaminarayan tradition of maintaining 
            a personal spiritual ledger. Track your daily practices, analyze patterns, 
            and grow spiritually.
          </p>
          
          <p className="text-xs text-ink-light/60">
            Version 1.0.0 • Made with 🧡
          </p>
        </div>
      </Modal>
    </div>
  );
}

