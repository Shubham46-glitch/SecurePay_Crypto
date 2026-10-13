const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM

/**
 * Encrypts a plaintext string or object using AES-256-GCM.
 * @param {string|object} plaintext
 * @param {string} secretKey - 32-byte key or hex string
 * @returns {{ ciphertext: string, iv: string, authTag: string }}
 */
function encryptAES(plaintext, secretKey) {
  const content = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const keyBuffer = crypto.createHash('sha256').update(String(secretKey)).digest(); // 32-byte buffer
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let ciphertext = cipher.update(content, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext using the secret key, IV, and auth tag.
 * @param {string} ciphertext
 * @param {string} secretKey
 * @param {string} ivHex
 * @param {string} authTagHex
 * @returns {string} Decrypted plaintext
 */
function decryptAES(ciphertext, secretKey, ivHex, authTagHex) {
  const keyBuffer = crypto.createHash('sha256').update(String(secretKey)).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

module.exports = {
  encryptAES,
  decryptAES,
};
