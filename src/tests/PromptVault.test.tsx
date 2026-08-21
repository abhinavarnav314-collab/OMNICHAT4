import { describe, it, expect, beforeEach } from 'vitest';
import { usePromptStore } from '../store/usePromptStore';
import 'fake-indexeddb/auto';

describe('PromptVault State', () => {
  beforeEach(() => {
    usePromptStore.setState({ prompts: [], folders: [], versions: {} });
  });

  it('adds and updates prompts', async () => {
    const store = usePromptStore.getState();
    await store.addPrompt({
      title: 'Test Prompt',
      description: 'Test Desc',
      text: 'Hello {{name}}',
    });
    
    expect(usePromptStore.getState().prompts.length).toBe(1);
    expect(usePromptStore.getState().prompts[0].title).toBe('Test Prompt');

    const id = usePromptStore.getState().prompts[0].id;
    await usePromptStore.getState().updatePrompt(id, { title: 'Updated' });
    expect(usePromptStore.getState().prompts[0].title).toBe('Updated');
  });

  it('manages folders', async () => {
    const store = usePromptStore.getState();
    await store.addFolder('My Folder');
    expect(usePromptStore.getState().folders.length).toBe(1);
    
    const id = usePromptStore.getState().folders[0].id;
    await usePromptStore.getState().deleteFolder(id);
    expect(usePromptStore.getState().folders.length).toBe(0);
  });
});
