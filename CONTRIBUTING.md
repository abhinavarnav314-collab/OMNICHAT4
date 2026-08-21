# Contributing to OmniChat

We welcome contributions! Please follow these guidelines:

## Core Principles
1. **Zero Backend Rule**: Do not add server-side dependencies, API routes, or backend databases. Everything must remain 100% client-side (PWA).
2. **Security**: Never expose API keys. Any new provider integration must use the established encrypted storage mechanism via `useAppStore` and `services/crypto.ts`.
3. **TypeScript**: All code must be strictly typed. Avoid `any` where possible.

## Development Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The app will be available on `http://localhost:3000`.

## Branching Strategy & Commits
- Use feature branches: `feature/your-feature-name` or `bugfix/issue-description`.
- Write clear, concise commit messages.

## Running Tests & Linting
Before submitting a pull request, ensure the following commands pass with zero errors and zero warnings:
```bash
npm run lint
npm run test
npm run build
```

## Adding a New Provider Adapter
To add a new AI provider, implement the `ProviderAdapter` interface in `src/services/providers/`:

```typescript
import { ProviderAdapter, handleProviderError } from './base';
import { Message, ProviderModel } from '../../types';

export class MyNewAdapter implements ProviderAdapter {
  id = 'mynewprovider';
  name = 'My New Provider';
  models: ProviderModel[] = [{ id: 'model-1', name: 'Model 1' }];

  async sendMessage(
    messages: Message[], model: string, apiKey: string, onUpdate: (chunk: string) => void, signal?: AbortSignal, proxyUrl?: string
  ): Promise<void> {
    // Implement fetch logic with streaming support
    // Use handleProviderError for robust error handling
  }
  
  parseResponseStream(chunk: any): string {
    return chunk.delta?.text || '';
  }
}
```
Then, export an instance and add it to `getProviders()` in `src/services/providers/index.ts`.

## Submitting Pull Requests
1. Ensure all tests pass.
2. Update documentation if your change introduces new features.
3. Fill out the pull request template completely.
