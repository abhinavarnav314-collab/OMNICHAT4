import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-lg">
      <div className="text-sm font-semibold mb-2">
        {offlineReady ? 'App ready to work offline' : 'New content available, click on reload button to update.'}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <button
            className="px-3 py-1 bg-[var(--accent-color)] text-white rounded hover:bg-[var(--accent-color)]"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        )}
        <button
          className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
          onClick={() => close()}
        >
          Close
        </button>
      </div>
    </div>
  );
}
