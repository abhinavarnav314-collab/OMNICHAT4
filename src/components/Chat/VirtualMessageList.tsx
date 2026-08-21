import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import { User, Bot, RefreshCw } from 'lucide-react';

import BranchNavigator from './BranchNavigator';

const Row = ({ index, style, data }: any) => {
  const { messages, conversation, setSize, windowWidth, onResend, renderContent, renderMessageStats } = data;
  const rowRef = useRef<HTMLDivElement>(null);
  const msg = messages[index];

  useEffect(() => {
    if (rowRef.current) {
      setSize(index, rowRef.current.getBoundingClientRect().height);
    }
  }, [setSize, index, windowWidth, msg.content]);

  const isUser = msg.role === 'user';
  return (
    <div style={style}>
      <div ref={rowRef} className="py-3 px-4 w-full max-w-4xl mx-auto">
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`p-4 rounded-xl max-w-[85%] shadow-sm ${
            isUser 
              ? 'bg-[var(--accent-color)] text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent dark:border-slate-700'
          }`}>
            <div className={`flex items-center gap-2 mb-2 text-xs ${isUser ? 'opacity-80' : 'text-slate-500 dark:text-slate-400 font-semibold'}`}>
              {isUser ? (
                <>
                  <User size={14} /> You
                  <BranchNavigator conversation={conversation} message={msg} />
                  <button aria-label="Edit and Resend" onClick={() => onResend(msg.content, msg.parentId || null)} className="ml-auto hover:text-white p-1" title="Edit and Resend">
                     <RefreshCw size={12} />
                  </button>
                </>
              ) : (
                <>
                  <Bot size={14} /> {msg.modelId || 'Assistant'}
                  <BranchNavigator conversation={conversation} message={msg} />
                  {msg.isError && <span className="text-red-500 border border-red-500 rounded px-1 ml-auto">Error</span>}
                </>
              )}
            </div>
            <div aria-live={!isUser && msg.id === 'streaming' ? 'polite' : 'off'} className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none">
              {isUser ? msg.content : renderContent(msg.content)}
            </div>
            {!isUser && renderMessageStats(msg)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VirtualMessageList({ messages, conversation, onResend, renderContent, renderMessageStats }: any) {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
      if (containerRef.current) {
          setHeight(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setSize = useCallback((index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
        sizeMap.current[index] = size;
        if (listRef.current) {
            listRef.current.resetAfterIndex(index);
        }
    }
  }, []);

  const getSize = (index: number) => sizeMap.current[index] || 100;

  // Auto scroll
  useEffect(() => {
     if (listRef.current && messages.length > 0) {
         listRef.current.scrollToItem(messages.length - 1, 'end');
     }
  }, [messages]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <List
        ref={listRef}
        height={height}
        itemCount={messages.length}
        itemSize={getSize}
        width="100%"
        itemData={{ messages, conversation, setSize, windowWidth, onResend, renderContent, renderMessageStats }}
      >
        {Row}
      </List>
    </div>
  );
}
