import { describe, it, expect } from 'vitest';
import { handleProviderError } from '../services/providers/base';
import { geminiAdapter } from '../services/providers/gemini';
import { anthropicAdapter } from '../services/providers/anthropic';
import { openaiAdapter } from '../services/providers/openai';

describe('Error Mapping', () => {
  it('maps 401 to invalid API key', () => {
    const err = handleProviderError(new Error('Test'), 'OpenAI', 401);
    expect(err.message).toMatch(/Invalid API key/);
  });

  it('maps 429 to rate limit', () => {
    const err = handleProviderError(new Error('Test'), 'Gemini', 429);
    expect(err.message).toMatch(/Rate limit exceeded/);
  });

  it('maps 5xx to server error', () => {
    const err = handleProviderError(new Error('Test'), 'Anthropic', 503);
    expect(err.message).toMatch(/Provider server error/);
  });

  it('maps failed to fetch to CORS/network error', () => {
    const err = handleProviderError(new Error('failed to fetch'), 'Cohere');
    expect(err.message).toMatch(/blocks direct browser requests/);
  });
});

describe('Streaming Parsers', () => {
  it('Gemini parser extracts text', () => {
    const chunk = {
      candidates: [{
        content: {
          parts: [{ text: 'Hello' }]
        }
      }]
    };
    expect(geminiAdapter.parseResponseStream(chunk)).toBe('Hello');
  });

  it('Anthropic parser extracts text delta', () => {
    const chunk = {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: ' world' }
    };
    expect(anthropicAdapter.parseResponseStream(chunk)).toBe(' world');
  });

  it('OpenAI parser extracts text delta', () => {
    const chunk = {
      choices: [{
        delta: { content: 'test' }
      }]
    };
    expect(openaiAdapter.parseResponseStream(chunk)).toBe('test');
  });
});
