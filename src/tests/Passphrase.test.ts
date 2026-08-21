import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Passphrase and Lock', () => {
  beforeEach(() => {
    useAppStore.setState({ passphraseUnlocked: false, passphrase: null });
  });

  it('unlocks and sets passphrase', () => {
    const store = useAppStore.getState();
    store.unlock('mypassword');
    expect(useAppStore.getState().passphraseUnlocked).toBe(true);
    expect(useAppStore.getState().passphrase).toBe('mypassword');
  });

  it('locks and clears passphrase', () => {
    const store = useAppStore.getState();
    store.unlock('mypassword');
    useAppStore.getState().lock();
    expect(useAppStore.getState().passphraseUnlocked).toBe(false);
    expect(useAppStore.getState().passphrase).toBe(null);
  });
});
