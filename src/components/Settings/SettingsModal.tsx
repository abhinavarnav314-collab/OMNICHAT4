import React, { useState, useEffect } from 'react';
import { X, Lock, Key, Layout, Database, Trash2, BarChart2, Shield, Download, Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getProviders } from '../../services/providers';
import { getSecret, saveSecret, clearAllData, getConversations, getPrompts, getPromptFolders, getAllPromptVersions, getPromptChains, saveConversation, savePrompt, savePromptFolder } from '../../services/db';
import { encryptKey, decryptKey } from '../../services/crypto';
import Analytics from './Analytics';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, passphraseUnlocked, passphrase, unlock } = useAppStore();
  const [activeTab, setActiveTab] = useState<'general' | 'keys' | 'security' | 'data' | 'analytics'>('keys');
  const [localPassphrase, setLocalPassphrase] = useState('');
  
  const providers = getProviders();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (passphraseUnlocked && passphrase) {
      const loadKeys = async () => {
        const keys: Record<string, string> = {};
        for (const p of providers) {
          const enc = await getSecret(p.id);
          if (enc) {
            try {
              keys[p.id] = await decryptKey(enc, passphrase);
            } catch (e) {
               keys[p.id] = '';
            }
          } else {
            keys[p.id] = '';
          }
        }
        setApiKeys(keys);
      };
      loadKeys();
    }
  }, [passphraseUnlocked, passphrase]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sentinel = await getSecret('auth_sentinel');
      if (!sentinel) {
          await saveSecret('auth_sentinel', await encryptKey("AUTH_VERIFIED", localPassphrase));
          unlock(localPassphrase);
      } else {
          const decrypted = await decryptKey(sentinel, localPassphrase);
          if (decrypted === "AUTH_VERIFIED") {
             unlock(localPassphrase);
          } else {
             alert("Invalid passphrase");
          }
      }
    } catch (err) {
      alert("Invalid passphrase");
    }
  };

  const handleSaveKey = async (providerId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: value }));
    if (!passphrase) return;
    if (!value) return;
    const encrypted = await encryptKey(value, passphrase);
    await saveSecret(providerId, encrypted);
  };

  const handleClearData = async () => {
      if (confirm("Are you sure? This will delete all conversations, prompts, API keys, and settings. This cannot be undone.")) {
          await clearAllData();
          localStorage.removeItem('omni-settings');
          window.location.reload();
      }
  };

  const handleExport = async () => {
      const data = {
          conversations: await getConversations(),
          prompts: await getPrompts(),
          promptFolders: await getPromptFolders(),
          promptVersions: await getAllPromptVersions(),
          promptChains: await getPromptChains()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnichat-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.conversations) {
                  for (const c of data.conversations) await saveConversation(c);
              }
              if (data.prompts) {
                  for (const p of data.prompts) await savePrompt(p);
              }
              if (data.promptFolders) {
                  for (const f of data.promptFolders) await savePromptFolder(f);
              }
              alert('Data imported successfully!');
              window.location.reload();
          } catch (err) {
              alert('Failed to import data: Invalid format.');
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[600px] max-h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r dark:border-slate-800 p-4 space-y-2 shrink-0 overflow-y-auto">
            <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${activeTab === 'keys' ? 'bg-blue-50 text-[var(--accent-color)] dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Key size={16} /> API Keys
            </button>
            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${activeTab === 'general' ? 'bg-blue-50 text-[var(--accent-color)] dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Layout size={16} /> General
            </button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-[var(--accent-color)] dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Shield size={16} /> Security
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-[var(--accent-color)] dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <BarChart2 size={16} /> Analytics
            </button>
            <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${activeTab === 'data' ? 'bg-blue-50 text-[var(--accent-color)] dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Database size={16} /> Data Backup
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!passphraseUnlocked ? (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-[var(--accent-color)] dark:text-blue-400 rounded-full">
                  <Lock size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Unlock Settings</h3>
                  <p className="text-sm text-slate-500 mb-6">Enter your master passphrase to manage settings and keys.</p>
                </div>
                <form onSubmit={handleUnlock} className="w-full space-y-4">
                  <input
                    type="password"
                    placeholder="Enter Master Passphrase"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={localPassphrase}
                    onChange={(e) => setLocalPassphrase(e.target.value)}
                  />
                  <button type="submit" className="w-full py-3 bg-[var(--accent-color)] hover:bg-[var(--accent-color)] text-white rounded-lg transition-colors font-medium">
                    Unlock
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'keys' && (
                  <>
                    <div>
                      <h3 className="font-bold mb-4">API Keys</h3>
                      <p className="text-sm text-slate-500 mb-6">Keys are encrypted locally using your master passphrase and AES-GCM (PBKDF2, 210,000 iterations). They never leave your device.</p>
                      
                      <div className="space-y-4 max-h-[400px] pr-2 overflow-y-auto custom-scrollbar">
                        {providers.map(p => {
                          if (p.id === 'custom') {
                            const val = apiKeys[p.id] || '';
                            const parts = val.split('|');
                            const url = parts.length > 1 ? parts[0] : (val.includes('http') ? val : '');
                            const key = parts.length > 1 ? parts.slice(1).join('|') : (!val.includes('http') ? val : '');
                            return (
                                <div key={p.id} className="space-y-2 pb-4 border-b dark:border-slate-800">
                                  <label className="block text-sm font-semibold mb-1">{p.name}</label>
                                  <input
                                      type="text"
                                      placeholder="Base URL (e.g. https://api.openai.com/v1)"
                                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                      value={url}
                                      onChange={(e) => handleSaveKey(p.id, `${e.target.value}|${key}`)}
                                  />
                                  <input
                                      type="password"
                                      placeholder={`Enter ${p.name} API Key`}
                                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                      value={key}
                                      onChange={(e) => handleSaveKey(p.id, `${url}|${e.target.value}`)}
                                  />
                                </div>
                            );
                          }
                          return (
                          <div key={p.id} className="pb-4 border-b dark:border-slate-800 last:border-0 last:pb-0">
                            <label className="block text-sm font-semibold mb-1">{p.name}</label>
                            <input
                              type="password"
                              placeholder={`Enter ${p.name} API Key`}
                              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                              value={apiKeys[p.id] || ''}
                              onChange={(e) => handleSaveKey(p.id, e.target.value)}
                            />
                          </div>
                        )})}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold mb-4">Appearance</h3>
                      <div className="flex gap-4">
                        {(['light', 'dark', 'system'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => updateSettings({ theme: t })}
                            className={`px-4 py-2 rounded-lg capitalize border ${settings.theme === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-[var(--accent-color)] dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-4">CORS Proxy Configuration</h3>
                      <p className="text-sm text-slate-500 mb-4">Some AI providers (like OpenAI) block direct browser requests. You can deploy a free CORS proxy (e.g., Cloudflare Worker) and enter its URL here to use those providers.</p>
                      <input
                        type="url"
                        placeholder="e.g. https://my-proxy.workers.dev/"
                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-sm font-mono"
                        value={settings.proxyUrl || ''}
                        onChange={(e) => updateSettings({ proxyUrl: e.target.value })}
                      />
                    </div>
                    
                    <div>
                        <h3 className="font-bold mb-4">Accent Color</h3>
                        <p className="text-sm text-slate-500 mb-4">Customize the primary accent color of the application.</p>
                        <div className="flex items-center gap-4">
                            <input 
                                type="color" 
                                value={settings.accentColor || '#2563eb'}
                                onChange={(e) => updateSettings({ accentColor: e.target.value })}
                                className="w-12 h-12 p-1 rounded cursor-pointer bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"
                            />
                            <button 
                                onClick={() => updateSettings({ accentColor: '#2563eb' })}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                Reset to Default
                            </button>
                        </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-bold mb-4 text-lg">Auto-Lock</h3>
                      <p className="text-sm text-slate-500 mb-4">Automatically lock settings and require passphrase after a period of inactivity.</p>
                      
                      <div className="flex items-center justify-between p-4 border dark:border-slate-700 rounded-lg">
                        <span className="font-medium">Enable Auto-Lock</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.autoLockEnabled || false} onChange={(e) => updateSettings({ autoLockEnabled: e.target.checked })} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--accent-color)]"></div>
                        </label>
                      </div>
                      
                      {settings.autoLockEnabled && (
                        <div className="mt-4">
                           <label className="block text-sm font-medium mb-1">Timeout (minutes)</label>
                           <input type="number" min="1" max="60" value={settings.autoLockTimeout || 5} onChange={e => updateSettings({autoLockTimeout: parseInt(e.target.value)})} className="w-24 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none" />
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t dark:border-slate-700">
                        <h3 className="font-bold mb-4 text-red-500 flex items-center gap-2"><Trash2 size={18}/> Danger Zone</h3>
                        <p className="text-sm text-slate-500 mb-4">Permanently delete all API keys, conversations, prompts, and settings.</p>
                        <button onClick={handleClearData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Purge All Local Data</button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'analytics' && (
                    <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Analytics...</div>}>
                        <Analytics />
                    </React.Suspense>
                )}
                
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold mb-4 text-lg">Backup & Restore</h3>
                            <p className="text-sm text-slate-500 mb-6">Export your conversations and prompts to a JSON file, or restore from a previous backup. API keys are <b>not</b> exported.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border dark:border-slate-700 p-6 rounded-xl flex flex-col items-center text-center">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-[var(--accent-color)] dark:text-blue-400 rounded-full mb-3">
                                        <Download size={24} />
                                    </div>
                                    <h4 className="font-bold mb-1">Export Data</h4>
                                    <p className="text-xs text-slate-500 mb-4">Save all data to a local file.</p>
                                    <button onClick={handleExport} className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                                        Export JSON
                                    </button>
                                </div>
                                
                                <div className="border dark:border-slate-700 p-6 rounded-xl flex flex-col items-center text-center">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-3">
                                        <Upload size={24} />
                                    </div>
                                    <h4 className="font-bold mb-1">Import Data</h4>
                                    <p className="text-xs text-slate-500 mb-4">Restore from a JSON backup file.</p>
                                    <label className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors cursor-pointer">
                                        Import JSON
                                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
