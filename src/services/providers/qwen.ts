import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class AlibabaQwenAdapter extends OpenAICompatibleAdapter {
  id = 'qwen';
  name = 'Alibaba Qwen';
  models: ProviderModel[] = [
    { id: 'qwen-turbo', name: 'qwen-turbo' },
    { id: 'qwen-plus', name: 'qwen-plus' },
    { id: 'qwen-max', name: 'qwen-max' }
  ];

  constructor() {
    super('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
  }
}

export const qwenAdapter = new AlibabaQwenAdapter();
