import { create } from 'zustand';
import { Prompt, PromptFolder, PromptVersion, PromptChain } from '../types';
import { 
  getPrompts, savePrompt, deletePrompt as dbDeletePrompt,
  getPromptFolders, savePromptFolder, deletePromptFolder as dbDeletePromptFolder,
  getPromptVersions, savePromptVersion,
  getPromptChains, savePromptChain, deletePromptChain as dbDeletePromptChain
} from '../services/db';

interface PromptState {
  prompts: Prompt[];
  folders: PromptFolder[];
  versions: Record<string, PromptVersion[]>;
  chains: PromptChain[];
  loadPrompts: () => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  addFolder: (name: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  loadVersions: (promptId: string) => Promise<void>;
  revertPrompt: (promptId: string, versionId: string) => Promise<void>;
  addChain: (name: string, promptIds: string[]) => Promise<void>;
  deleteChain: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  folders: [],
  versions: {},
  chains: [],
  loadPrompts: async () => {
    const prompts = await getPrompts();
    const folders = await getPromptFolders();
    const chains = await getPromptChains();
    prompts.sort((a, b) => b.updatedAt - a.updatedAt);
    chains.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ prompts, folders, chains });
  },
  addPrompt: async (promptData) => {
    const newPrompt: Prompt = {
      ...promptData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await savePrompt(newPrompt);
    await savePromptVersion({ id: crypto.randomUUID(), promptId: newPrompt.id, text: newPrompt.text, timestamp: Date.now() });
    set((state) => ({ prompts: [newPrompt, ...state.prompts] }));
  },
  updatePrompt: async (id, updates) => {
    const { prompts } = get();
    const idx = prompts.findIndex(p => p.id === id);
    if (idx === -1) return;

    const oldPrompt = prompts[idx];
    const updated = { ...oldPrompt, ...updates, updatedAt: Date.now() };
    await savePrompt(updated);

    if (updates.text !== undefined && updates.text !== oldPrompt.text) {
      await savePromptVersion({ id: crypto.randomUUID(), promptId: id, text: updates.text, timestamp: Date.now() });
      await get().loadVersions(id);
    }

    const newPrompts = [...prompts];
    newPrompts[idx] = updated;
    newPrompts.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ prompts: newPrompts });
  },
  deletePrompt: async (id) => {
    await dbDeletePrompt(id);
    set((state) => ({ prompts: state.prompts.filter(p => p.id !== id) }));
  },
  addFolder: async (name, parentId) => {
    const newFolder: PromptFolder = {
      id: crypto.randomUUID(),
      name,
      parentId: parentId || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await savePromptFolder(newFolder);
    set((state) => ({ folders: [...state.folders, newFolder] }));
  },
  deleteFolder: async (id) => {
    await dbDeletePromptFolder(id);
    set((state) => ({ folders: state.folders.filter(f => f.id !== id) }));
  },
  loadVersions: async (promptId) => {
    const v = await getPromptVersions(promptId);
    set((state) => ({ versions: { ...state.versions, [promptId]: v } }));
  },
  revertPrompt: async (promptId, versionId) => {
    const { versions } = get();
    const vs = versions[promptId];
    if (!vs) return;
    const target = vs.find(v => v.id === versionId);
    if (!target) return;
    await get().updatePrompt(promptId, { text: target.text });
  },
  addChain: async (name, promptIds) => {
    const chain: PromptChain = {
        id: crypto.randomUUID(),
        name,
        promptIds,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await savePromptChain(chain);
    set(state => ({ chains: [chain, ...state.chains] }));
  },
  deleteChain: async (id) => {
    await dbDeletePromptChain(id);
    set(state => ({ chains: state.chains.filter(c => c.id !== id) }));
  }
}));
