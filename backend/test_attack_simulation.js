const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('ATTACK SIMULATION & THREAT MODEL AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // STEP 1: Create a genuine baseline transaction
  console.log('PREPARATION: Creating a genuine baseline transaction...');
  let tx = null;
  try {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Alice Cryptographer',
        receiver: 'Bob Merchant Services',
        amount: 750,
        currency: 'INR',
      }),
    });
    const data = await res.json();
    tx = data.transaction;
    console.log(`✓ Baseline transaction created: ID=${tx.transactionId}, Amount=₹${tx.amount}, Nonce=${tx.nonce.substring(0, 16)}...\n`);
  } catch (err) {
    console.error('✗ SETUP ERROR:', err.message);
    process.exit(1);
  }

  // TEST A: Transaction Tampering Simulation (₹750 -> ₹7500)
  console.log('TEST A: Simulating Transaction Tampering Attack (₹750 -> ₹7500)...');
  try {
    const resTamper = await fetch(`${API_BASE}/attacks/tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: tx.transactionId,
        tamperedAmount: 7500.0,
        tamperedReceiver: 'Mallory Adversary Wallet',
      }),
    });
    const tamperData = await resTamper.json();
    const c = tamperData.checks;

    if (
      tamperData.success &&
      tamperData.attackDetected === true &&
      tamperData.status === 'TRANSACTION_TAMPERING_DETECTED' &&
      c.sha256?.verified === false &&
      c.hmac?.verified === false &&
      c.rsaSignature?.verified === false
    ) {
      console.log('✓ TEST A PASSED: Tampering attack trapped mathematically:');
      console.log(`  - SHA-256 Check: FAILED (${c.sha256.message})`);
      console.log(`  - HMAC Check:    FAILED (${c.hmac.message})`);
      console.log(`  - RSA Signature: FAILED (${c.rsaSignature.message})`);
      console.log(`  - Verdict:       ${tamperData.message}`);
      passed++;
    } else {
      console.error('✗ TEST A FAILED: Tampering was not detected as expected', tamperData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST A ERROR:', err.message);
    failed++;
  }

  // TEST B: Replay Attack Simulation
  console.log('\nTEST B: Simulating Real Replay Attack...');
  try {
    // 1. First process the transaction legitimate
    await fetch(`${API_BASE}/transactions/${tx.transactionId}/process`, { method: 'POST' });

    // 2. Attempt replay attack
    const resReplay = await fetch(`${API_BASE}/attacks/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: tx.transactionId,
      }),
    });
    const replayData = await resReplay.json();

    if (
      replayData.success &&
      replayData.attackDetected === true &&
      replayData.status === 'REPLAY_ATTACK_DETECTED'
    ) {
      console.log('✓ TEST B PASSED: Replay attack trapped:');
      console.log(`  - Nonce Check:      CONSUMED (${replayData.checks?.nonceCheck?.message})`);
      console.log(`  - Processing State: ALREADY COMPLETED`);
      console.log(`  - Verdict:          ${replayData.message}`);
      passed++;
    } else {
      console.error('✗ TEST B FAILED: Replay attack was not trapped', replayData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST B ERROR:', err.message);
    failed++;
  }

  // TEST C: Transaction Forgery Simulation
  console.log('\nTEST C: Simulating Transaction Forgery Attack (Altering Sender to Mallory)...');
  try {
    const resForge = await fetch(`${API_BASE}/attacks/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: tx.transactionId,
        forgedSender: 'Attacker Mallory (Fake Node)',
        forgedAmount: 15000,
      }),
    });
    const forgeData = await resForge.json();
    const c = forgeData.checks;

    if (
      forgeData.success &&
      forgeData.attackDetected === true &&
      forgeData.status === 'FORGED_TRANSACTION_REJECTED' &&
      c.rsaSignature?.verified === false
    ) {
      console.log('✓ TEST C PASSED: Transaction forgery rejected:');
      console.log(`  - Forged Sender: Attacker Mallory`);
      console.log(`  - RSA Signature: FAILED (${c.rsaSignature.message})`);
      console.log(`  - Verdict:       ${forgeData.message}`);
      passed++;
    } else {
      console.error('✗ TEST C FAILED: Forgery attack was not rejected', forgeData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST C ERROR:', err.message);
    failed++;
  }

  // TEST D: Confirm Original Transaction in MongoDB Was NEVER Modified
  console.log('\nTEST D: Confirming Original MongoDB Transaction remains intact & unmodified...');
  try {
    const resCheck = await fetch(`${API_BASE}/transactions/${tx.transactionId}`);
    const checkData = await resCheck.json();
    const dbTx = checkData.transaction;

    // Verify SHA-256 integrity of the stored database transaction
    const resIntegrity = await fetch(`${API_BASE}/transactions/${tx.transactionId}/verify-integrity`, { method: 'POST' });
    const integrityData = await resIntegrity.json();

    if (
      dbTx.amount === 750 &&
      dbTx.sender === 'Alice Cryptographer' &&
      integrityData.integrityValid === true
    ) {
      console.log('✓ TEST D PASSED: Original database transaction completely untouched:');
      console.log(`  - Stored Amount: ₹${dbTx.amount} (NOT tampered ₹7500)`);
      console.log(`  - Stored Sender: ${dbTx.sender} (NOT forged Mallory)`);
      console.log(`  - SHA-256 Integrity in Ledger: VALID`);
      passed++;
    } else {
      console.error('✗ TEST D FAILED: Database was corrupted or mutated by simulation', dbTx, integrityData);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST D ERROR:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`ATTACK SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
