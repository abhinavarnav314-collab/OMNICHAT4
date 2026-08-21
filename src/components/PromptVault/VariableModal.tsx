import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VariableModalProps {
  variables: string[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export default function VariableModal({ variables, onSubmit, onCancel }: VariableModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    // Focus Trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleTab);
    
    // Auto-focus first input
    const inputs = modalRef.current?.querySelectorAll('input');
    if (inputs && inputs.length > 0) {
      inputs[0].focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTab);
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 shrink-0">
          <h2 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-200">Fill Variables</h2>
          <button onClick={onCancel} aria-label="Close" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <form id="var-form" onSubmit={handleSubmit} className="space-y-4">
            {variables.map(v => (
              <div key={v}>
                <label htmlFor={`var-${v}`} className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{v}</label>
                <input 
                  id={`var-${v}`}
                  type="text"
                  required
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={values[v] || ''}
                  onChange={e => setValues({ ...values, [v]: e.target.value })}
                />
              </div>
            ))}
          </form>
        </div>
        <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-2 shrink-0">
          <button onClick={onCancel} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button type="submit" form="var-form" className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color)] text-white rounded transition-colors">
            Insert Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
