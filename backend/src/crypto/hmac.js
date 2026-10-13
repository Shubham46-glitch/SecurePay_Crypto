const crypto = require('crypto');
const { canonicalize } = require('./sha256');

/**
 * Computes HMAC-SHA-256 for a given message or payload.
 * @param {string|object} payload
 * @param {string} secretKey
 * @returns {string} Hexadecimal HMAC signature
 */
function generateHMAC(payload, secretKey) {
  if (!secretKey) {
    throw new Error('HMAC secret key is required');
  }
  const content = typeof payload === 'string' ? payload : canonicalize(payload);
  return crypto.createHmac('sha256', secretKey).update(content, 'utf8').digest('hex');
}

/**
 * Verifies HMAC using timing-safe buffer comparison to prevent timing attacks.
 * @param {string|object} payload
 * @param {string} secretKey
 * @param {string} providedHMAC
 * @returns {boolean}
 */
function verifyHMAC(payload, secretKey, providedHMAC) {
  if (!secretKey || !providedHMAC) return false;
  try {
    const computedHMAC = generateHMAC(payload, secretKey);
    const computedBuffer = Buffer.from(computedHMAC, 'hex');
    const providedBuffer = Buffer.from(providedHMAC, 'hex');

    if (computedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, providedBuffer);
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateHMAC,
  verifyHMAC,
};
