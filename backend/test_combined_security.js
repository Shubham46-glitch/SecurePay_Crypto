const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('COMBINED SECURITY VERIFICATION PIPELINE AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Create a valid transaction and run Combined Security Verification
  console.log('TEST 1: Creating a fresh transaction and running Complete Security Verification...');
  let tx1 = null;
  try {
    const resCreate = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Shubham Baikar',
        receiver: 'Prof. Cryptography Demonstrator',
        amount: 500,
        currency: 'INR',
      }),
    });
    const createData = await resCreate.json();
    tx1 = createData.transaction;

    const resVerify = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/verify-security`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const verifyData = await resVerify.json();

    const c = verifyData.checks;
    if (
      verifyData.success &&
      verifyData.securityVerified === true &&
      verifyData.status === 'TRANSACTION_SECURE' &&
      c.sha256?.verified === true &&
      c.hmac?.verified === true &&
      c.rsaSignature?.verified === true &&
      c.timestamp?.valid === true &&
      c.replayProtection?.valid === true
    ) {
      console.log('✓ TEST 1 PASSED: Valid transaction passed all 5 security checks:');
      console.log(`  - SHA-256 Integrity: PASSED (${c.sha256.storedHash.substring(0, 16)}...)`);
      console.log(`  - HMAC-SHA-256 Auth:  PASSED`);
      console.log(`  - RSA-2048 Signature: PASSED (${c.rsaSignature.publicKeyFingerprint})`);
      console.log(`  - Timestamp Window:   PASSED (Age: ${c.timestamp.ageSeconds}s <= 300s)`);
      console.log(`  - Nonce Anti-Replay:  PASSED (Nonce unconsumed)`);
      console.log(`  - FINAL VERDICT:      ${verifyData.status}`);
      passed++;
    } else {
      console.error('✗ TEST 1 FAILED: Unexpected verification results', verifyData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 1 ERROR:', err.message);
    failed++;
  }

  // TEST 2: Tampered Amount (₹500 -> ₹5000)
  console.log('\nTEST 2: Testing payload tampering detection (₹500 -> ₹5000)...');
  try {
    const resTamper = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/verify-security`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulateTamper: true,
        tamperedAmount: 5000.0,
      }),
    });
    const tamperData = await resTamper.json();
    const c = tamperData.checks;

    if (
      tamperData.securityVerified === false &&
      tamperData.status === 'TRANSACTION_REJECTED' &&
      c.sha256?.verified === false &&
      c.hmac?.verified === false &&
      c.rsaSignature?.verified === false
    ) {
      console.log('✓ TEST 2 PASSED: Tampering detected mathematically:');
      console.log(`  - SHA-256 Check: FAILED (Hash mismatch)`);
      console.log(`  - HMAC Check:    FAILED`);
      console.log(`  - RSA Check:     FAILED`);
      console.log(`  - FINAL VERDICT: ${tamperData.status}`);
      passed++;
    } else {
      console.error('✗ TEST 2 FAILED: Tampered transaction was not rejected properly', tamperData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 2 ERROR:', err.message);
    failed++;
  }

  // TEST 3: Invalid / Forged RSA Digital Signature
  console.log('\nTEST 3: Testing forged RSA digital signature detection...');
  try {
    const resSig = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/verify-security`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulateTamper: true,
        tamperedSignature: 'FORGED_INVALID_BASE64_SIGNATURE_998877665544332211==',
      }),
    });
    const sigData = await resSig.json();
    const c = sigData.checks;

    if (
      sigData.securityVerified === false &&
      sigData.status === 'TRANSACTION_REJECTED' &&
      c.rsaSignature?.verified === false &&
      c.sha256?.verified === true
    ) {
      console.log('✓ TEST 3 PASSED: Forged RSA signature rejected:');
      console.log(`  - SHA-256 Check: PASSED (Payload untouched)`);
      console.log(`  - RSA Signature: FAILED (Forged signature invalid)`);
      console.log(`  - FINAL VERDICT: ${sigData.status}`);
      passed++;
    } else {
      console.error('✗ TEST 3 FAILED: Invalid signature was not rejected', sigData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 3 ERROR:', err.message);
    failed++;
  }

  // TEST 4: Replay Protection Check in Combined Verification
  console.log('\nTEST 4: Processing transaction then verifying replay detection...');
  try {
    // Process TX 1 to consume its nonce
    await fetch(`${API_BASE}/transactions/${tx1.transactionId}/process`, { method: 'POST' });

    // Now run combined verification on consumed TX 1
    const resReplay = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/verify-security`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const replayData = await resReplay.json();
    const c = replayData.checks;

    if (
      replayData.securityVerified === false &&
      replayData.status === 'TRANSACTION_REJECTED' &&
      c.replayProtection?.valid === false &&
      c.replayProtection?.replayDetected === true
    ) {
      console.log('✓ TEST 4 PASSED: Consumed transaction rejected as replayed:');
      console.log(`  - Nonce Check:   REPLAY_DETECTED (Processed at: ${c.replayProtection.processedAt})`);
      console.log(`  - FINAL VERDICT: ${replayData.status}`);
      passed++;
    } else {
      console.error('✗ TEST 4 FAILED: Replay was not detected in combined check', replayData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 4 ERROR:', err.message);
    failed++;
  }

  // TEST 5: Verify that calling /verify-security does NOT mutate database status
  console.log('\nTEST 5: Confirming verification does NOT mutate transaction status in database...');
  try {
    const resCreateNew = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'Alice', receiver: 'Bob', amount: 120 }),
    });
    const newTxData = await resCreateNew.json();
    const newTx = newTxData.transaction;

    // Call verify-security multiple times
    await fetch(`${API_BASE}/transactions/${newTx.transactionId}/verify-security`, { method: 'POST' });
    await fetch(`${API_BASE}/transactions/${newTx.transactionId}/verify-security`, { method: 'POST' });

    // Fetch transaction by ID
    const resGet = await fetch(`${API_BASE}/transactions/${newTx.transactionId}`);
    const getData = await resGet.json();

    if (getData.transaction.status === 'PENDING' && getData.transaction.processedAt === null) {
      console.log(`✓ TEST 5 PASSED: Transaction remained PENDING (processedAt=null) after verification audits.`);
      passed++;
    } else {
      console.error('✗ TEST 5 FAILED: Verification mutated transaction status prematurely:', getData.transaction);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 5 ERROR:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
