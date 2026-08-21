import { OpenAICompatibleAdapter } from './base';
import { ProviderModel, Message } from '../../types';

export class CustomOpenAICompatibleAdapter extends OpenAICompatibleAdapter {
  id = 'custom';
  name = 'Custom OpenAI-Compatible';
  models: ProviderModel[] = []; 

  constructor() {
    super(''); 
  }

  async sendMessage(
    messages: Message[],
    model: string,
    apiKey: string, 
    onUpdate: (chunk: string) => void,
    signal?: AbortSignal,
    proxyUrl?: string,
    systemPrompt?: string,
    parameters?: any
  ): Promise<void> {
    // Custom provider expects the API key field to contain "URL|KEY"
    const parts = apiKey.split('|');
    let targetUrl = '';
    let actualKey = '';
    
    if (parts.length >= 2) {
        targetUrl = parts[0];
        actualKey = parts.slice(1).join('|');
    } else {
        targetUrl = apiKey; 
        actualKey = '';
    }

    let finalBaseUrl = targetUrl;
    if (!finalBaseUrl.endsWith('/chat/completions')) {
      finalBaseUrl = finalBaseUrl.replace(/\/?$/, '/chat/completions');
    }
    
    await super.sendMessage(messages, model, actualKey, onUpdate, signal, proxyUrl, systemPrompt, parameters, undefined, finalBaseUrl);
  }
}

export const customAdapter = new CustomOpenAICompatibleAdapter();
