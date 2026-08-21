import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useChatStore } from './store/useChatStore';
import { usePromptStore } from './store/usePromptStore';
import { MessageSquare, Plus, Settings, Menu, X, DownloadCloud, WifiOff } from 'lucide-react';
import ChatWindow from './components/Chat/ChatWindow';
import PromptList from './components/PromptVault/PromptList';
import SettingsModal from './components/Settings/SettingsModal';
import CommandPalette from './components/Shared/CommandPalette';
import ReloadPrompt from './components/Shared/ReloadPrompt';

function App() {
  const { settings, isSidebarOpen, isPromptVaultOpen, toggleSidebar, togglePromptVault } = useAppStore();
  const { conversations, activeId, setActiveId, createConversation, loadConversations, deleteConversation } = useChatStore();
  const { loadPrompts } = usePromptStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    loadConversations();
    loadPrompts();
  }, [loadConversations, loadPrompts]);

  useEffect(() => {
    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings.theme]);

  useEffect(() => {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor || '#2563eb');
  }, [settings.accentColor]);

  // PWA Install & Offline
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') setDeferredPrompt(null);
      }
  };

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
              e.preventDefault();
              setShowCommandPalette(true);
          } else if (e.ctrlKey && e.key === '/') {
              e.preventDefault();
              togglePromptVault();
          } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
              e.preventDefault();
              createConversation();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePromptVault, createConversation]);

  const totalCost = conversations.reduce((acc, c) => acc + c.messages.reduce((mc, m) => mc + (m.cost || 0), 0), 0);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 overflow-hidden text-sm">
      {/* Main Sidebar */}
      <div className={`flex flex-col bg-slate-50 dark:bg-slate-900 border-r dark:border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 flex items-center gap-2 border-b dark:border-slate-800 shrink-0">
          <MessageSquare className="text-[var(--accent-color)] dark:text-blue-400" />
          <h1 className="font-bold text-lg tracking-tight">OmniChat</h1>
        </div>

        <div className="p-4 shrink-0 space-y-2">
          <button 
            onClick={() => createConversation()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-color)] transition-colors shadow-sm font-medium"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setActiveId(convo.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                activeId === convo.id 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="truncate flex-1 font-medium">{convo.title}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t dark:border-slate-800 shrink-0 space-y-4">
            {isOffline && (
                <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg font-semibold justify-center">
                    <WifiOff size={14} /> Offline Mode
                </div>
            )}
            {deferredPrompt && (
                <button 
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-medium text-sm border border-green-200 dark:border-green-800"
                >
                    <DownloadCloud size={16} /> Install App
                </button>
            )}
            <div className="text-xs text-slate-500 flex justify-between">
                <span>Cumulative Cost:</span>
                <span className="font-mono font-bold">${totalCost.toFixed(3)}</span>
            </div>
            <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 font-medium"
            >
                <Settings size={18} /> Settings
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 shadow-xl z-10">
        <ChatWindow />
      </div>

      {/* Prompt Vault Sidebar */}
      {isPromptVaultOpen && <PromptList />}

      {/* Toggle Buttons */}
      <button 
        onClick={toggleSidebar}
        className="absolute top-4 left-4 z-20 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        title="Toggle Sidebar (Ctrl+\)"
      >
        <Menu size={16} />
      </button>

      <button 
        onClick={togglePromptVault}
        className="absolute top-4 right-4 z-20 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        title="Toggle Prompt Vault (Ctrl+/)"
      >
        <Menu size={16} />
      </button>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
      <ReloadPrompt />
    </div>
  );
}

export default App;
