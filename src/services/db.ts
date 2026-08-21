import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Conversation, Prompt, EncryptedKey, PromptFolder, PromptVersion, PromptChain } from '../types';

interface OmniChatDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'updatedAt': number };
  };
  prompts: {
    key: string;
    value: Prompt;
    indexes: { 'updatedAt': number, 'folderId': string };
  };
  promptFolders: {
    key: string;
    value: PromptFolder;
  };
  promptVersions: {
    key: string;
    value: PromptVersion;
    indexes: { 'promptId': string, 'timestamp': number };
  };
  promptChains: {
    key: string;
    value: PromptChain;
  };
  secrets: {
    key: string;
    value: EncryptedKey;
  };
}

let dbPromise: Promise<IDBPDatabase<OmniChatDB>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OmniChatDB>('omniChat-db', 3, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const cStore = db.createObjectStore('conversations', { keyPath: 'id' });
          cStore.createIndex('updatedAt', 'updatedAt');
          const pStore = db.createObjectStore('prompts', { keyPath: 'id' });
          pStore.createIndex('updatedAt', 'updatedAt');
          db.createObjectStore('secrets');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('promptFolders')) {
            db.createObjectStore('promptFolders', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('promptVersions')) {
            const vStore = db.createObjectStore('promptVersions', { keyPath: 'id' });
            vStore.createIndex('promptId', 'promptId');
            vStore.createIndex('timestamp', 'timestamp');
          }
          if (db.objectStoreNames.contains('prompts')) {
             const pStore = transaction.objectStore('prompts');
             if (!pStore.indexNames.contains('folderId')) {
                pStore.createIndex('folderId', 'folderId');
             }
          }
        }
        if (oldVersion < 3) {
            if (!db.objectStoreNames.contains('promptChains')) {
                db.createObjectStore('promptChains', { keyPath: 'id' });
            }
        }
      },
    });
  }
  return dbPromise;
}

// Conversation Ops
export async function getConversations(): Promise<Conversation[]> {
  const db = await getDB();
  return db.getAllFromIndex('conversations', 'updatedAt');
}
export async function saveConversation(convo: Conversation) {
  const db = await getDB();
  await db.put('conversations', convo);
}
export async function deleteConversation(id: string) {
  const db = await getDB();
  await db.delete('conversations', id);
}

// Prompts Ops
export async function getPrompts(): Promise<Prompt[]> {
  const db = await getDB();
  return db.getAllFromIndex('prompts', 'updatedAt');
}
export async function savePrompt(prompt: Prompt) {
  const db = await getDB();
  await db.put('prompts', prompt);
}
export async function deletePrompt(id: string) {
  const db = await getDB();
  await db.delete('prompts', id);
}

// Folders Ops
export async function getPromptFolders(): Promise<PromptFolder[]> {
  const db = await getDB();
  return db.getAll('promptFolders');
}
export async function savePromptFolder(folder: PromptFolder) {
  const db = await getDB();
  await db.put('promptFolders', folder);
}
export async function deletePromptFolder(id: string) {
  const db = await getDB();
  await db.delete('promptFolders', id);
}

// Versions Ops
export async function getAllPromptVersions(): Promise<PromptVersion[]> {
  const db = await getDB();
  return db.getAll('promptVersions');
}

export async function getPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('promptVersions', 'promptId', promptId);
  return versions.sort((a, b) => b.timestamp - a.timestamp);
}
export async function savePromptVersion(version: PromptVersion) {
  const db = await getDB();
  await db.put('promptVersions', version);
  // Keep only last 5
  const versions = await getPromptVersions(version.promptId);
  if (versions.length > 5) {
    const toDelete = versions.slice(5);
    for (const v of toDelete) {
      await db.delete('promptVersions', v.id);
    }
  }
}

// Chains Ops
export async function getPromptChains(): Promise<PromptChain[]> {
  const db = await getDB();
  return db.getAll('promptChains');
}
export async function savePromptChain(chain: PromptChain) {
  const db = await getDB();
  await db.put('promptChains', chain);
}
export async function deletePromptChain(id: string) {
  const db = await getDB();
  await db.delete('promptChains', id);
}

// Secrets Ops
export async function saveSecret(key: string, secret: EncryptedKey) {
  const db = await getDB();
  await db.put('secrets', secret, key);
}
export async function getSecret(key: string): Promise<EncryptedKey | undefined> {
  const db = await getDB();
  return db.get('secrets', key);
}
export async function deleteSecret(key: string) {
  const db = await getDB();
  await db.delete('secrets', key);
}
export async function clearAllData() {
  const db = await getDB();
  const stores = db.objectStoreNames;
  const tx = db.transaction(stores, 'readwrite');
  const promises = [];
  for (let i = 0; i < stores.length; i++) {
    promises.push(tx.objectStore(stores[i]).clear());
  }
  await Promise.all(promises);
  await tx.done;
}
