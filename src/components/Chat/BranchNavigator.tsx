import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { useChatStore } from '../../store/useChatStore';

interface BranchNavigatorProps {
  conversation: Conversation;
  message: Message;
}

export default function BranchNavigator({ conversation, message }: BranchNavigatorProps) {
  const { setCurrentLeafId } = useChatStore();
  
  // Find all messages that have the same parentId as this message
  const siblings = conversation.messages.filter(m => String(m.parentId) === String(message.parentId));
  
  if (siblings.length <= 1) return null;

  // Find index of current message among siblings
  const currentIndex = siblings.findIndex(m => m.id === message.id);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Find the deepest leaf of this sibling
      const newSibling = siblings[currentIndex - 1];
      setCurrentLeafId(conversation.id, findDeepestLeaf(newSibling.id, conversation.messages));
    }
  };

  const handleNext = () => {
    if (currentIndex < siblings.length - 1) {
      const newSibling = siblings[currentIndex + 1];
      setCurrentLeafId(conversation.id, findDeepestLeaf(newSibling.id, conversation.messages));
    }
  };

  return (
    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium select-none ml-2">
      <button 
        onClick={handlePrevious} 
        disabled={currentIndex === 0}
        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Previous branch"
      >
        <ChevronLeft size={14} />
      </button>
      <span>{currentIndex + 1} / {siblings.length}</span>
      <button 
        onClick={handleNext} 
        disabled={currentIndex === siblings.length - 1}
        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Next branch"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// Helper to find the latest leaf node starting from a given message
function findDeepestLeaf(startId: string, allMessages: Message[]): string {
  let currentId = startId;
  while (true) {
    const children = allMessages.filter(m => m.parentId === currentId);
    if (children.length === 0) {
      return currentId;
    }
    // Pick the most recently created child
    const latestChild = children.reduce((latest, child) => child.timestamp > latest.timestamp ? child : latest, children[0]);
    currentId = latestChild.id;
  }
}
