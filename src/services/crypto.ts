import { EncryptedKey } from '../types';

const ITERATIONS = 210000;
const HASH = 'SHA-256';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getDerivedKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptKey(plaintext: string, passphrase: string): Promise<EncryptedKey> {
  if (plaintext && plaintext.startsWith('sk-') && !passphrase) {
    throw new Error('Runtime Security Exception: Attempted to encrypt key without a passphrase');
  }
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await getDerivedKey(passphrase, salt);
  const enc = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer)
  };
}

export async function decryptKey(encryptedObj: EncryptedKey, passphrase: string): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedObj.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedObj.iv));
  const ciphertext = base64ToArrayBuffer(encryptedObj.ciphertext);

  const key = await getDerivedKey(passphrase, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

