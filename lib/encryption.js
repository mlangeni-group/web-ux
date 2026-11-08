/**
 * Encryption helpers using the Web Crypto API (browser).
 * Includes compatibility layer for Bangwe PHP class (AES‑256‑GCM, raw key).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ---------- Password‑based encryption (unchanged) ----------
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAES(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptAES(ciphertextBase64, password) {
  const combined = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}

// ---------- Other utilities (sha256, base64, jwt) ----------
export async function sha256(message) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const base64 = {
  encode: (str) => btoa(unescape(encodeURIComponent(str))),
  decode: (b64) => decodeURIComponent(escape(atob(b64)))
};

export const jwt = {
  decode: (token) => {
    const jwtLib = require('jsonwebtoken');
    return jwtLib.decode(token);
  },
  verify: (token, secretOrPublicKey, options) => {
    const jwtLib = require('jsonwebtoken');
    return jwtLib.verify(token, secretOrPublicKey, options);
  }
};

// ========== BANGWE PHP COMPATIBILITY LAYER ==========
/**
 * These functions mirror the behaviour of the Bangwe PHP class.
 * They use a raw AES‑256‑GCM key (no password derivation) and
 * return/accept separate Base64 components: data, iv, tag.
 */

const AES_GCM_IV_LENGTH = 12;       // bytes
const AES_GCM_TAG_LENGTH = 16;      // bytes (128 bits)

/**
 * Import a raw key from a Base64 string (or binary string).
 * @param {string} base64Key - Raw 32‑byte key encoded in Base64.
 * @returns {Promise<CryptoKey>}
 */
export async function importRawKey(base64Key) {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  if (keyData.length !== 32) {
    console.warn(`Key length is ${keyData.length} bytes. AES‑256 requires exactly 32 bytes.`);
  }
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using a raw AES‑GCM key (compatible with Bangwe::encrypt).
 * @param {string} plaintext - Data to encrypt.
 * @param {CryptoKey|string} key - Either a CryptoKey (from importRawKey) or a Base64 key string.
 * @returns {Promise<{data: string, iv: string, tag: string, cipher: string}>}
 */
export async function encryptWithKey(plaintext, key) {
  let cryptoKey = key;
  if (typeof key === 'string') {
    cryptoKey = await importRawKey(key);
  }

  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AES_GCM_TAG_LENGTH * 8   // bits
    },
    cryptoKey,
    encoder.encode(plaintext)
  );

  // In Web Crypto, the tag is appended to the ciphertext.
  // We need to split it manually to match PHP's separate tag.
  const ciphertext = new Uint8Array(encrypted.slice(0, -AES_GCM_TAG_LENGTH));
  const tag = new Uint8Array(encrypted.slice(-AES_GCM_TAG_LENGTH));

  return {
    data: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag)),
    cipher: 'aes-256-gcm'
  };
}

/**
 * Decrypt ciphertext components using a raw AES‑GCM key.
 * @param {string} dataBase64 - Base64 encoded ciphertext.
 * @param {string} ivBase64 - Base64 encoded IV.
 * @param {string} tagBase64 - Base64 encoded authentication tag.
 * @param {CryptoKey|string} key - CryptoKey or Base64 key string.
 * @returns {Promise<string>} Decrypted plaintext.
 */
export async function decryptWithKey(dataBase64, ivBase64, tagBase64, key) {
  let cryptoKey = key;
  if (typeof key === 'string') {
    cryptoKey = await importRawKey(key);
  }

  const ciphertext = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(tagBase64), c => c.charCodeAt(0));

  // Concatenate ciphertext + tag (Web Crypto expects them together)
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AES_GCM_TAG_LENGTH * 8
    },
    cryptoKey,
    combined
  );

  return decoder.decode(decrypted);
}

/**
 * Convenience: encrypt and return JSON string (identical to Bangwe::encryptToJson).
 * @param {string} plaintext
 * @param {CryptoKey|string} key
 * @returns {Promise<string>}
 */
export async function encryptToJson(plaintext, key) {
  const result = await encryptWithKey(plaintext, key);
  return JSON.stringify(result);
}

/**
 * Convenience: decrypt from JSON string (identical to Bangwe::decryptFromJson).
 * @param {string} jsonString
 * @param {CryptoKey|string} key
 * @returns {Promise<string>}
 */
export async function decryptFromJson(jsonString, key) {
  const { data, iv, tag } = JSON.parse(jsonString);
  if (!data || !iv || !tag) {
    throw new Error('Invalid encrypted data format: missing data, iv, or tag');
  }
  return decryptWithKey(data, iv, tag, key);
}