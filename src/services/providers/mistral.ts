import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class MistralAdapter extends OpenAICompatibleAdapter {
  id = 'mistral';
  name = 'Mistral';
  models: ProviderModel[] = [
    { id: 'mistral-large-latest', name: 'mistral-large-latest' },
    { id: 'mistral-medium-latest', name: 'mistral-medium-latest' },
    { id: 'mistral-small-latest', name: 'mistral-small-latest' }
  ];

  constructor() {
    super('https://api.mistral.ai/v1/chat/completions');
  }
}

export const mistralAdapter = new MistralAdapter();
