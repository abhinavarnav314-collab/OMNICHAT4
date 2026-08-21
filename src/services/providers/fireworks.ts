import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class FireworksAIAdapter extends OpenAICompatibleAdapter {
  id = 'fireworks';
  name = 'Fireworks AI';
  models: ProviderModel[] = [
    { id: 'accounts/fireworks/models/llama-v3-70b-instruct', name: 'accounts/fireworks/models/llama-v3-70b-instruct' }
  ];

  constructor() {
    super('https://api.fireworks.ai/inference/v1/chat/completions');
  }
}

export const fireworksAdapter = new FireworksAIAdapter();
