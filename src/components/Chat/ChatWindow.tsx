import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import { Columns } from 'lucide-react';
import { sendMessageService } from '../../services/chatService';

export default function ChatWindow() {
  const { conversations, activeId, createConversation } = useChatStore();
  const activeConvo = conversations.find(c => c.id === activeId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!activeConvo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">
        <div className="text-center">
          <p className="mb-4">No conversation selected</p>
          <button 
            onClick={() => createConversation()}
            className="px-4 py-2 bg-[var(--accent-color)] text-white rounded hover:bg-[var(--accent-color)] transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (content: string, parentId?: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    try {
      await sendMessageService(activeConvo.id, content, parentId || activeConvo.currentLeafId, abortControllerRef.current.signal);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleToggleCompare = async () => {
    // Cannot toggle in middle, we'll create a new conversation if they want to compare
    if (!activeConvo.isComparison) {
      createConversation(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
      <div className="h-14 border-b dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">
          {activeConvo.title}
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleCompare}
            className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${activeConvo.isComparison ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Start comparison chat"
          >
            <Columns size={16} /> Compare
          </button>
          <ModelSelector isComparison={activeConvo.isComparison} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <MessageList 
          conversation={activeConvo} 
          isComparison={activeConvo.isComparison} 
          onResend={(content, parentId) => handleSendMessage(content, parentId)}
        />
      </div>

      <div className="shrink-0">
        <MessageInput 
          onSend={handleSendMessage} 
          isGenerating={isGenerating} 
          onStop={stopGenerating}
        />
      </div>
    </div>
  );
}
