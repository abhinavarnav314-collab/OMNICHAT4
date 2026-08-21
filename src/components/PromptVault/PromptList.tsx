import React, { useState } from 'react';
import { usePromptStore } from '../../store/usePromptStore';
import { Prompt, PromptChain } from '../../types';
import { Folder, Star, MoreVertical, Search, Download, Upload, Trash2, Link } from 'lucide-react';
import PromptEditor from './PromptEditor';
import VariableModal from './VariableModal';
import ChainRunnerModal from './ChainRunnerModal';

export default function PromptList() {
  const { prompts, folders, chains, updatePrompt, deletePrompt, addFolder, deleteFolder, addChain, deleteChain } = usePromptStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'chains'>('prompts');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Variable Modal
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  
  // Chain Modal
  const [activeChain, setActiveChain] = useState<PromptChain | null>(null);

  const handleUsePrompt = (prompt: Prompt) => {
    const matches = prompt.text.match(/{{\s*([^}]+?)\s*}}/g);
    if (matches && matches.length > 0) {
      const uniqueVars = Array.from(new Set(matches.map(m => {
        const inner = m.match(/{{\s*([^}]+?)\s*}}/)?.[1];
        return inner ? inner.trim() : '';
      }).filter(Boolean)));
      setVariables(uniqueVars);
      setActivePrompt(prompt);
    } else {
      insertPromptText(prompt.text);
    }
  };

  const handleVariableSubmit = (values: Record<string, string>) => {
    if (!activePrompt) return;
    let final = activePrompt.text;
    for (const [key, val] of Object.entries(values)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      final = final.replace(regex, val);
    }
    insertPromptText(final);
    setActivePrompt(null);
  };

  const insertPromptText = (text: string) => {
    // We can dispatch a custom event that MessageInput listens to, or put it in ChatStore
    const event = new CustomEvent('insert-prompt', { detail: text });
    window.dispatchEvent(event);
  };

  const handleExport = () => {
    const data = JSON.stringify({ prompts, folders });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omnICHat-prompts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              const newFolderMap: Record<string, string> = {};
              
              if (data.folders && Array.isArray(data.folders)) {
                  for (const f of data.folders) {
                      const existing = folders.find(ex => ex.name === f.name);
                      if (existing) {
                          newFolderMap[f.id] = existing.id;
                      } else {
                          const newFolder = { id: crypto.randomUUID(), name: f.name };
                          // We need an addFolder that accepts full object or we can just use the store
                          // Actually, addFolder in store just takes a name and generates ID, we can't easily map it if we don't know the new ID.
                          // Let's rely on the store exposing a way or just adding it and fetching it back.
                          // Since addFolder returns void, we'll just import prompts without folders if it's too complex,
                          // OR we can update the store to return the new folder ID. Let's assume addFolder might be updated, 
                          // but for now let's just do a simple mapping based on name.
                          usePromptStore.setState(state => {
                             const newF = { id: crypto.randomUUID(), name: f.name, createdAt: Date.now(), updatedAt: Date.now() };
                             newFolderMap[f.id] = newF.id;
                             return { folders: [...state.folders, newF] };
                          });
                      }
                  }
              }

              if (data.prompts && Array.isArray(data.prompts)) {
                  usePromptStore.setState(state => {
                      const updatedPrompts = [...state.prompts];
                      for (const p of data.prompts) {
                          const existingIndex = updatedPrompts.findIndex(ex => ex.title === p.title && ex.description === p.description);
                          const mappedFolderId = p.folderId ? (newFolderMap[p.folderId] || p.folderId) : null;
                          if (existingIndex >= 0) {
                              updatedPrompts[existingIndex] = { ...updatedPrompts[existingIndex], text: p.text, folderId: mappedFolderId };
                          } else {
                              updatedPrompts.push({ ...p, id: crypto.randomUUID(), folderId: mappedFolderId });
                          }
                      }
                      return { prompts: updatedPrompts };
                  });
              }
              alert("Imported successfully");
          } catch(err) {
              alert("Invalid JSON");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      const promptId = e.dataTransfer.getData('text/plain');
      if (promptId) {
          await updatePrompt(promptId, { folderId });
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const filtered = prompts.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateChain = () => {
    const selectedPrompts = window.prompt("Enter comma-separated prompt IDs to chain (In a real app this would be a selection UI):");
    if (!selectedPrompts) return;
    const name = window.prompt("Enter chain name:");
    if (!name) return;
    addChain(name, selectedPrompts.split(',').map(s => s.trim()));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l dark:border-slate-800 w-80 shrink-0">
      <div className="p-4 border-b dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Prompt Vault</h2>
          <div className="flex gap-1">
              <button onClick={() => setIsCreating(true)} className="p-1.5 bg-[var(--accent-color)] text-white rounded hover:bg-[var(--accent-color)]" title="New Prompt">+</button>
              <button onClick={() => {
                  const name = prompt("Folder Name:");
                  if(name) addFolder(name);
              }} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600" title="New Folder"><Folder size={14} /></button>
              <button onClick={handleCreateChain} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600" title="New Chain"><Link size={14} /></button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4 text-sm font-semibold">
          <button onClick={() => setActiveTab('prompts')} className={`px-2 py-1 rounded ${activeTab === 'prompts' ? 'bg-slate-200 dark:bg-slate-700' : 'text-slate-500'}`}>Prompts</button>
          <button onClick={() => setActiveTab('chains')} className={`px-2 py-1 rounded ${activeTab === 'chains' ? 'bg-slate-200 dark:bg-slate-700' : 'text-slate-500'}`}>Chains</button>
        </div>

        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--accent-color)] dark:text-blue-400">
            <button onClick={handleExport} className="flex items-center gap-1 hover:underline"><Download size={12}/> Export</button>
            <label className="flex items-center gap-1 hover:underline cursor-pointer">
                <Upload size={12}/> Import
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'prompts' ? (
          <>
            {/* Render Folders */}
            {!search && folders.map(f => (
                <div key={f.id} className="space-y-1" onDrop={(e) => handleDrop(e, f.id)} onDragOver={handleDragOver}>
                    <div className="flex items-center justify-between p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer group" onClick={() => setExpandedFolders(prev => ({...prev, [f.id]: !prev[f.id]}))}>
                        <div className="flex items-center gap-2 font-semibold text-sm">
                            <Folder size={16} className="text-blue-500" />
                            {f.name}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-500"><Trash2 size={14}/></button>
                    </div>
                    {expandedFolders[f.id] && (
                        <div className="pl-4 border-l border-slate-300 dark:border-slate-700 ml-2 space-y-2">
                            {prompts.filter(p => p.folderId === f.id).map(p => (
                                <PromptItem key={p.id} prompt={p} onEdit={() => setEditingId(p.id)} onUse={() => handleUsePrompt(p)} onDelete={() => deletePrompt(p.id)} />
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Render Prompts not in folders or search results */}
            {filtered.filter(p => search ? true : !p.folderId).map(p => (
               <PromptItem key={p.id} prompt={p} onEdit={() => setEditingId(p.id)} onUse={() => handleUsePrompt(p)} onDelete={() => deletePrompt(p.id)} />
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">No prompts found.</p>}
          </>
        ) : (
          <>
             {chains.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                 <div key={c.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2"><Link size={14}/> {c.name}</h3>
                        <button onClick={() => deleteChain(c.id)} className="text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Trash2 size={14}/></button>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">{c.promptIds.length} steps in chain.</div>
                    <button onClick={() => setActiveChain(c)} className="w-full text-xs font-semibold text-[var(--accent-color)] dark:text-blue-400 hover:underline py-1 bg-blue-50 dark:bg-blue-900/20 rounded">Run Chain</button>
                 </div>
             ))}
             {chains.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">No chains created.</p>}
          </>
        )}
      </div>

      {(isCreating || editingId) && (
        <PromptEditor 
          promptId={editingId || undefined} 
          onClose={() => { setIsCreating(false); setEditingId(null); }} 
        />
      )}
      
      {activePrompt && (
          <VariableModal variables={variables} onSubmit={handleVariableSubmit} onCancel={() => setActivePrompt(null)} />
      )}
      
      {activeChain && (
          <ChainRunnerModal chain={activeChain} onClose={() => setActiveChain(null)} onInsertResult={(text) => insertPromptText(text)} />
      )}
    </div>
  );
}

function PromptItem({ prompt, onEdit, onUse, onDelete }: { prompt: Prompt, onEdit: () => void, onUse: () => void, onDelete: () => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', prompt.id)} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow relative cursor-move">
            <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-sm truncate pr-2 flex items-center gap-1">
                    {prompt.isFavorite && <Star size={12} className="text-yellow-500 fill-current" />}
                    {prompt.title}
                </h3>
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-slate-600"><MoreVertical size={16} /></button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{prompt.description}</p>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500">
                    {prompt.category || 'Uncategorized'}
                </span>
                <button onClick={onUse} className="text-xs font-semibold text-[var(--accent-color)] dark:text-blue-400 hover:underline">Use</button>
            </div>
            
            {menuOpen && (
                <div className="absolute top-8 right-2 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded py-1 z-10 w-24 text-sm">
                    <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button>
                    <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500">Delete</button>
                </div>
            )}
        </div>
    );
}
