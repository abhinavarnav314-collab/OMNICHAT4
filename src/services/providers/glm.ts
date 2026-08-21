import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class ZhipuGLMAdapter extends OpenAICompatibleAdapter {
  id = 'glm';
  name = 'Zhipu GLM';
  models: ProviderModel[] = [
    { id: 'glm-4', name: 'glm-4' },
    { id: 'glm-4-plus', name: 'glm-4-plus' },
    { id: 'glm-4-flash', name: 'glm-4-flash' },
    { id: 'glm-5.2', name: 'glm-5.2' }
  ];

  constructor() {
    super('https://open.bigmodel.cn/api/paas/v4/chat/completions');
  }
}

export const glmAdapter = new ZhipuGLMAdapter();
