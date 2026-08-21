import React, { useState } from 'react';
import { getProviders } from '../../services/providers';
import { useAppStore } from '../../store/useAppStore';
import { useChatStore } from '../../store/useChatStore';
import { Settings2 } from 'lucide-react';

export default function ModelSelector({ isComparison = false }: { isComparison?: boolean }) {
  const providers = getProviders();
  const { settings, updateSettings } = useAppStore();
  const { activeId, conversations, setComparisonModels, updateConversationParameters } = useChatStore();
  
  const activeConvo = conversations.find(c => c.id === activeId);
  const [showParams, setShowParams] = useState(false);

  if (!activeConvo) return null;

  if (isComparison) {
    const models = activeConvo.comparisonModels || [
      { providerId: settings.defaultProviderId, modelId: settings.defaultModelId },
      { providerId: settings.defaultProviderId, modelId: settings.defaultModelId }
    ];

    return (
      <div className="flex gap-4 items-center">
        {[0, 1].map((idx) => {
          const currentProvId = models[idx].providerId;
          const currentProv = providers.find(p => p.id === currentProvId) || providers[0];
          return (
            <div key={idx} className="flex gap-2 items-center p-2 border rounded dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <span className="text-xs opacity-50 uppercase font-bold">Model {idx + 1}</span>
              <select 
                className="bg-transparent text-sm outline-none"
                value={currentProvId}
                onChange={e => {
                  const newModels = [...models];
                  const p = providers.find(x => x.id === e.target.value);
                  newModels[idx] = { providerId: p!.id, modelId: p!.models[0]?.id || '' };
                  setComparisonModels(activeConvo.id, newModels);
                }}
              >
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {currentProv.id !== 'custom' ? (
                <select
                  className="bg-transparent text-sm outline-none"
                  value={models[idx].modelId}
                  onChange={e => {
                    const newModels = [...models];
                    newModels[idx] = { ...newModels[idx], modelId: e.target.value };
                    setComparisonModels(activeConvo.id, newModels);
                  }}
                >
                  {currentProv.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="Custom model ID"
                  className="bg-transparent text-sm outline-none w-32"
                  value={models[idx].modelId}
                  onChange={e => {
                    const newModels = [...models];
                    newModels[idx] = { ...newModels[idx], modelId: e.target.value };
                    setComparisonModels(activeConvo.id, newModels);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const provider = providers.find(p => p.id === settings.defaultProviderId) || providers[0];

  return (
    <div className="flex items-center gap-2 relative">
      <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-1 rounded border dark:border-slate-700">
        <select 
          className="bg-transparent text-sm outline-none p-1"
          value={settings.defaultProviderId}
          onChange={e => {
            const p = providers.find(x => x.id === e.target.value);
            updateSettings({ defaultProviderId: p?.id, defaultModelId: p?.models[0]?.id || '' });
          }}
        >
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        
        {provider.id !== 'custom' ? (
          <select
            className="bg-transparent text-sm outline-none p-1 border-l dark:border-slate-700"
            value={settings.defaultModelId}
            onChange={e => updateSettings({ defaultModelId: e.target.value })}
          >
            {provider.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        ) : (
          <input 
            type="text" 
            placeholder="Custom model ID"
            className="bg-transparent text-sm outline-none p-1 border-l dark:border-slate-700 w-32"
            value={settings.defaultModelId}
            onChange={e => updateSettings({ defaultModelId: e.target.value })}
          />
        )}
      </div>
      <button onClick={() => setShowParams(!showParams)} className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${showParams ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>
        <Settings2 size={16} />
      </button>

      {showParams && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl p-4 z-50">
          <h3 className="font-bold mb-3 text-sm border-b pb-2 dark:border-slate-700">Model Parameters</h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="flex justify-between mb-1">
                <span>Temperature</span>
                <span>{activeConvo.parameters?.temperature ?? 0.7}</span>
              </label>
              <input type="range" min="0" max="2" step="0.1" className="w-full"
                value={activeConvo.parameters?.temperature ?? 0.7}
                onChange={e => updateConversationParameters(activeConvo.id, { temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="flex justify-between mb-1">
                <span>Top P</span>
                <span>{activeConvo.parameters?.top_p ?? 1}</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" className="w-full"
                value={activeConvo.parameters?.top_p ?? 1}
                onChange={e => updateConversationParameters(activeConvo.id, { top_p: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block mb-1">Max Tokens</label>
              <input type="number" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                value={activeConvo.parameters?.max_tokens ?? 4096}
                onChange={e => updateConversationParameters(activeConvo.id, { max_tokens: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
