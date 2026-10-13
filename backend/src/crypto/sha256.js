const crypto = require('crypto');

/**
 * ============================================================================
 * CRYPTOGRAPHIC INTEGRITY MODULE: SHA-256 (FIPS PUB 180-4)
 * ============================================================================
 * 
 * Cryptographic Purpose:
 * SHA-256 (Secure Hash Algorithm 256-bit) generates a fixed-size 256-bit
 * (64 hexadecimal characters) one-way hash digest.
 * 
 * Key Properties Utilized in Payment Security:
 * 1. Pre-image Resistance: Given a hash H, it is computationally infeasible
 *    to find the original transaction payload M such that SHA-256(M) = H.
 * 2. Second Pre-image Resistance: Given transaction M1, it is infeasible to
 *    find a distinct transaction M2 such that SHA-256(M1) = SHA-256(M2).
 * 3. Collision Resistance: Infeasible to find any two distinct payloads with
 *    matching hashes.
 * 4. Avalanche Effect: If even a single bit or character in the payload is
 *    altered (e.g., amount ₹500 -> ₹5000), approximately 50% of the hash
 *    bits change unpredictably, instantly exposing tamper attempts.
 * ============================================================================
 */

/**
 * Standardize and canonicalize an object to guarantee deterministic serialization.
 * In distributed cryptographic systems, key ordering or whitespace differences
 * would produce different hashes for mathematically identical data.
 *
 * @param {*} data - Raw data payload to serialize
 * @returns {string} Deterministically sorted JSON string
 */
function canonicalize(data) {
  if (data === null || typeof data !== 'object') {
    return JSON.stringify(data);
  }
  if (Array.isArray(data)) {
    return `[${data.map(canonicalize).join(',')}]`;
  }
  const sortedKeys = Object.keys(data).sort();
  const serializedEntries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalize(data[key])}`
  );
  return `{${serializedEntries.join(',')}}`;
}

/**
 * Builds standard canonical payment transaction object using essential integrity fields.
 * 
 * @param {object} params
 * @param {string} params.transactionId
 * @param {string} params.sender
 * @param {string} params.receiver
 * @param {number} params.amount
 * @param {string} [params.currency='INR']
 * @param {number} params.timestamp
 * @param {string} params.nonce
 * @returns {object} Canonical object with sorted keys
 */
function buildTransactionPayload({
  transactionId,
  sender,
  receiver,
  amount,
  currency = 'INR',
  timestamp,
  nonce,
}) {
  return {
    amount: parseFloat(Number(amount).toFixed(2)),
    currency: String(currency).toUpperCase(),
    nonce: String(nonce),
    receiver: String(receiver).trim(),
    sender: String(sender).trim(),
    timestamp: Number(timestamp),
    transactionId: String(transactionId).trim(),
  };
}

/**
 * Generates a SHA-256 hash from a string or transaction object.
 * Uses Node.js native `crypto.createHash('sha256')`.
 * 
 * @param {string|object} payload - Raw string or JavaScript object
 * @returns {string} 64-character hexadecimal SHA-256 hash digest
 */
function hashSHA256(payload) {
  if (payload === undefined || payload === null) {
    throw new Error('Payload is required to calculate SHA-256 hash');
  }
  const content = typeof payload === 'string' ? payload : canonicalize(payload);
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Verifies if the payload matches the expected SHA-256 hash using safe buffer comparison.
 * 
 * @param {string|object} payload - Data payload to verify
 * @param {string} expectedHash - Expected 64-char hexadecimal hash
 * @returns {boolean} True if payload matches hash; false if tampered or invalid
 */
function verifySHA256(payload, expectedHash) {
  if (!expectedHash || typeof expectedHash !== 'string') return false;
  try {
    const actualHash = hashSHA256(payload);
    const actualBuffer = Buffer.from(actualHash.toLowerCase(), 'hex');
    const expectedBuffer = Buffer.from(expectedHash.toLowerCase(), 'hex');

    if (actualBuffer.length !== expectedBuffer.length || actualBuffer.length !== 32) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

module.exports = {
  canonicalize,
  buildTransactionPayload,
  hashSHA256,
  verifySHA256,
};
