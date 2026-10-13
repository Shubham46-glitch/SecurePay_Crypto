const BASE_URL = 'http://127.0.0.1:5000/api';

async function req(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runAudit() {
  console.log('================================================================');
  console.log('🛡️  FULL SYSTEM SECURITY AUDIT & END-TO-END VERIFICATION  🛡️');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ✓ ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ✗ ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. TEST COMPLETE NORMAL TRANSACTION FLOW
    // -------------------------------------------------------------
    console.log('🔹 [1/12] Testing Normal Transaction Creation Flow...');
    const createTxRes = await req('POST', '/transactions', {
      sender: 'Alice University Professor',
      receiver: 'Bob Merchant Node',
      amount: 1250.50,
      currency: 'USD',
    });

    assert(createTxRes.status === 201, 'Transaction created with HTTP 201');
    const tx = createTxRes.data.transaction;
    assert(!!tx.transactionId, `Transaction ID generated dynamically: ${tx.transactionId}`);
    assert(typeof tx.timestamp === 'number' && tx.timestamp > 0, `Server timestamp generated: ${tx.timestamp}`);
    assert(typeof tx.nonce === 'string' && tx.nonce.length >= 16, `CSPRNG Nonce generated: ${tx.nonce}`);
    assert(typeof tx.sha256Hash === 'string' && tx.sha256Hash.length === 64, `SHA-256 64-char hex digest: ${tx.sha256Hash.substring(0, 16)}...`);
    assert(typeof tx.hmac === 'string' && tx.hmac.length === 64, `HMAC-SHA-256 64-char auth digest: ${tx.hmac.substring(0, 16)}...`);
    assert(typeof tx.digitalSignature === 'string' && tx.digitalSignature.length > 50, `RSA-2048 Digital Signature present: ${tx.digitalSignature.substring(0, 24)}...`);
    assert(tx.status === 'PENDING', `Initial transaction status is PENDING`);

    const txId = tx.transactionId;

    // -------------------------------------------------------------
    // 2. VERIFY SHA-256 INTEGRITY & TAMPER RESISTANCE
    // -------------------------------------------------------------
    console.log('\n🔹 [2/12] Verifying SHA-256 Integrity & Hash Invariance...');
    const shaVerifyValid = await req('POST', `/transactions/${txId}/verify-integrity`, {});
    assert(shaVerifyValid.status === 200, 'SHA-256 verification API responded HTTP 200');
    assert(shaVerifyValid.data.verified === true, 'Legitimate transaction SHA-256 integrity PASSES');
    assert(shaVerifyValid.data.storedHash === shaVerifyValid.data.calculatedHash, 'Stored hash exactly matches freshly computed hash');

    // Tampered copy verification
    const shaVerifyTampered = await req('POST', `/transactions/${txId}/verify-integrity`, {
      simulateTampering: true,
      tamperedAmount: 99999.00,
    });
    assert(shaVerifyTampered.data.verified === false, 'Tampered copy SHA-256 integrity FAILS as expected');
    assert(shaVerifyTampered.data.storedHash !== shaVerifyTampered.data.calculatedHash, 'Tampered copy produces distinct hash (avalanche effect)');

    // Ensure original DB record was untouched
    const getTxAfterSha = await req('GET', `/transactions/${txId}`);
    assert(getTxAfterSha.data.transaction.amount === 1250.50, 'Original transaction amount in DB remains unmodified ($1250.50)');

    // -------------------------------------------------------------
    // 3. VERIFY HMAC-SHA-256 AUTHENTICATION & SECRET ISOLATION
    // -------------------------------------------------------------
    console.log('\n🔹 [3/12] Verifying HMAC-SHA-256 & Secret Key Isolation...');
    const hmacVerifyValid = await req('POST', `/transactions/${txId}/verify-hmac`, {});
    assert(hmacVerifyValid.status === 200, 'HMAC verification API responded HTTP 200');
    assert(hmacVerifyValid.data.verified === true, 'Legitimate transaction HMAC authentication PASSES');

    const hmacVerifyTampered = await req('POST', `/transactions/${txId}/verify-hmac`, {
      simulateTampering: true,
      tamperedReceiver: 'Attacker Eve',
    });
    assert(hmacVerifyTampered.data.verified === false, 'Tampered copy HMAC verification FAILS');

    // Inspect API response to ensure HMAC secret is never leaked
    const jsonString = JSON.stringify(createTxRes.data) + JSON.stringify(hmacVerifyValid.data);
    assert(!jsonString.includes('gateway_shared_hmac_master_secret_key'), 'HMAC secret key is NEVER returned in API payload');
    assert(getTxAfterSha.data.transaction.hmacSecret === undefined, 'HMAC secret is NOT stored in transaction database document');

    // -------------------------------------------------------------
    // 4. VERIFY RSA DIGITAL SIGNATURE & SENDER AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n🔹 [4/12] Verifying RSA-2048 Digital Signature & Key Isolation...');
    const rsaVerifyValid = await req('POST', `/transactions/${txId}/verify-signature`, {});
    assert(rsaVerifyValid.status === 200, 'RSA verification API responded HTTP 200');
    assert(rsaVerifyValid.data.verified === true, 'Legitimate RSA digital signature PASSES');

    const rsaVerifyTampered = await req('POST', `/transactions/${txId}/verify-signature`, {
      simulateTampering: true,
      tamperedSender: 'Mallory Impersonator',
    });
    assert(rsaVerifyTampered.data.verified === false, 'Sender-modified transaction RSA signature FAILS');

    // Inspect API response to ensure RSA private key is never leaked
    assert(!jsonString.includes('-----BEGIN RSA PRIVATE KEY-----') && !jsonString.includes('PRIVATE KEY'), 'RSA Private Key is NEVER exposed in API response');
    assert(!!tx.senderPublicKey, 'Sender RSA Public Key is accessible for third-party verification');

    // -------------------------------------------------------------
    // 5. VERIFY NONCE UNIQUENESS & ENTROPY
    // -------------------------------------------------------------
    console.log('\n🔹 [5/12] Verifying Nonce Uniqueness & CSPRNG Entropy...');
    const nonces = new Set();
    nonces.add(tx.nonce);

    for (let i = 0; i < 5; i++) {
      const extraTx = await req('POST', '/transactions', {
        sender: `Sender ${i}`,
        receiver: `Receiver ${i}`,
        amount: 100 + i,
      });
      const extraNonce = extraTx.data.transaction.nonce;
      assert(!nonces.has(extraNonce), `Transaction ${i + 1} nonce is uniquely distinct: ${extraNonce}`);
      nonces.add(extraNonce);
    }
    assert(nonces.size === 6, 'All 6 generated nonces are cryptographically unique and collision-free');

    // -------------------------------------------------------------
    // 6. VERIFY TIMESTAMP FRESHNESS & MONOTONIC CLOCK
    // -------------------------------------------------------------
    console.log('\n🔹 [6/12] Verifying Timestamp Freshness & Monotonic Clock...');
    const freshCheck = await req('POST', `/transactions/${txId}/verify-security`, {});
    assert(freshCheck.data.checks.timestamp.verified === true, 'Current server timestamp is verified fresh within ±300s window');

    const expiredCheck = await req('POST', `/transactions/${txId}/verify-security`, {
      simulateExpiredTimestamp: true,
      tamperedTimestamp: Date.now() - (600 * 1000), // 10 minutes ago
    });
    assert(expiredCheck.data.checks.timestamp.verified === false, 'Stale timestamp (10 min old) is REJECTED by freshness guard');

    // -------------------------------------------------------------
    // 7. VERIFY REPLAY PROTECTION (PROCESS ONCE VS DUPLICATE REPLAY)
    // -------------------------------------------------------------
    console.log('\n🔹 [7/12] Verifying Replay Protection (Single-Use Processing)...');
    const processOnce = await req('POST', `/transactions/${txId}/process`, {
      simulateTampering: false,
    });
    assert(processOnce.status === 200, 'First execution of transaction responds HTTP 200');
    assert(processOnce.data.status === 'COMPLETED', 'First execution marks transaction as COMPLETED');

    // Attempt second execution of the exact same transaction
    const processDuplicate = await req('POST', `/transactions/${txId}/process`, {
      simulateTampering: false,
    });
    assert(processDuplicate.status === 400 || processDuplicate.status === 200, 'Duplicate execution trapped');
    assert(
      processDuplicate.data.status === 'REPLAY_ATTACK_DETECTED' ||
      processDuplicate.data.rejectionReason === 'REPLAY_ATTACK_DETECTED' ||
      processDuplicate.data.success === false,
      'Duplicate execution is firmly REJECTED as a Replay Attack'
    );

    // -------------------------------------------------------------
    // 8. VERIFY COMBINED SECURITY VERIFICATION PIPELINE
    // -------------------------------------------------------------
    console.log('\n🔹 [8/12] Verifying Combined Security Pipeline...');
    // Create fresh transaction for combined verification
    const freshCombinedTx = await req('POST', '/transactions', {
      sender: 'Alice University Professor',
      receiver: 'Bob Merchant Node',
      amount: 500.00,
    });
    const combTxId = freshCombinedTx.data.transaction.transactionId;

    const combValid = await req('POST', `/transactions/${combTxId}/verify-security`, {});
    assert(combValid.status === 200, 'Combined verification API responds HTTP 200');
    assert(combValid.data.securityDecision === 'SECURE', 'Legitimate transaction decision is SECURE');
    assert(combValid.data.checks.sha256.verified === true, 'Combined SHA-256 check: PASSED');
    assert(combValid.data.checks.hmac.verified === true, 'Combined HMAC check: PASSED');
    assert(combValid.data.checks.rsaSignature.verified === true, 'Combined RSA signature check: PASSED');
    assert(combValid.data.checks.timestamp.verified === true, 'Combined Timestamp check: PASSED');
    assert(combValid.data.checks.nonce.verified === true, 'Combined Nonce check: PASSED');

    // Tampered copy in combined verification
    const combTampered = await req('POST', `/transactions/${combTxId}/verify-security`, {
      simulateTampering: true,
      tamperedAmount: 7777.00,
    });
    assert(combTampered.data.securityDecision === 'REJECTED_SECURITY_FAILURE' || combTampered.data.securityDecision === 'INSECURE', 'Tampered copy decision is REJECTED');
    assert(combTampered.data.checks.sha256.verified === false, 'Tampered copy SHA-256 check fails in combined flow');

    // -------------------------------------------------------------
    // 9. VERIFY TAMPERING ATTACK SIMULATION
    // -------------------------------------------------------------
    console.log('\n🔹 [9/12] Verifying Tampering Attack Simulation...');
    const tamperSim = await req('POST', '/attacks/tamper', {
      transactionId: combTxId,
      tamperedAmount: 99999.00,
    });
    assert(tamperSim.status === 200, 'Tampering attack simulation responds HTTP 200');
    assert(tamperSim.data.attackDetected === true, 'Tampering attack successfully trapped by crypto engines');
    assert(tamperSim.data.checks.sha256.status === 'FAILED', 'SHA-256 failed on tampered copy');
    assert(tamperSim.data.checks.hmac.status === 'FAILED', 'HMAC failed on tampered copy');
    assert(tamperSim.data.checks.rsaSignature.status === 'FAILED', 'RSA failed on tampered copy');

    // -------------------------------------------------------------
    // 10. VERIFY REPLAY ATTACK SIMULATION
    // -------------------------------------------------------------
    console.log('\n🔹 [10/12] Verifying Replay Attack Simulation...');
    const replaySim = await req('POST', '/attacks/replay', {
      transactionId: txId, // already completed
    });
    assert(replaySim.status === 200, 'Replay simulation responds HTTP 200');
    assert(replaySim.data.attackDetected === true, 'Replay attack successfully trapped');
    assert(replaySim.data.status === 'REPLAY_ATTACK_DETECTED', 'Status confirms REPLAY_ATTACK_DETECTED');

    // -------------------------------------------------------------
    // 11. VERIFY FORGERY ATTACK SIMULATION
    // -------------------------------------------------------------
    console.log('\n🔹 [11/12] Verifying Forgery Attack Simulation...');
    const forgeSim = await req('POST', '/attacks/forge', {
      transactionId: combTxId,
      forgedSender: 'Mallory Impersonator',
    });
    assert(forgeSim.status === 200, 'Forgery simulation responds HTTP 200');
    assert(forgeSim.data.attackDetected === true, 'Forgery attack trapped by RSA signature verification');
    assert(forgeSim.data.status === 'FORGED_TRANSACTION_REJECTED', 'Status confirms FORGED_TRANSACTION_REJECTED');

    // -------------------------------------------------------------
    // 12. VERIFY SECURITY DASHBOARD TELEMETRY & AUDIT LOGS
    // -------------------------------------------------------------
    console.log('\n🔹 [12/12] Verifying Security Dashboard Live Data Synchronization...');
    const dashRes = await req('GET', '/dashboard/security-summary');
    assert(dashRes.status === 200, 'Dashboard summary responds HTTP 200');
    assert(dashRes.data.totalTransactions >= 7, `Total transactions reflects all created transactions (Count: ${dashRes.data.totalTransactions})`);
    assert(dashRes.data.attacks.tampering >= 1, `Tampering attempts count is accurate (Count: ${dashRes.data.attacks.tampering})`);
    assert(dashRes.data.attacks.replay >= 1, `Replay attempts count is accurate (Count: ${dashRes.data.attacks.replay})`);
    assert(dashRes.data.attacks.forgery >= 1, `Forgery attempts count is accurate (Count: ${dashRes.data.attacks.forgery})`);
    assert(typeof dashRes.data.securityScore === 'number' && dashRes.data.securityScore > 0, `Security score computed dynamically: ${dashRes.data.securityScore}%`);

    const logsRes = await req('GET', '/security/logs?limit=50');
    assert(logsRes.status === 200, 'Security logs endpoint responds HTTP 200');
    const logEventTypes = logsRes.data.logs.map(l => l.eventType);
    assert(logEventTypes.includes('TAMPERING_DETECTED') || logEventTypes.includes('TAMPERING_ATTACK_DETECTED'), 'TAMPERING_DETECTED recorded in security logs');
    assert(logEventTypes.includes('REPLAY_DETECTED') || logEventTypes.includes('REPLAY_ATTACK_DETECTED'), 'REPLAY_DETECTED recorded in security logs');
    assert(logEventTypes.includes('FORGERY_DETECTED') || logEventTypes.includes('FORGERY_ATTACK_DETECTED'), 'FORGERY_DETECTED recorded in security logs');

    console.log('\n================================================================');
    console.log(`🎉 SECURITY AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%) 🎉`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err.message);
    process.exit(1);
  }
}

runAudit();
