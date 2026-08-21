import { Message, ProviderModel } from '../../types';

export interface ProviderAdapter {
  id: string;
  name: string;
  models: ProviderModel[];
  sendMessage: (
    messages: Message[],
    model: string,
    apiKey: string,
    onUpdate: (chunk: string) => void,
    signal?: AbortSignal,
    proxyUrl?: string,
    systemPrompt?: string,
    parameters?: any,
    onUsage?: (usage: { prompt: number; completion: number }) => void,
    overrideBaseUrl?: string
  ) => Promise<void>;
  parseResponseStream: (chunk: string) => string;
}

export function handleProviderError(error: any, providerName: string, status?: number): Error {
  const errMsg = error?.message?.toLowerCase() || '';
  
  if (status) {
    if (status === 401 || status === 403) return new Error("Invalid API key.");
    if (status === 429) return new Error("Rate limit exceeded. Please try again later.");
    if (status >= 500) return new Error("Provider server error. Please try again later.");
  }

  if (errMsg.includes('failed to fetch') || errMsg.includes('network error') || errMsg.includes('cors')) {
    return new Error(`${providerName} blocks direct browser requests or network failed. Please set a CORS proxy URL in Settings > API Keys and try again.`);
  }
  return error instanceof Error ? error : new Error(String(error));
}

export abstract class OpenAICompatibleAdapter implements ProviderAdapter {
  abstract id: string;
  abstract name: string;
  abstract models: ProviderModel[];
  protected baseUrl: string;
  protected apiKeyHeaderName: string;

  constructor(baseUrl: string, apiKeyHeaderName: string = 'Authorization') {
    this.baseUrl = baseUrl;
    this.apiKeyHeaderName = apiKeyHeaderName;
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
    onUsage?: (usage: { prompt: number; completion: number }) => void,
    overrideBaseUrl?: string
  ): Promise<void> {
    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));
    if (systemPrompt) {
      formattedMessages.unshift({ role: 'system', content: systemPrompt });
    }

    const payload: any = {
      model,
      messages: formattedMessages,
      stream: true,
      stream_options: { include_usage: true },
      ...parameters
    };

    let fetchUrl = overrideBaseUrl || this.baseUrl;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (proxyUrl) {
      const targetUrl = encodeURIComponent(overrideBaseUrl || this.baseUrl);
      const separator = proxyUrl.includes('?') ? '&' : '?';
      fetchUrl = `${proxyUrl}${separator}target=${targetUrl}`;
      if (this.id === 'openai' || this.apiKeyHeaderName === 'Authorization') {
        headers['x-openai-key'] = apiKey; 
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers[this.apiKeyHeaderName] = apiKey;
      }
    } else {
      if (this.apiKeyHeaderName === 'Authorization') {
        headers[this.apiKeyHeaderName] = `Bearer ${apiKey}`;
      } else {
        headers[this.apiKeyHeaderName] = apiKey;
      }
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
      throw handleProviderError(new Error(`API Error: ${response.status} ${errText}`), this.name, response.status);
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
            const data = trimmed.slice(6).trim();
            if (data === '[DONE]') continue;
            const parsed = JSON.parse(data);
            
            if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens || 0;
                completionTokens = parsed.usage.completion_tokens || 0;
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
    return parsedChunk?.choices?.[0]?.delta?.content || '';
  }
}
