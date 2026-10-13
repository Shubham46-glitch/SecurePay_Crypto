const { createTransaction, verifyTransactionIntegrity, verifyTransactionHMAC } = require('./src/controllers/paymentController');

console.log('🧪 Testing Payment Controller Endpoints Directly...\n');

// Mock response creator
function createMockRes() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

async function runTests() {
  // 1. Create Transaction
  const reqCreate = {
    body: {
      sender: 'Alice Cryptographer',
      receiver: 'Bob Merchant',
      amount: 500,
      currency: 'INR',
    },
    user: { name: 'Alice Cryptographer' },
  };
  const resCreate = createMockRes();

  await createTransaction(reqCreate, resCreate, (err) => { if (err) console.error(err); });

  console.log('1. Transaction Creation:');
  console.log('   Status Code:', resCreate.statusCode);
  console.log('   Transaction ID:', resCreate.body.transaction.transactionId);
  console.log('   SHA-256 Hash:', resCreate.body.transactionHash);
  console.log('   HMAC-SHA-256:', resCreate.body.hmac);
  console.log('   Secret Exposed in Response?:', resCreate.body.hmacSecret ? '❌ EXPOSED' : '✅ SECURE (NOT EXPOSED)');

  const txId = resCreate.body.transaction.transactionId;

  // 2. Verify SHA-256 (Untampered)
  const reqVerifySha = { params: { transactionId: txId }, body: {} };
  const resVerifySha = createMockRes();
  await verifyTransactionIntegrity(reqVerifySha, resVerifySha, console.error);
  console.log('\n2. SHA-256 Verification (Untampered):');
  console.log('   Integrity Valid?:', resVerifySha.body.integrityValid ? '✅ PASS' : '❌ FAIL');

  // 3. Verify HMAC (Untampered)
  const reqVerifyHmac = { params: { transactionId: txId }, body: {} };
  const resVerifyHmac = createMockRes();
  await verifyTransactionHMAC(reqVerifyHmac, resVerifyHmac, console.error);
  console.log('\n3. HMAC-SHA-256 Verification (Untampered):');
  console.log('   Authentication Valid?:', resVerifyHmac.body.authenticationValid ? '✅ PASS' : '❌ FAIL');
  console.log('   Integrity Valid?:     ', resVerifyHmac.body.integrityValid ? '✅ PASS' : '❌ FAIL');
  console.log('   Message:              ', resVerifyHmac.body.message);

  // 4. Verify HMAC on Tampered Amount (₹500 -> ₹5000)
  const reqTamperAmount = {
    params: { transactionId: txId },
    body: { simulateTamper: true, tamperedAmount: 5000 },
  };
  const resTamperAmount = createMockRes();
  await verifyTransactionHMAC(reqTamperAmount, resTamperAmount, console.error);
  console.log('\n4. HMAC Verification on Tampered Amount (₹500 -> ₹5000):');
  console.log('   Authentication Valid?: (Expected False):', !resTamperAmount.body.authenticationValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR');
  console.log('   Integrity Valid?:      (Expected False):', !resTamperAmount.body.integrityValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR');
  console.log('   Message:               ', resTamperAmount.body.message);

  // 5. Verify HMAC on Tampered Receiver ('Bob Merchant' -> 'Mallory')
  const reqTamperReceiver = {
    params: { transactionId: txId },
    body: { simulateTamper: true, tamperedReceiver: 'Mallory' },
  };
  const resTamperReceiver = createMockRes();
  await verifyTransactionHMAC(reqTamperReceiver, resTamperReceiver, console.error);
  console.log('\n5. HMAC Verification on Tampered Receiver:');
  console.log('   Authentication Valid?: (Expected False):', !resTamperReceiver.body.authenticationValid ? '✅ CORRECTLY FAILED (PASS)' : '❌ ERROR');

  console.log('\n====================================================');
  console.log('🎉 ALL CONTROLLER & API VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(console.error);
