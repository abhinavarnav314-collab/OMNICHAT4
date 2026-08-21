import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class LingYiAdapter extends OpenAICompatibleAdapter {
  id = 'yi';
  name = '01.AI Yi';
  models: ProviderModel[] = [
    { id: 'yi-large', name: 'yi-large' },
    { id: 'yi-medium', name: 'yi-medium' },
    { id: 'yi-spark', name: 'yi-spark' }
  ];

  constructor() {
    super('https://api.lingyiwanwu.com/v1/chat/completions');
  }
}

export const yiAdapter = new LingYiAdapter();
