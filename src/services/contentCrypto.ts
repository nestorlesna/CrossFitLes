// Cifrado del contenido personal (content.mio.json) con una semilla de texto.
// AES-GCM 256 con clave derivada por PBKDF2-SHA256; usa la Web Crypto API del navegador/WebView,
// sin dependencias. El archivo queda en el repo público pero ilegible sin la semilla.

export interface EncryptedContent {
  app: string;
  encrypted: {
    alg: 'AES-GCM';
    kdf: 'PBKDF2-SHA256';
    iterations: number;
    salt: string; // base64
    iv: string; // base64
    data: string; // base64
  };
}

const ITERATIONS = 200_000;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(seed: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(seed.trim()), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(app: string, text: string, seed: string): Promise<EncryptedContent> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(seed, salt, ITERATIONS);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
  return {
    app,
    encrypted: {
      alg: 'AES-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      data: toBase64(data),
    },
  };
}

/** Descifra; lanza un error legible si la semilla no es la correcta. */
export async function decryptText(file: EncryptedContent, seed: string): Promise<string> {
  const { salt, iv, data, iterations } = file.encrypted;
  const key = await deriveKey(seed, fromBase64(salt), iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('La semilla no es correcta: no se pudo descifrar tu contenido');
  }
}
