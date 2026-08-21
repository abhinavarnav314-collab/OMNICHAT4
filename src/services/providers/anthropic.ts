import { ProviderAdapter, handleProviderError } from './base';
import { Message, ProviderModel } from '../../types';

export class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic';
  models: ProviderModel[] = [
    { id: 'claude-3-opus-20240229', name: 'claude-3-opus-20240229' },
    { id: 'claude-3-sonnet-20240229', name: 'claude-3-sonnet-20240229' },
    { id: 'claude-3-haiku-20240307', name: 'claude-3-haiku-20240307' }
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
    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));
    
    const payload: any = {
      model,
      max_tokens: parameters?.max_tokens || 4096,
      messages: formattedMessages,
      stream: true,
    };
    if (parameters?.temperature !== undefined) payload.temperature = parameters.temperature;
    
    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    let fetchUrl = 'https://api.anthropic.com/v1/messages';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };

    if (proxyUrl) {
      const targetUrl = encodeURIComponent(fetchUrl);
      const separator = proxyUrl.includes('?') ? '&' : '?';
      fetchUrl = `${proxyUrl}${separator}target=${targetUrl}`;
      headers['x-api-key'] = apiKey; 
    } else {
      headers['x-api-key'] = apiKey;
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
      throw handleProviderError(new Error(`Anthropic API Error: ${response.status} ${errText}`), this.name, response.status);
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
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = trimmed.slice(6);
            const parsed = JSON.parse(data);
            
            if (parsed.message?.usage) {
                promptTokens += parsed.message.usage.input_tokens || 0;
                completionTokens += parsed.message.usage.output_tokens || 0;
            } else if (parsed.usage) {
                promptTokens += parsed.usage.input_tokens || 0;
                completionTokens += parsed.usage.output_tokens || 0;
            }
            
            const chunkText = this.parseResponseStream(parsed);
            if (chunkText) onUpdate(chunkText);
          } catch (e) {
            console.warn("Parse error for chunk", trimmed);
          }
        }
      }
    }
    
    if (onUsage && (promptTokens > 0 || completionTokens > 0)) {
        onUsage({ prompt: promptTokens, completion: completionTokens });
    }
  }

  parseResponseStream(parsedChunk: any): string {
    if (parsedChunk.type === 'content_block_delta' && parsedChunk.delta?.type === 'text_delta') {
      return parsedChunk.delta.text;
    }
    return '';
  }
}

export const anthropicAdapter = new AnthropicAdapter();
