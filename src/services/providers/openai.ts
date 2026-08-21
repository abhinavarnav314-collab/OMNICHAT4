import { OpenAICompatibleAdapter } from './base';
import { ProviderModel, Message } from '../../types';

export class OpenAIAdapter extends OpenAICompatibleAdapter {
  id = 'openai';
  name = 'OpenAI';
  models: ProviderModel[] = [
    { id: 'gpt-4o', name: 'gpt-4o' },
    { id: 'gpt-4-turbo', name: 'gpt-4-turbo' },
    { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' }
  ];

  constructor() {
    super('https://api.openai.com/v1/chat/completions');
  }

  async sendMessage(
    messages: Message[],
    model: string,
    apiKey: string,
    onUpdate: (chunk: string) => void,
    signal?: AbortSignal,
    proxyUrl?: string,
    systemPrompt?: string,
    parameters?: any,
    onUsage?: (usage: { prompt: number; completion: number }) => void
  ): Promise<void> {
    if (!proxyUrl) {
      throw new Error("OpenAI requires a CORS proxy. Please set a proxy URL in Settings > API Keys and try again.");
    }
    return super.sendMessage(messages, model, apiKey, onUpdate, signal, proxyUrl, systemPrompt, parameters, onUsage);
  }
}

export const openaiAdapter = new OpenAIAdapter();
