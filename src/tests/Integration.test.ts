import { describe, it, expect } from 'vitest';
import { usePromptStore } from '../store/usePromptStore';
import { useChatStore } from '../store/useChatStore';
import 'fake-indexeddb/auto';

describe('Integration Tests', () => {
  it('handles prompt variables', async () => {
    const store = usePromptStore.getState();
    await store.addPrompt({
      title: 'Var Prompt',
      description: '',
      text: 'Hello {{name}}',
    });
    const prompt = usePromptStore.getState().prompts.find(p => p.title === 'Var Prompt');
    expect(prompt?.text).toContain('{{name}}');
  });

  it('handles branching', async () => {
    const chatStore = useChatStore.getState();
    await chatStore.createConversation();
    const activeConvoId = useChatStore.getState().activeId!;
    
    await chatStore.addMessage(activeConvoId, {
      id: 'msg1',
      role: 'user',
      content: 'Original Message',
      timestamp: Date.now()
    });
    
    const convo1 = useChatStore.getState().conversations.find(c => c.id === activeConvoId);
    expect(convo1?.messages.length).toBe(1);
    expect(convo1?.currentLeafId).toBe('msg1');

    // Resend (creates a branch with same parent)
    await chatStore.addMessage(activeConvoId, {
      id: 'msg2',
      role: 'user',
      content: 'Resent Message',
      timestamp: Date.now(),
      parentId: null // Same parent as msg1
    });

    const convo2 = useChatStore.getState().conversations.find(c => c.id === activeConvoId);
    expect(convo2?.messages.length).toBe(2);
    expect(convo2?.currentLeafId).toBe('msg2');

    // Switch branch
    await chatStore.setCurrentLeafId(activeConvoId, 'msg1');
    const convo3 = useChatStore.getState().conversations.find(c => c.id === activeConvoId);
    expect(convo3?.currentLeafId).toBe('msg1');
  });

  it('handles chain runner logic', async () => {
    const store = usePromptStore.getState();
    await store.addChain('My Chain', ['id1', 'id2']);
    const chain = usePromptStore.getState().chains.find(c => c.name === 'My Chain');
    expect(chain?.promptIds).toEqual(['id1', 'id2']);
  });
});
