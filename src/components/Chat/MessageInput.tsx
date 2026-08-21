import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  isGenerating: boolean;
  onStop: () => void;
}

export default function MessageInput({ onSend, isGenerating, onStop }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const handleInsert = (e: any) => {
      setInput(prev => prev + (prev ? '\n' : '') + e.detail);
    };
    window.addEventListener('insert-prompt', handleInsert);
    return () => window.removeEventListener('insert-prompt', handleInsert);
  }, []);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          className="flex-1 max-h-[200px] bg-transparent resize-none outline-none text-slate-800 dark:text-slate-200 py-2 px-2 text-sm"
          rows={1}
        />
        {isGenerating ? (
          <button
            onClick={onStop}
            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Stop generation"
          >
            <Square size={20} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 text-[var(--accent-color)] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send size={20} />
          </button>
        )}
      </div>
      <div className="max-w-4xl mx-auto text-center mt-2 text-[10px] text-slate-400">
        Ctrl+Shift+P for Command Palette • Ctrl+/ for Prompt Vault
      </div>
    </div>
  );
}
