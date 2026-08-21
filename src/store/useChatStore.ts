import { create } from 'zustand';
import { Conversation, Message } from '../types';
import { getConversations, saveConversation, deleteConversation as dbDeleteConvo } from '../services/db';

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  createConversation: (isComparison?: boolean) => void;
  setActiveId: (id: string) => void;
  addMessage: (convoId: string, message: Message) => Promise<void>;
  updateMessage: (convoId: string, messageId: string, updates: Partial<Message>, skipSave?: boolean) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setSystemPrompt: (convoId: string, prompt: string) => Promise<void>;
  updateConversationParameters: (convoId: string, params: any) => Promise<void>;
  setComparisonModels: (convoId: string, models: Array<{providerId: string; modelId: string}>) => Promise<void>;
  setCurrentLeafId: (convoId: string, leafId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  isLoading: true,
  loadConversations: async () => {
    const convos = await getConversations();
    convos.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ conversations: convos, isLoading: false });
    if (convos.length > 0) {
      set({ activeId: convos[0].id });
    }
  },
  createConversation: async (isComparison = false) => {
    const newConvo: Conversation = {
      id: crypto.randomUUID(),
      title: isComparison ? 'Model Comparison' : 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComparison
    };
    await saveConversation(newConvo);
    set((state) => ({
      conversations: [newConvo, ...state.conversations],
      activeId: newConvo.id
    }));
  },
  setActiveId: (id) => set({ activeId: id }),
  addMessage: async (convoId, message) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;
    
    const convo = { ...conversations[idx] };
    convo.messages = [...convo.messages, message];
    convo.updatedAt = Date.now();
    convo.currentLeafId = message.id; // Update leaf to latest
    
    // Auto-generate title if first user message
    if (convo.messages.filter(m => m.role === 'user').length === 1 && message.role === 'user' && !convo.isComparison) {
      convo.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    }

    await saveConversation(convo);
    
    const newConvos = [...conversations];
    newConvos[idx] = convo;
    newConvos.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ conversations: newConvos });
  },
  updateMessage: async (convoId, messageId, updates, skipSave = false) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;

    const convo = { ...conversations[idx] };
    const msgIdx = convo.messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    convo.messages[msgIdx] = { ...convo.messages[msgIdx], ...updates };
    convo.updatedAt = Date.now();

    if (!skipSave) {
        await saveConversation(convo);
    }

    const newConvos = [...conversations];
    newConvos[idx] = convo;
    set({ conversations: newConvos });
  },
  deleteConversation: async (id) => {
    await dbDeleteConvo(id);
    set((state) => {
      const remaining = state.conversations.filter(c => c.id !== id);
      return {
        conversations: remaining,
        activeId: state.activeId === id ? (remaining[0]?.id || null) : state.activeId
      };
    });
  },
  setSystemPrompt: async (convoId, prompt) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;

    const convo = { ...conversations[idx], systemPrompt: prompt, updatedAt: Date.now() };
    await saveConversation(convo);

    const newConvos = [...conversations];
    newConvos[idx] = convo;
    set({ conversations: newConvos });
  },
  updateConversationParameters: async (convoId, params) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;

    const convo = { ...conversations[idx], parameters: { ...conversations[idx].parameters, ...params }, updatedAt: Date.now() };
    await saveConversation(convo);
    const newConvos = [...conversations];
    newConvos[idx] = convo;
    set({ conversations: newConvos });
  },
  setComparisonModels: async (convoId, models) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;

    const convo = { ...conversations[idx], comparisonModels: models, updatedAt: Date.now() };
    await saveConversation(convo);
    const newConvos = [...conversations];
    newConvos[idx] = convo;
    set({ conversations: newConvos });
  },
  setCurrentLeafId: async (convoId, leafId) => {
    const { conversations } = get();
    const idx = conversations.findIndex(c => c.id === convoId);
    if (idx === -1) return;

    const convo = { ...conversations[idx], currentLeafId: leafId, updatedAt: Date.now() };
    await saveConversation(convo);
    const newConvos = [...conversations];
    newConvos[idx] = convo;
    set({ conversations: newConvos });
  }
}));
