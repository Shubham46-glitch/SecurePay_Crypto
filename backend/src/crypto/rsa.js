const crypto = require('crypto');
const { canonicalize } = require('./sha256');

/**
 * ============================================================================
 * CRYPTOGRAPHIC DIGITAL SIGNATURE MODULE: RSA-2048 / RSA-SHA256
 * ============================================================================
 * 
 * Cryptographic Purpose:
 * Asymmetric digital signatures provide two essential guarantees:
 * 1. Sender Authentication: Confirms the message was originated by the entity
 *    possessing the unique RSA private key corresponding to the public key.
 * 2. Non-Repudiation: The sender cannot deny having generated the transaction,
 *    as the private key is held exclusively by them.
 * 3. Integrity: Any unauthorized modification of the payload invalidates the
 *    mathematical signature verification.
 * ============================================================================
 */

/**
 * Generates an RSA 2048-bit keypair in standard PEM format.
 * Uses native Node.js crypto.generateKeyPairSync.
 * 
 * @returns {{ publicKey: string, privateKey: string, fingerprint: string }}
 */
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  const fingerprint = computeKeyFingerprint(publicKey);

  return { publicKey, privateKey, fingerprint };
}

/**
 * Computes a standardized SHA-256 fingerprint of an RSA public key.
 * 
 * @param {string} publicKeyPem - RSA Public Key in PEM format
 * @returns {string} Formatted fingerprint (e.g. "SHA256:7a8b9c...")
 */
function computeKeyFingerprint(publicKeyPem) {
  if (!publicKeyPem) return 'UNKNOWN_KEY';
  try {
    const cleanedKey = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const hash = crypto.createHash('sha256').update(cleanedKey, 'utf8').digest('hex');
    return `SHA256:${hash.substring(0, 16)}...${hash.substring(hash.length - 8)}`;
  } catch (err) {
    return 'INVALID_KEY';
  }
}

/**
 * Signs a canonical payload using RSA-SHA256 with the sender's private key.
 * 
 * @param {string|object} payload - Raw string or transaction payload object
 * @param {string} privateKeyPem - RSA Private Key in PEM format (kept server-side only)
 * @returns {string} Base64 encoded digital signature
 */
function signRSA(payload, privateKeyPem) {
  if (!privateKeyPem) {
    throw new Error('Private key is required for RSA digital signature generation');
  }
  const content = typeof payload === 'string' ? payload : canonicalize(payload);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(content, 'utf8');
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

/**
 * Verifies an RSA digital signature using the sender's public key.
 * 
 * @param {string|object} payload - Raw string or transaction payload object
 * @param {string} signatureBase64 - Base64 encoded digital signature
 * @param {string} publicKeyPem - Sender's RSA Public Key in PEM format
 * @returns {boolean} True if signature is valid; false if invalid or modified
 */
function verifyRSA(payload, signatureBase64, publicKeyPem) {
  if (!signatureBase64 || !publicKeyPem) return false;
  try {
    const content = typeof payload === 'string' ? payload : canonicalize(payload);
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(content, 'utf8');
    verifier.end();
    return verifier.verify(publicKeyPem, signatureBase64, 'base64');
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateRSAKeyPair,
  computeKeyFingerprint,
  signRSA,
  verifyRSA,
};
