import React, { useState, useRef, useEffect } from 'react';
import { usePromptStore } from '../../store/usePromptStore';
import { useChatStore } from '../../store/useChatStore';
import { sendMessageService } from '../../services/chatService';
import { PromptChain, Prompt } from '../../types';
import { X, Play, CheckCircle, StopCircle } from 'lucide-react';

interface ChainRunnerModalProps {
  chain: PromptChain;
  onClose: () => void;
  onInsertResult: (text: string) => void;
}

export default function ChainRunnerModal({ chain, onClose, onInsertResult }: ChainRunnerModalProps) {
  const { prompts } = usePromptStore();
  const { createConversation, conversations } = useChatStore();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showVarPrompt, setShowVarPrompt] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const chainPrompts = chain.promptIds.map(id => prompts.find(p => p.id === id)).filter(Boolean) as Prompt[];

  useEffect(() => {
     logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
      // Find all variables {{var}} in prompts
      const vars = new Set<string>();
      chainPrompts.forEach(p => {
          const matches = p.text.match(/{{\s*([^}]+?)\s*}}/g);
          if (matches) {
              matches.forEach(m => {
                  const inner = m.match(/{{\s*([^}]+?)\s*}}/)?.[1];
                  if (inner) vars.add(inner.trim());
              });
          }
      });
      if (vars.size > 0) {
          const initialVars: Record<string, string> = {};
          vars.forEach(v => initialVars[v] = '');
          setVariables(initialVars);
          setShowVarPrompt(true);
      }
  }, [chainPrompts]);

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
  };

  const handleClose = () => {
      handleStop();
      onClose();
  };

  const runChain = async () => {
     setRunning(true);
     setLogs([]);
     setFinalResult(null);
     setShowVarPrompt(false);
     
     abortControllerRef.current = new AbortController();
     
     let currentInput = "";
     
     try {
         // Create a temporary conversation for this chain
         await createConversation(false);
         const convoId = useChatStore.getState().activeId;
         if (!convoId) throw new Error("Could not create conversation for chain");
         
         for (let i = 0; i < chainPrompts.length; i++) {
            const p = chainPrompts[i];
            setLogs(prev => [...prev, `Running step ${i+1}: ${p.title}...`]);
            
            // Replace variables
            let promptContent = p.text;
            Object.keys(variables).forEach(key => {
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
                promptContent = promptContent.replace(regex, variables[key]);
            });
            
            // Combine with previous output if not first step
            if (i > 0) {
                promptContent = `${promptContent}\n\n${currentInput}`;
            } else if (currentInput) {
                promptContent = `${promptContent}\n\n${currentInput}`; // In case there's an initial input
            }
            
            await sendMessageService(convoId, promptContent, null, abortControllerRef.current.signal);
            
            if (abortControllerRef.current.signal.aborted) {
                setLogs(prev => [...prev, `Chain aborted.`]);
                break;
            }
            
            // Extract the result from the store
            const updatedConvo = useChatStore.getState().conversations.find(c => c.id === convoId);
            const lastMsg = updatedConvo?.messages[updatedConvo.messages.length - 1];
            
            if (lastMsg?.isError) {
                setLogs(prev => [...prev, `Error at step ${i+1}: ${lastMsg.content}`]);
                throw new Error("Chain failed at step " + (i+1));
            }
            
            currentInput = lastMsg?.content || "";
            setLogs(prev => [...prev, `Step ${i+1} completed.`]);
            setProgress(((i + 1) / chainPrompts.length) * 100);
         }
         
         if (!abortControllerRef.current.signal.aborted) {
             setLogs(prev => [...prev, `Chain completed.`]);
             setFinalResult(currentInput);
         }
     } catch (err: any) {
         setLogs(prev => [...prev, `Chain stopped due to error.`]);
     } finally {
         setRunning(false);
     }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
          <h2 className="font-bold">Run Chain: {chain.name}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X size={18}/></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="text-sm text-slate-500">
                This will execute {chainPrompts.length} prompts sequentially.
            </div>
            
            {showVarPrompt && !running && !finalResult && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="font-semibold text-sm">Fill in variables</h3>
                    {Object.keys(variables).map(key => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-slate-500 mb-1">{key}</label>
                            <input 
                                type="text"
                                className="w-full p-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded text-sm"
                                value={variables[key]}
                                onChange={e => setVariables({...variables, [key]: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            )}
            
            {running && (
                <div className="space-y-2">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-color)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="font-mono text-xs text-slate-500 h-32 overflow-y-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        {logs.map((l, i) => <div key={i}>{l}</div>)}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}
            
            {!running && !finalResult && (
                <button onClick={runChain} className="w-full py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-color)] flex items-center justify-center gap-2">
                    <Play size={16} /> Start Chain
                </button>
            )}
            
            {running && (
                <button onClick={handleStop} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2">
                    <StopCircle size={16} /> Stop
                </button>
            )}
            
            {finalResult && (
                <div className="space-y-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
                        <CheckCircle size={20} className="shrink-0" />
                        <span className="text-sm">Chain execution finished.</span>
                    </div>
                    <button onClick={() => { onInsertResult(finalResult); handleClose(); }} className="w-full py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-color)]">
                        Insert Result
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
