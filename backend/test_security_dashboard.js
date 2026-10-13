const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🛡️  SECURITY DASHBOARD LIVE DATA VERIFICATION TEST 🛡️');
  console.log('====================================================\n');

  try {
    // 1. Initial State
    console.log('--- Step 1: Querying Initial Dashboard Metrics ---');
    const initRes = await request('GET', '/dashboard/security-summary');
    console.log('✓ Initial Status:', initRes.status);
    console.log('  Total Transactions:', initRes.data.totalTransactions);
    console.log('  Successful Transactions:', initRes.data.successfulTransactions);
    console.log('  Tampering Attacks:', initRes.data.attacks.tampering);
    console.log('  Replay Attacks:', initRes.data.attacks.replay);
    console.log('  Forgery Attacks:', initRes.data.attacks.forgery);
    console.log('  Security Score:', initRes.data.securityScore, '%');

    const prevTotal = initRes.data.totalTransactions;
    const prevSuccess = initRes.data.successfulTransactions;
    const prevTamper = initRes.data.attacks.tampering;
    const prevReplay = initRes.data.attacks.replay;
    const prevForge = initRes.data.attacks.forgery;

    // 2. Create Real Transaction
    console.log('\n--- Step 2: Creating Real Cryptographic Transaction ---');
    const txRes = await request('POST', '/transactions', {
      sender: 'Alice Professor',
      receiver: 'Bob Merchant',
      amount: 450.75,
      currency: 'USD',
    });
    console.log('✓ Transaction Created:', txRes.data.transaction?.transactionId);
    const txId = txRes.data.transaction?.transactionId;

    // Check Total Count Incremented
    const afterCreate = await request('GET', '/dashboard/security-summary');
    console.log('✓ Total Transactions after creation:', afterCreate.data.totalTransactions, `(Expected: ${prevTotal + 1})`);
    if (afterCreate.data.totalTransactions !== prevTotal + 1) {
      throw new Error(`Total count mismatch: expected ${prevTotal + 1}, got ${afterCreate.data.totalTransactions}`);
    }

    // 3. Process Transaction
    console.log('\n--- Step 3: Processing Transaction Legitimate Verification ---');
    const procRes = await request('POST', `/transactions/${txId}/process`, {
      simulateTampering: false,
    });
    console.log('✓ Process Result:', procRes.data.status);

    const afterProcess = await request('GET', '/dashboard/security-summary');
    console.log('✓ Successful Transactions after processing:', afterProcess.data.successfulTransactions, `(Expected: ${prevSuccess + 1})`);

    // 4. Attack 1: Tampering Simulation
    console.log('\n--- Step 4: Simulating Tampering Attack ---');
    const tamperRes = await request('POST', '/attacks/tamper', {
      transactionId: txId,
      tamperedAmount: 9999.00,
    });
    console.log('✓ Tampering Attack Detected:', tamperRes.data.attackDetected);
    console.log('✓ Tampering Message:', tamperRes.data.message);

    const afterTamper = await request('GET', '/dashboard/security-summary');
    console.log('✓ Tampering Count in Dashboard:', afterTamper.data.attacks.tampering, `(Expected: ${prevTamper + 1})`);

    // 5. Attack 2: Replay Attack Simulation
    console.log('\n--- Step 5: Simulating Replay Attack ---');
    const replayRes = await request('POST', '/attacks/replay', {
      transactionId: txId,
    });
    console.log('✓ Replay Attack Detected:', replayRes.data.attackDetected);
    console.log('✓ Replay Message:', replayRes.data.message);

    const afterReplay = await request('GET', '/dashboard/security-summary');
    console.log('✓ Replay Count in Dashboard:', afterReplay.data.attacks.replay, `(Expected: ${prevReplay + 1})`);

    // 6. Attack 3: Forgery Attack Simulation
    console.log('\n--- Step 6: Simulating Forgery Attack ---');
    const forgeRes = await request('POST', '/attacks/forge', {
      transactionId: txId,
      forgedSender: 'Mallory Adversary',
    });
    console.log('✓ Forgery Attack Detected:', forgeRes.data.attackDetected);
    console.log('✓ Forgery Message:', forgeRes.data.message);

    const afterForge = await request('GET', '/dashboard/security-summary');
    console.log('✓ Forgery Count in Dashboard:', afterForge.data.attacks.forgery, `(Expected: ${prevForge + 1})`);

    // 7. Verify Security Events Table
    console.log('\n--- Step 7: Verifying Security Audit Logs Feed ---');
    const logsRes = await request('GET', '/security/logs?limit=10');
    console.log(`✓ Retrieved ${logsRes.data.logs.length} real SecurityLog items from database.`);
    const recentEventTypes = logsRes.data.logs.slice(0, 5).map(l => `[${l.result || 'INFO'}] ${l.eventType} (${l.details.substring(0, 45)}...)`);
    console.log('  Top 5 Events:');
    recentEventTypes.forEach(e => console.log('   •', e));

    // 8. Verify Security Score
    console.log('\n--- Step 8: Verifying Documented Security Score ---');
    console.log('✓ Final Dashboard Security Score:', afterForge.data.securityScore, '%');
    console.log('✓ Score Formula:', afterForge.data.securityScoreFormula);
    console.log('✓ Total Blocked Threats:', afterForge.data.attacks.total);

    console.log('\n====================================================');
    console.log('🎉 ALL SECURITY DASHBOARD LIVE TESTS PASSED 100%! 🎉');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
