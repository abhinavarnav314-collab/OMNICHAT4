import { create } from 'zustand';
import { AppSettings } from '../types';

export function clearSecretsFromMemory() {
  useAppStore.setState({ passphraseUnlocked: false, passphrase: null });
}

interface AppState {
  settings: AppSettings;
  passphraseUnlocked: boolean;
  passphrase: string | null;
  isSidebarOpen: boolean;
  isPromptVaultOpen: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  unlock: (passphrase: string) => void;
  lock: () => void;
  toggleSidebar: () => void;
  togglePromptVault: () => void;
}

let autoLockTimer: NodeJS.Timeout | null = null;

const defaultSettings: AppSettings = {
  theme: 'system',
  defaultProviderId: 'openai',
  defaultModelId: 'gpt-4o',
  autoLockEnabled: false,
  autoLockTimeout: 5
};

export const useAppStore = create<AppState>((set, get) => {
  const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('omni-settings') : null;
  const initialSettings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  
  let lastActivity = 0;
  const resetAutoLock = () => {
    const now = Date.now();
    if (now - lastActivity < 5000) return;
    lastActivity = now;

    if (autoLockTimer) clearTimeout(autoLockTimer);
    const { settings, passphraseUnlocked, lock } = get();
    if (settings.autoLockEnabled && passphraseUnlocked) {
      autoLockTimer = setTimeout(() => {
        lock();
      }, (settings.autoLockTimeout || 5) * 60 * 1000);
    }
  };

  // Add event listeners for user activity to reset timer
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', resetAutoLock);
    window.addEventListener('keydown', resetAutoLock);
    window.addEventListener('click', resetAutoLock);
    window.addEventListener('touchstart', resetAutoLock);
  }

  return {
    settings: initialSettings,
    passphraseUnlocked: false,
    passphrase: null,
    isSidebarOpen: true,
    isPromptVaultOpen: true,
    updateSettings: (newSettings) => set((state) => {
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem('omni-settings', JSON.stringify(updated));
      // Re-evaluate autolock if settings change
      setTimeout(() => get().passphraseUnlocked && resetAutoLock(), 0);
      return { settings: updated };
    }),
    unlock: (passphrase) => {
        set({ passphraseUnlocked: true, passphrase });
        resetAutoLock();
    },
    lock: () => {
        if (autoLockTimer) clearTimeout(autoLockTimer);
        clearSecretsFromMemory();
    },
    toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
    togglePromptVault: () => set(state => ({ isPromptVaultOpen: !state.isPromptVaultOpen }))
  };
});
