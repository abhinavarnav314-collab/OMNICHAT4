import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class MoonshotKimiAdapter extends OpenAICompatibleAdapter {
  id = 'moonshot';
  name = 'Moonshot Kimi';
  models: ProviderModel[] = [
    { id: 'moonshot-v1-8k', name: 'moonshot-v1-8k' },
    { id: 'moonshot-v1-32k', name: 'moonshot-v1-32k' },
    { id: 'moonshot-v1-128k', name: 'moonshot-v1-128k' }
  ];

  constructor() {
    super('https://api.moonshot.cn/v1/chat/completions');
  }
}

export const moonshotAdapter = new MoonshotKimiAdapter();
