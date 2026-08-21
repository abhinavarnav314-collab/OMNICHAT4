import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  id = 'deepseek';
  name = 'DeepSeek';
  models: ProviderModel[] = [
    { id: 'deepseek-chat', name: 'deepseek-chat' },
    { id: 'deepseek-coder', name: 'deepseek-coder' }
  ];

  constructor() {
    super('https://api.deepseek.com/v1/chat/completions');
  }
}

export const deepseekAdapter = new DeepSeekAdapter();
