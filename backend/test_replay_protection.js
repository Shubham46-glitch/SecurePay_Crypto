const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('NONCE + TIMESTAMP ANTI-REPLAY DEFENSE AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Create a new transaction
  console.log('TEST 1: Creating dynamic transaction with CSPRNG nonce & server timestamp...');
  let tx1 = null;
  try {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Shubham',
        receiver: 'Rahul',
        amount: 1000,
        currency: 'INR',
      }),
    });
    const data = await res.json();
    tx1 = data.transaction;

    if (
      data.success &&
      tx1.transactionId &&
      tx1.nonce &&
      tx1.timestamp &&
      tx1.status === 'PENDING' &&
      tx1.processedAt === null &&
      data.transactionHash &&
      data.hmac &&
      data.digitalSignature
    ) {
      console.log(`✓ TEST 1 PASSED: Transaction created: ID=${tx1.transactionId}, Nonce=${tx1.nonce.substring(0, 16)}..., Timestamp=${tx1.timestamp}, Status=${tx1.status}`);
      passed++;
    } else {
      console.error('✗ TEST 1 FAILED: Unexpected response structure', data);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 1 ERROR:', err.message);
    failed++;
  }

  // TEST 2: Process transaction for the first time
  console.log('\nTEST 2: Processing new transaction (Initial submission)...');
  try {
    const res = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (
      res.status === 200 &&
      data.success &&
      data.status === 'COMPLETED' &&
      data.processedAt &&
      data.consumedAt &&
      data.replayProtection?.nonceConsumed === true &&
      data.replayProtection?.freshnessVerified === true
    ) {
      console.log(`✓ TEST 2 PASSED: Transaction successfully processed. Status=${data.status}, ProcessedAt=${data.processedAt}`);
      passed++;
    } else {
      console.error('✗ TEST 2 FAILED: Transaction failed to process properly', data);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 2 ERROR:', err.message);
    failed++;
  }

  // TEST 3: Replay attack test (Process exact same transaction second time)
  console.log('\nTEST 3: Attempting Replay Attack (Submitting exact same transaction second time)...');
  try {
    const res = await fetch(`${API_BASE}/transactions/${tx1.transactionId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if ((res.status === 400 || res.status === 409) && data.reason === 'REPLAY_ATTACK_DETECTED') {
      console.log(`✓ TEST 3 PASSED: Server rejected replay attempt! (HTTP ${res.status}) Reason: ${data.reason} - Message: "${data.message}"`);
      passed++;
    } else {
      console.error('✗ TEST 3 FAILED: Server accepted duplicate transaction submission or returned incorrect reason!', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 3 ERROR:', err.message);
    failed++;
  }

  // TEST 4 & 5: Create second transaction and verify nonces are unique and CSPRNG generated
  console.log('\nTEST 4 & 5: Verifying Nonce Uniqueness across multiple transactions...');
  try {
    const res2 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Alice',
        receiver: 'Bob',
        amount: 250,
        currency: 'USD',
      }),
    });
    const data2 = await res2.json();
    const tx2 = data2.transaction;

    if (tx2.nonce !== tx1.nonce && tx2.nonce.length >= 32) {
      console.log(`✓ TEST 4 & 5 PASSED: Unique CSPRNG nonces generated:\n  TX 1 Nonce: ${tx1.nonce}\n  TX 2 Nonce: ${tx2.nonce}`);
      passed++;
    } else {
      console.error('✗ TEST 4 & 5 FAILED: Duplicate or invalid nonce detected', tx1.nonce, tx2.nonce);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 4 & 5 ERROR:', err.message);
    failed++;
  }

  // TEST 6: Stale / Expired timestamp test
  console.log('\nTEST 6: Testing Freshness Window (Rejecting stale/expired timestamp > 300s)...');
  try {
    const res3 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Charlie',
        receiver: 'Dave',
        amount: 100,
        currency: 'EUR',
      }),
    });
    const data3 = await res3.json();
    const tx3 = data3.transaction;

    const resExpire = await fetch(`${API_BASE}/transactions/${tx3.transactionId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulateExpired: true }),
    });
    const dataExpire = await resExpire.json();

    if (resExpire.status === 400 && dataExpire.reason === 'EXPIRED_TRANSACTION') {
      console.log(`✓ TEST 6 PASSED: Stale timestamp rejected! Reason: ${dataExpire.reason} - Age: ${dataExpire.ageSeconds}s (Max: ${dataExpire.maxAgeSeconds}s)`);
      passed++;
    } else {
      console.error('✗ TEST 6 FAILED: Expired timestamp was not rejected properly', resExpire.status, dataExpire);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 6 ERROR:', err.message);
    failed++;
  }

  // TEST 7: Confirm Cryptographic Integrity (SHA-256, HMAC, RSA) remain fully intact
  console.log('\nTEST 7: Verifying all 3 cryptographic mechanisms remain intact...');
  try {
    const res4 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Alice Cryptographer',
        receiver: 'Bob Merchant',
        amount: 750,
        currency: 'USD',
      }),
    });
    const data4 = await res4.json();
    const tx4 = data4.transaction;

    const [shaRes, hmacRes, rsaRes] = await Promise.all([
      fetch(`${API_BASE}/transactions/${tx4.transactionId}/verify-integrity`, { method: 'POST' }).then((r) => r.json()),
      fetch(`${API_BASE}/transactions/${tx4.transactionId}/verify-hmac`, { method: 'POST' }).then((r) => r.json()),
      fetch(`${API_BASE}/transactions/${tx4.transactionId}/verify-signature`, { method: 'POST' }).then((r) => r.json()),
    ]);

    if (
      shaRes.integrityValid === true &&
      hmacRes.authenticationValid === true &&
      rsaRes.signatureValid === true
    ) {
      console.log('✓ TEST 7 PASSED: All 3 cryptographic mechanisms verified successfully:');
      console.log(`  - SHA-256 Hash: ${shaRes.storedHash.substring(0, 24)}... (INTEGRITY OK)`);
      console.log(`  - HMAC-SHA-256: ${hmacRes.storedHmac.substring(0, 24)}... (AUTH OK)`);
      console.log(`  - RSA-2048 Sign: ${rsaRes.digitalSignature.substring(0, 24)}... (NON-REPUDIATION OK)`);
      passed++;
    } else {
      console.error('✗ TEST 7 FAILED: One or more crypto verifications failed', shaRes, hmacRes, rsaRes);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 7 ERROR:', err.message);
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
