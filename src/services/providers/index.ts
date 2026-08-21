import { ProviderAdapter } from './base';
import { openaiAdapter } from './openai';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './gemini';
import { mistralAdapter } from './mistral';
import { cohereAdapter } from './cohere';
import { groqAdapter } from './groq';
import { togetherAdapter } from './together';
import { perplexityAdapter } from './perplexity';
import { fireworksAdapter } from './fireworks';
import { glmAdapter } from './glm';
import { qwenAdapter } from './qwen';
import { baichuanAdapter } from './baichuan';
import { deepseekAdapter } from './deepseek';
import { moonshotAdapter } from './moonshot';
import { yiAdapter } from './yi';
import { customAdapter } from './openaiCompatible';

const allProviders = [
  anthropicAdapter,
  baichuanAdapter,
  cohereAdapter,
  deepseekAdapter,
  fireworksAdapter,
  geminiAdapter,
  glmAdapter,
  groqAdapter,
  mistralAdapter,
  moonshotAdapter,
  openaiAdapter,
  perplexityAdapter,
  qwenAdapter,
  togetherAdapter,
  yiAdapter,
  customAdapter
];

// Sort alphabetically, keep custom last
allProviders.sort((a, b) => {
  if (a.id === 'custom') return 1;
  if (b.id === 'custom') return -1;
  return a.name.localeCompare(b.name);
});

export const providersRegistry: Record<string, ProviderAdapter> = allProviders.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {} as Record<string, ProviderAdapter>);

export const getProviders = () => allProviders;
export const getProvider = (id: string) => providersRegistry[id];
