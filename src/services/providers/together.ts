import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class TogetherAIAdapter extends OpenAICompatibleAdapter {
  id = 'together';
  name = 'Together AI';
  models: ProviderModel[] = [
    { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'meta-llama/Llama-3-70b-chat-hf' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'mistralai/Mixtral-8x7B-Instruct-v0.1' }
  ];

  constructor() {
    super('https://api.together.xyz/v1/chat/completions');
  }
}

export const togetherAdapter = new TogetherAIAdapter();
