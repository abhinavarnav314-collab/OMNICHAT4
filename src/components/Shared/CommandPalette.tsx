import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAppStore } from '../../store/useAppStore';

export default function CommandPalette({ onClose }: { onClose: () => void }) {
    const [search, setSearch] = useState('');
    const { createConversation } = useChatStore();
    const { toggleSidebar, togglePromptVault } = useAppStore();
    const inputRef = useRef<HTMLInputElement>(null);

    const actions = [
        { name: 'New Chat', action: () => createConversation() },
        { name: 'New Comparison Chat', action: () => createConversation(true) },
        { name: 'Toggle Sidebar', action: toggleSidebar },
        { name: 'Toggle Prompt Vault', action: togglePromptVault },
    ];

    const filtered = actions.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        inputRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32 px-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Type a command..." 
                    className="w-full p-4 bg-transparent border-b dark:border-slate-800 outline-none text-lg"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-96 overflow-y-auto">
                    {filtered.map((action, i) => (
                        <button
                            key={i}
                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm focus:bg-slate-100 dark:focus:bg-slate-800 outline-none"
                            onClick={() => {
                                action.action();
                                onClose();
                            }}
                        >
                            {action.name}
                        </button>
                    ))}
                    {filtered.length === 0 && <div className="p-4 text-slate-500 text-sm text-center">No commands found.</div>}
                </div>
            </div>
        </div>
    );
}
