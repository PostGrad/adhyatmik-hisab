/**
 * Application State Store - Zustand
 * 
 * Handles UI state, auth state, and ephemeral state.
 * Data state (habits, logs) is managed by Dexie useLiveQuery.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TabId, Toast, SyncStatus, GoogleUser, HisabType } from '../types';
import { formatDateKey } from '../db';

// ============================================================================
// Store Interface
// ============================================================================

interface AppState {
  // Navigation
  activeTab: TabId;
  selectedDate: string;
  activeHisab: HisabType;  // Which hisab is currently shown
  
  // Auth & Security
  isLocked: boolean;
  pinHash: string | null;
  pinEnabled: boolean;
  user: GoogleUser | null;
  isAuthenticated: boolean;
  
  // Sync
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  syncError: string | null;
  
  // UI
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  isOnboardingComplete: boolean;
  
  // Modals
  activeModal: string | null;
  modalData: unknown;
}

interface AppActions {
  // Navigation
  setActiveTab: (tab: TabId) => void;
  setSelectedDate: (date: string) => void;
  setActiveHisab: (hisab: HisabType) => void;
  goToToday: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  
  // Auth & Security
  setPin: (hash: string) => void;
  removePin: () => void;
  lock: () => void;
  unlock: () => void;
  setUser: (user: GoogleUser | null) => void;
  logout: () => void;
  
  // Sync
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  setLastSyncAt: (date: Date) => void;
  
  // UI
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  completeOnboarding: () => void;
  
  // Modals
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
}

type AppStore = AppState & AppActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ---- Initial State ----
      activeTab: 'today',
      selectedDate: formatDateKey(new Date()),
      activeHisab: 'shubh',
      
      isLocked: false,
      pinHash: null,
      pinEnabled: false,
      user: null,
      isAuthenticated: false,
      
      syncStatus: 'idle',
      lastSyncAt: null,
      syncError: null,
      
      theme: 'system',
      toasts: [],
      isOnboardingComplete: false,
      
      activeModal: null,
      modalData: null,
      
      // ---- Actions ----
      
      // Navigation
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      setActiveHisab: (hisab) => set({ activeHisab: hisab }),
      
      goToToday: () => set({ selectedDate: formatDateKey(new Date()) }),
      
      goToPreviousDay: () => {
        const current = new Date(get().selectedDate);
        current.setDate(current.getDate() - 1);
        set({ selectedDate: formatDateKey(current) });
      },
      
      goToNextDay: () => {
        const current = new Date(get().selectedDate);
        current.setDate(current.getDate() + 1);
        set({ selectedDate: formatDateKey(current) });
      },
      
      // Auth & Security
      setPin: (hash) => set({ pinHash: hash, pinEnabled: true, isLocked: true }),
      
      removePin: () => set({ pinHash: null, pinEnabled: false, isLocked: false }),
      
      lock: () => {
        if (get().pinEnabled) {
          set({ isLocked: true });
        }
      },
      
      unlock: () => set({ isLocked: false }),
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: user !== null 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        syncStatus: 'idle',
        lastSyncAt: null,
      }),
      
      // Sync
      setSyncStatus: (status, error) => set({ 
        syncStatus: status, 
        syncError: error || null 
      }),
      
      setLastSyncAt: (date) => set({ lastSyncAt: date }),
      
      // UI
      setTheme: (theme) => set({ theme }),
      
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        
        // Auto-remove after duration (default 4s)
        const duration = toast.duration ?? 4000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      
      // Modals
      openModal: (modalId, data) => set({ 
        activeModal: modalId, 
        modalData: data 
      }),
      
      closeModal: () => set({ 
        activeModal: null, 
        modalData: null 
      }),
    }),
    {
      name: 'adhyatmik-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        theme: state.theme,
        pinHash: state.pinHash,
        pinEnabled: state.pinEnabled,
        isOnboardingComplete: state.isOnboardingComplete,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsToday = (state: AppState) => {
  return state.selectedDate === formatDateKey(new Date());
};

export const selectCanGoForward = (state: AppState) => {
  const today = formatDateKey(new Date());
  return state.selectedDate < today;
};

// ============================================================================
// Auto-lock on visibility change
// ============================================================================

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const state = useAppStore.getState();
      if (state.pinEnabled && !state.isLocked) {
        // Lock after a short delay (user might just be switching apps briefly)
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            useAppStore.getState().lock();
          }
        }, 30000); // 30 seconds
      }
    }
  });
}

