import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { Toast as ToastType } from '../../types';
import { cn } from '../../utils';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'bg-forest-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-saffron-600 text-white',
  warning: 'bg-gold-500 text-ink',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useAppStore((s) => s.removeToast);
  const Icon = iconMap[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevated',
        'min-w-[280px] max-w-sm',
        colorMap[toast.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

