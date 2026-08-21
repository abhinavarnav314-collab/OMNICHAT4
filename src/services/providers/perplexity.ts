import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class PerplexityAdapter extends OpenAICompatibleAdapter {
  id = 'perplexity';
  name = 'Perplexity';
  models: ProviderModel[] = [
    { id: 'llama-3-sonar-small-32k-chat', name: 'llama-3-sonar-small-32k-chat' },
    { id: 'llama-3-sonar-large-32k-chat', name: 'llama-3-sonar-large-32k-chat' }
  ];

  constructor() {
    super('https://api.perplexity.ai/chat/completions');
  }
}

export const perplexityAdapter = new PerplexityAdapter();
