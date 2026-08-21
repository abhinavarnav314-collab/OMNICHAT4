export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  parentId?: string | null;
  modelId?: string;
  providerId?: string;
  tokens?: { prompt: number; completion: number };
  cost?: number;
  isError?: boolean;
  isUsageEstimated?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  createdAt: number;
  systemPrompt?: string;
  isComparison?: boolean;
  comparisonModels?: Array<{providerId: string; modelId: string}>;
  currentLeafId?: string;
  parameters?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface ProviderModel {
  id: string;
  name: string;
}

export interface PromptFolder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  text: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  folderId?: string | null;
  isFavorite?: boolean;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  text: string;
  timestamp: number;
}

export interface PromptChain {
  id: string;
  name: string;
  promptIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultProviderId: string;
  defaultModelId: string;
  proxyUrl?: string;
  autoLockEnabled?: boolean;
  autoLockTimeout?: number;
  accentColor?: string;
}

export interface EncryptedKey {
  ciphertext: string;
  iv: string;
  salt: string;
}
