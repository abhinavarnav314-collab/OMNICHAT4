import { OpenAICompatibleAdapter } from './base';
import { ProviderModel } from '../../types';

export class GroqAdapter extends OpenAICompatibleAdapter {
  id = 'groq';
  name = 'Groq';
  models: ProviderModel[] = [
    { id: 'llama3-70b-8192', name: 'llama3-70b-8192' },
    { id: 'llama3-8b-8192', name: 'llama3-8b-8192' },
    { id: 'mixtral-8x7b-32768', name: 'mixtral-8x7b-32768' }
  ];

  constructor() {
    super('https://api.groq.com/openai/v1/chat/completions');
  }
}

export const groqAdapter = new GroqAdapter();
