import { ProviderAdapter, handleProviderError } from './base';
import { Message, ProviderModel } from '../../types';

export class GeminiAdapter implements ProviderAdapter {
  id = 'gemini';
  name = 'Google Gemini';
  models: ProviderModel[] = [
    { id: 'gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview (Thinking)' },
    { id: 'gemini-3.5-flash', name: 'gemini-3.5-flash' },
    { id: 'gemini-3.1-flash-lite', name: 'gemini-3.1-flash-lite' },
    { id: 'gemini-1.5-pro-latest', name: 'gemini-1.5-pro-latest' },
    { id: 'gemini-1.5-flash-latest', name: 'gemini-1.5-flash-latest' }
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
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload: any = { contents };
    
    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }
    
    payload.generationConfig = {};
    if (parameters) {
      if (parameters.temperature !== undefined && model !== 'gemini-3.1-pro-preview') {
          payload.generationConfig.temperature = parameters.temperature;
      }
      if (parameters.top_p !== undefined) payload.generationConfig.topP = parameters.top_p;
      // Do not set maxOutputTokens for 3.1-pro-preview as per requirement
      if (parameters.max_tokens !== undefined && model !== 'gemini-3.1-pro-preview') {
          payload.generationConfig.maxOutputTokens = parameters.max_tokens;
      }
    }
    
    if (model === 'gemini-3.1-pro-preview') {
        payload.generationConfig.thinkingConfig = { thinkingLevel: 'HIGH' };
    }

    let fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
    if (proxyUrl) {
      const targetUrl = encodeURIComponent(fetchUrl);
      const separator = proxyUrl.includes('?') ? '&' : '?';
      fetchUrl = `${proxyUrl}${separator}target=${targetUrl}`;
    }

    let response;
    try {
        response = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload),
          signal
        });
    } catch (err: any) {
        throw handleProviderError(err, this.name);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw handleProviderError(new Error(`Gemini API Error: ${response.status} ${errText}`), this.name, response.status);
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
        if (trimmed.startsWith('data: ')) {
          try {
            const data = trimmed.slice(6).trim();
            if (data === '[DONE]') continue;
            const parsed = JSON.parse(data);
            
            if (parsed.usageMetadata) {
                promptTokens = parsed.usageMetadata.promptTokenCount || 0;
                completionTokens = parsed.usageMetadata.candidatesTokenCount || 0;
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

  parseResponseStream(chunk: any): string {
    return chunk?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

export const geminiAdapter = new GeminiAdapter();
