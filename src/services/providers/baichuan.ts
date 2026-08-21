import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class BaichuanAdapter extends OpenAICompatibleAdapter {
  id = 'baichuan';
  name = 'Baichuan';
  models: ProviderModel[] = [
    { id: 'Baichuan2-Turbo', name: 'Baichuan2-Turbo' },
    { id: 'Baichuan3-Turbo', name: 'Baichuan3-Turbo' }
  ];

  constructor() {
    super('https://api.baichuan-ai.com/v1/chat/completions');
  }
}

export const baichuanAdapter = new BaichuanAdapter();
