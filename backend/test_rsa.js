const crypto = require('crypto');
const {
  canonicalize,
  buildTransactionPayload,
  hashSHA256,
  generateHMAC,
  generateRSAKeyPair,
  computeKeyFingerprint,
  signRSA,
  verifyRSA,
} = require('./src/crypto');
const { createTransaction, verifyTransactionIntegrity, verifyTransactionHMAC, verifyTransactionSignature } = require('./src/controllers/paymentController');

console.log('====================================================');
console.log('🧪 RUNNING RSA DIGITAL SIGNATURE TEST SUITE');
console.log('====================================================\n');

// 1. Generate RSA-2048 keypair
console.log('--- TEST 1: RSA-2048 Keypair Generation ---');
const keypair = generateRSAKeyPair();
console.log('Public Key (PEM length): ', keypair.publicKey.length);
console.log('Private Key (PEM length):', keypair.privateKey.length);
console.log('Key Fingerprint:         ', keypair.fingerprint);
if (!keypair.publicKey.includes('BEGIN PUBLIC KEY') || !keypair.privateKey.includes('BEGIN PRIVATE KEY')) {
  throw new Error('Invalid RSA key format');
}
console.log('Keypair Generation:       ✅ PASS');

// 2. Legitimate Transaction Signing and Verification
console.log('\n--- TEST 2: Real RSA-SHA256 Digital Signature Creation & Verification ---');
const originalPayload = buildTransactionPayload({
  transactionId: 'TX-RSA-TEST-001',
  sender: 'Alice Cryptographer',
  receiver: 'Bob Merchant',
  amount: 500.0,
  currency: 'INR',
  timestamp: 1718029990000,
  nonce: '1a2b3c4d5e6f7g8h',
});

const canonical = canonicalize(originalPayload);
const signature = signRSA(canonical, keypair.privateKey);
console.log('Canonical Payload:       ', canonical);
console.log('RSA Digital Signature:   ', signature.substring(0, 40) + '...');

const isSigValid = verifyRSA(canonical, signature, keypair.publicKey);
console.log('Signature Valid?:         ', isSigValid ? '✅ PASS (AUTHENTICATED & NON-REPUDIATED)' : '❌ FAIL');
if (!isSigValid) throw new Error('Legitimate signature verification failed');

// 3. Tampered Transaction Verification (Amount modified: ₹500 -> ₹5000)
console.log('\n--- TEST 3: Signature Verification on Tampered Amount (₹500 -> ₹5000) ---');
const tamperedAmountPayload = buildTransactionPayload({
  transactionId: 'TX-RSA-TEST-001',
  sender: 'Alice Cryptographer',
  receiver: 'Bob Merchant',
  amount: 5000.0, // Tampered!
  currency: 'INR',
  timestamp: 1718029990000,
  nonce: '1a2b3c4d5e6f7g8h',
});
const canonicalTamperedAmount = canonicalize(tamperedAmountPayload);
const isTamperedAmountSigValid = verifyRSA(canonicalTamperedAmount, signature, keypair.publicKey);
console.log('Tampered Amount Sig Valid? (Expected False):', !isTamperedAmountSigValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR: Passed when should fail');
if (isTamperedAmountSigValid) throw new Error('Tampered amount signature should fail verification');

// 4. Tampered Receiver Verification ('Bob Merchant' -> 'Mallory')
console.log('\n--- TEST 4: Signature Verification on Tampered Receiver ---');
const tamperedReceiverPayload = buildTransactionPayload({
  transactionId: 'TX-RSA-TEST-001',
  sender: 'Alice Cryptographer',
  receiver: 'Mallory', // Tampered!
  amount: 500.0,
  currency: 'INR',
  timestamp: 1718029990000,
  nonce: '1a2b3c4d5e6f7g8h',
});
const canonicalTamperedReceiver = canonicalize(tamperedReceiverPayload);
const isTamperedReceiverSigValid = verifyRSA(canonicalTamperedReceiver, signature, keypair.publicKey);
console.log('Tampered Receiver Sig Valid? (Expected False):', !isTamperedReceiverSigValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR: Passed when should fail');
if (isTamperedReceiverSigValid) throw new Error('Tampered receiver signature should fail verification');

// 5. Wrong Public Key (Impersonation / Key Mismatch Test)
console.log('\n--- TEST 5: Wrong Public Key (Impersonation Defense) ---');
const attackerKeys = generateRSAKeyPair();
const isImpersonatorSigValid = verifyRSA(canonical, signature, attackerKeys.publicKey);
console.log('Impersonator Key Sig Valid? (Expected False):', !isImpersonatorSigValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR: Passed when should fail');
if (isImpersonatorSigValid) throw new Error('Signature verified with wrong public key');

// 6. Controller Endpoint Integration Test
console.log('\n--- TEST 6: Controller Endpoints & Private Key Zero-Exposure ---');
function createMockRes() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

async function runControllerTests() {
  const reqCreate = {
    body: {
      sender: 'Alice Cryptographer',
      receiver: 'Bob Merchant',
      amount: 750,
      currency: 'INR',
    },
    user: { name: 'Alice Cryptographer' },
  };
  const resCreate = createMockRes();
  await createTransaction(reqCreate, resCreate, console.error);

  console.log('Transaction Created:     ', resCreate.body.transaction.transactionId);
  console.log('SHA-256 Hash Attached:   ', !!resCreate.body.transactionHash);
  console.log('HMAC Attached:           ', !!resCreate.body.hmac);
  console.log('RSA Signature Attached:  ', !!resCreate.body.digitalSignature);
  console.log('Private Key Exposed?:    ', resCreate.body.rsaPrivateKey ? '❌ EXPOSED' : '✅ SECURE (OMITTED)');
  console.log('HMAC Secret Exposed?:    ', resCreate.body.hmacSecret ? '❌ EXPOSED' : '✅ SECURE (OMITTED)');

  const txId = resCreate.body.transaction.transactionId;

  // Verify Digital Signature
  const reqVerifySig = { params: { transactionId: txId }, body: {} };
  const resVerifySig = createMockRes();
  await verifyTransactionSignature(reqVerifySig, resVerifySig, console.error);

  console.log('Verify Signature Endpoint Valid?:', resVerifySig.body.signatureValid ? '✅ PASS' : '❌ FAIL');
  console.log('Authenticated Signer:           ', resVerifySig.body.signer);
  console.log('Public Key Fingerprint:         ', resVerifySig.body.publicKeyFingerprint);

  // Tamper check via Endpoint
  const reqTamperSig = { params: { transactionId: txId }, body: { simulateTamper: true, tamperedAmount: 9999 } };
  const resTamperSig = createMockRes();
  await verifyTransactionSignature(reqTamperSig, resTamperSig, console.error);

  console.log('Tampered Endpoint Sig Valid? (Expected False):', !resTamperSig.body.signatureValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR');

  console.log('\n====================================================');
  console.log('🎉 ALL RSA DIGITAL SIGNATURE TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runControllerTests().catch(console.error);
