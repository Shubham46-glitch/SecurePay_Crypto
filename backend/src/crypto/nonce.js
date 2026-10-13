const crypto = require('crypto');

/**
 * ============================================================================
 * NONCE & ANTI-REPLAY DEFENSE MODULE
 * ============================================================================
 * Cryptographic Purpose:
 * Generates cryptographically secure pseudorandom numbers (CSPRNG) to ensure
 * each transaction packet is uniquely identifiable and cannot be replayed
 * by an eavesdropping adversary.
 * ============================================================================
 */

// In-memory cache for consumed nonces with timestamps
const consumedNonces = new Map();

/**
 * Generates a cryptographically strong random hex nonce using CSPRNG.
 * Uses Node.js crypto.randomBytes() - NEVER Math.random()
 * @param {number} bytes - Number of random bytes (default: 16 -> 32 hex chars)
 * @returns {string} Hexadecimal nonce
 */
function generateNonce(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Validates timestamp freshness against server time.
 * @param {number|string|Date} timestamp - Server-assigned timestamp
 * @param {number} maxAgeSeconds - Freshness window in seconds (default 300s = 5 mins)
 * @returns {{ fresh: boolean, ageSeconds: number, reason?: string }}
 */
function checkTimestampFreshness(timestamp, maxAgeSeconds = 300) {
  if (!timestamp) {
    return { fresh: false, ageSeconds: 0, reason: 'Timestamp is missing from transaction payload.' };
  }

  const txTime = typeof timestamp === 'number'
    ? timestamp
    : new Date(timestamp).getTime();

  if (isNaN(txTime)) {
    return { fresh: false, ageSeconds: 0, reason: 'Invalid timestamp format.' };
  }

  const now = Date.now();
  const ageSeconds = Math.max(0, (now - txTime) / 1000);

  // Check if timestamp is in future beyond clock skew tolerance (e.g., 30 seconds)
  if (txTime - now > 30000) {
    return {
      fresh: false,
      ageSeconds,
      reason: `Future timestamp detected (clock skew > 30s). Potential manipulation.`,
    };
  }

  if (ageSeconds > maxAgeSeconds) {
    return {
      fresh: false,
      ageSeconds,
      reason: `Transaction timestamp expired. Age is ${ageSeconds.toFixed(1)}s (exceeds allowed window of ${maxAgeSeconds}s / 5 minutes).`,
    };
  }

  return { fresh: true, ageSeconds };
}

/**
 * Checks if a nonce has already been consumed in the runtime store.
 * @param {string} nonce
 * @returns {boolean}
 */
function isNonceConsumed(nonce) {
  if (!nonce) return false;
  return consumedNonces.has(nonce);
}

/**
 * Marks a nonce as consumed.
 * @param {string} nonce
 * @param {number} timestamp
 */
function consumeNonce(nonce, timestamp = Date.now()) {
  if (!nonce) return;
  consumedNonces.set(nonce, timestamp);

  // Periodic cleanup of nonces older than 10 minutes
  const cutoff = Date.now() - 600 * 1000;
  for (const [k, t] of consumedNonces.entries()) {
    if (t < cutoff) {
      consumedNonces.delete(k);
    }
  }
}

/**
 * Validates both nonce freshness and uniqueness.
 * @param {string} nonce - Unique transaction nonce
 * @param {number|string} timestamp - Unix timestamp in ms
 * @param {number} maxAgeSeconds - Max allowed age in seconds (default 300s / 5min)
 * @returns {{ valid: boolean, reason?: string, ageSeconds?: number }}
 */
function validateNonceAndTimestamp(nonce, timestamp, maxAgeSeconds = 300) {
  if (!nonce) {
    return { valid: false, reason: 'Nonce is missing' };
  }

  const freshness = checkTimestampFreshness(timestamp, maxAgeSeconds);
  if (!freshness.fresh) {
    return {
      valid: false,
      reason: freshness.reason,
      ageSeconds: freshness.ageSeconds,
    };
  }

  if (isNonceConsumed(nonce)) {
    return {
      valid: false,
      reason: `Replay attack detected: Nonce '${nonce}' has already been processed!`,
      ageSeconds: freshness.ageSeconds,
    };
  }

  return { valid: true, ageSeconds: freshness.ageSeconds };
}

function clearNonceStore() {
  consumedNonces.clear();
}

module.exports = {
  generateNonce,
  checkTimestampFreshness,
  isNonceConsumed,
  consumeNonce,
  validateNonceAndTimestamp,
  clearNonceStore,
};
