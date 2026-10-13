const {
  createTransaction,
  verifyTransactionIntegrity,
  verifyTransactionHMAC,
  verifyTransactionSignature,
  getTransactions,
} = require('./src/controllers/paymentController');
const { simulateAttack } = require('./src/controllers/simulationController');

console.log('======================================================================');
console.log('🎓 LIVE COLLEGE PROFESSOR DEMO SIMULATION TEST (100% REAL CRYPTO)');
console.log('======================================================================\n');

function createMockRes() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

async function runProfessorLiveDemo() {
  // -------------------------------------------------------------------------
  // TEST SCENARIO 1: Professor enters arbitrary inputs: Dr. Ananya -> Prof. Vikram (₹1,250)
  // -------------------------------------------------------------------------
  console.log('🔹 SCENARIO 1: Professor enters live transaction (₹1,250.00)');
  const tx1Req = {
    body: {
      sender: 'Dr. Ananya Sharma (Professor)',
      receiver: 'Prof. Vikram Reddy',
      amount: 1250.0,
      currency: 'INR',
    },
    user: { name: 'Dr. Ananya Sharma (Professor)' },
  };
  const tx1Res = createMockRes();
  await createTransaction(tx1Req, tx1Res, console.error);

  const tx1 = tx1Res.body.transaction;
  console.log('   ✅ Generated Transaction ID: ', tx1.transactionId);
  console.log('   ✅ Cryptographic Nonce:      ', tx1.nonce);
  console.log('   ✅ Real SHA-256 Digest:      ', tx1.transactionHash);
  console.log('   ✅ Real HMAC-SHA-256 Code:   ', tx1.hmac);
  console.log('   ✅ Real RSA Digital Signature:', tx1.digitalSignature.substring(0, 45) + '...');
  console.log('   ✅ Public Key Fingerprint:   ', tx1.senderKeyFingerprint);

  // Check Zero Exposure of Secrets
  const exposedPrivateKey = JSON.stringify(tx1Res.body).includes('BEGIN PRIVATE KEY');
  const exposedHmacSecret = JSON.stringify(tx1Res.body).includes('gateway_shared_hmac_master_secret');
  console.log('   🔒 Private Key Exposed to UI?:', exposedPrivateKey ? '❌ CRITICAL LEAK' : '✅ NEVER EXPOSED (SAFE)');
  console.log('   🔒 HMAC Secret Exposed to UI?:', exposedHmacSecret ? '❌ CRITICAL LEAK' : '✅ NEVER EXPOSED (SAFE)');
  if (exposedPrivateKey || exposedHmacSecret) throw new Error('Secret leakage detected');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 2: Professor verifies all 3 mechanisms independently
  // -------------------------------------------------------------------------
  console.log('\n🔹 SCENARIO 2: Live Cryptographic Verification of Untampered Transaction');
  
  // 1. Verify SHA-256 Integrity
  const vShaRes = createMockRes();
  await verifyTransactionIntegrity({ params: { transactionId: tx1.transactionId }, body: {} }, vShaRes, console.error);
  console.log('   1. SHA-256 Integrity Check:        ', vShaRes.body.integrityValid ? '✅ PASS (0-bit deviation)' : '❌ FAIL');

  // 2. Verify HMAC Gateway Authentication
  const vHmacRes = createMockRes();
  await verifyTransactionHMAC({ params: { transactionId: tx1.transactionId }, body: {} }, vHmacRes, console.error);
  console.log('   2. HMAC-SHA-256 Authentication:    ', vHmacRes.body.authenticationValid ? '✅ PASS (Server Key Verified)' : '❌ FAIL');

  // 3. Verify RSA Digital Signature (Non-Repudiation)
  const vRsaRes = createMockRes();
  await verifyTransactionSignature({ params: { transactionId: tx1.transactionId }, body: {} }, vRsaRes, console.error);
  console.log('   3. RSA Digital Signature & Signer:  ', vRsaRes.body.signatureValid ? `✅ PASS (Signed by: ${vRsaRes.body.signer})` : '❌ FAIL');

  if (!vShaRes.body.integrityValid || !vHmacRes.body.authenticationValid || !vRsaRes.body.signatureValid) {
    throw new Error('Verification failed on legitimate transaction');
  }

  // -------------------------------------------------------------------------
  // TEST SCENARIO 3: Live Attack Simulation (Tampering ₹1,250 -> ₹12,500)
  // -------------------------------------------------------------------------
  console.log('\n🔹 SCENARIO 3: Live In-Transit Tampering Simulation (₹1,250 -> ₹12,500)');
  const attackReq = {
    body: {
      attackType: 'AMOUNT_TAMPERING',
      transactionId: tx1.transactionId,
      tamperedAmount: 12500.0,
    },
  };
  const attackRes = createMockRes();
  await simulateAttack(attackReq, attackRes, console.error);

  const sim = attackRes.body.simulation;
  console.log('   🚨 Attack Trapped Verdict:          ', sim.verdict);
  console.log('   ❌ SHA-256 Result:                 ', sim.breakdown.sha256.statusText);
  console.log('   ❌ HMAC-SHA-256 Result:            ', sim.breakdown.hmac.statusText);
  console.log('   ❌ RSA Digital Signature Result:   ', sim.breakdown.rsaSignature.statusText);

  if (sim.breakdown.sha256.passed || sim.breakdown.hmac.passed || sim.breakdown.rsaSignature.passed) {
    throw new Error('Tampered transaction erroneously passed cryptographic checks');
  }

  // -------------------------------------------------------------------------
  // TEST SCENARIO 4: Professor enters a 2nd distinct transaction (Rahul -> Priya ₹7,300)
  // -------------------------------------------------------------------------
  console.log('\n🔹 SCENARIO 4: 2nd Distinct Transaction (Rahul -> Priya ₹7,300.00)');
  const tx2Req = {
    body: {
      sender: 'Rahul Verma',
      receiver: 'Priya Patel',
      amount: 7300.0,
      currency: 'INR',
    },
    user: { name: 'Rahul Verma' },
  };
  const tx2Res = createMockRes();
  await createTransaction(tx2Req, tx2Res, console.error);
  const tx2 = tx2Res.body.transaction;

  console.log('   ✅ 2nd TX ID:                      ', tx2.transactionId);
  console.log('   ✅ 2nd SHA-256:                    ', tx2.transactionHash);
  console.log('   ✅ 2nd HMAC:                       ', tx2.hmac);
  console.log('   ✅ Distinct Hashes Between TXs:    ', tx1.transactionHash !== tx2.transactionHash ? '✅ UNIQUE (PASS)' : '❌ DUPLICATE');

  console.log('\n======================================================================');
  console.log('🎉 ALL LIVE INTERACTIVE PROFESSOR DEMO REQUIREMENTS VERIFIED & PASSED!');
  console.log('======================================================================\n');
}

runProfessorLiveDemo().catch(console.error);
