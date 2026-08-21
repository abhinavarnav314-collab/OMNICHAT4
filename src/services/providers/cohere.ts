import { ProviderAdapter, handleProviderError } from './base';
import { Message, ProviderModel } from '../../types';

export class CohereAdapter implements ProviderAdapter {
  id = 'cohere';
  name = 'Cohere';
  models: ProviderModel[] = [
    { id: 'command-r-plus', name: 'command-r-plus' },
    { id: 'command-r', name: 'command-r' }
  ];

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
    const chatHistory = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content
    }));
    
    const lastMessage = messages[messages.length - 1]?.content || '';

    const payload: any = {
      model,
      message: lastMessage,
      chat_history: chatHistory,
      stream: true,
      ...parameters
    };
    
    if (systemPrompt) {
      payload.preamble = systemPrompt;
    }

    let fetchUrl = 'https://api.cohere.ai/v1/chat';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (proxyUrl) {
      const targetUrl = encodeURIComponent(fetchUrl);
      const separator = proxyUrl.includes('?') ? '&' : '?';
      fetchUrl = `${proxyUrl}${separator}target=${targetUrl}`;
    }

    let response;
    try {
        response = await fetch(fetchUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal
        });
    } catch (err: any) {
        throw handleProviderError(err, this.name);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw handleProviderError(new Error(`Cohere API Error: ${response.status} ${errText}`), this.name, response.status);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        // Fallback to non-streaming
        const data = await response.json();
        if (data.text) {
           onUpdate(data.text);
        }
        if (onUsage && data.meta?.billed_units) {
           onUsage({
             prompt: data.meta.billed_units.input_tokens || 0,
             completion: data.meta.billed_units.output_tokens || 0
           });
        }
        return;
    }

    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          
          if (parsed.event_type === 'stream-end' && parsed.response?.meta?.billed_units) {
             promptTokens = parsed.response.meta.billed_units.input_tokens || 0;
             completionTokens = parsed.response.meta.billed_units.output_tokens || 0;
          }
          
          const chunkText = this.parseResponseStream(parsed);
          if (chunkText) onUpdate(chunkText);
        } catch (e) {
          // Ignore
        }
      }
    }
    
    if (onUsage && (promptTokens > 0 || completionTokens > 0)) {
        onUsage({ prompt: promptTokens, completion: completionTokens });
    }
  }

  parseResponseStream(chunk: any): string {
    if (chunk.event_type === 'text-generation') {
      return chunk.text || '';
    }
    return '';
  }
}

export const cohereAdapter = new CohereAdapter();
