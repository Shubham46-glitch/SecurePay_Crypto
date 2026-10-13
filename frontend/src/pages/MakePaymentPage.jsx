import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  Zap,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { transactionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CryptoValueDisplay from '../components/CryptoValueDisplay';

const MakePaymentPage = () => {
  const { user, refreshUser, refreshBalance } = useAuth();

  const [formData, setFormData] = useState({
    sender: user?.name || '',
    receiver: '',
    amount: '',
    currency: 'INR',
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdTransaction, setCreatedTransaction] = useState(null);
  const [transferInfo, setTransferInfo] = useState(null);
  const [error, setError] = useState('');

  // Processing state for Anti-Replay Engine
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setCreatedTransaction(null);
    setTransferInfo(null);
    setProcessResult(null);
    setProcessError(null);

    if (!formData.sender.trim()) {
      setError('Please enter a sender identity.');
      return;
    }
    if (!formData.receiver.trim()) {
      setError('Please enter a valid receiver identity.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await transactionService.create({
        sender: formData.sender.trim(),
        receiver: formData.receiver.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
      });

      if (res.success) {
        setCreatedTransaction(res.transaction || res);
        setTransferInfo({
          senderBalance: res.senderBalance,
          receiverBalance: res.receiverBalance,
          deducted: parseFloat(formData.amount),
          receiver: formData.receiver.trim(),
        });

        if (typeof res.senderBalance === 'number') {
          refreshBalance(res.senderBalance);
        } else {
          refreshUser();
        }
      } else {
        setError(res.message || 'Failed to create transaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection error while creating cryptographic payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTransaction = async (options = {}) => {
    if (!createdTransaction || processing) return;

    setProcessing(true);
    setProcessResult(null);
    setProcessError(null);

    try {
      const res = await transactionService.process(createdTransaction.transactionId, options);
      if (res.success) {
        setProcessResult(res);
        setCreatedTransaction((prev) => ({
          ...prev,
          status: 'COMPLETED',
          processedAt: res.processedAt,
          consumedAt: res.consumedAt,
        }));
      } else {
        setProcessError(res);
      }
    } catch (err) {
      const errData = err.response?.data || {
        success: false,
        reason: 'NETWORK_OR_SERVER_ERROR',
        message: err.message || 'Failed to connect to transaction processing endpoint.',
      };
      setProcessError(errData);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Secure Payment Transaction</h1>
          <p className="page-subtitle">
            Dynamic cryptographic pipeline: CSPRNG Nonce + Server Monotonic Timestamp + SHA-256 Digest + HMAC-SHA-256 + RSA-2048 Digital Signature
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
        {/* Payment Creation Form */}
        <div className="crypto-card">
          <div className="card-header-flex">
            <h2 className="card-title">
              <Send size={18} color="var(--accent-primary)" /> Payment Details
            </h2>
            <span className="badge badge-blue">Pipeline Stage 1</span>
          </div>

          {error && (
            <div
              style={{
                background: 'var(--accent-danger-bg)',
                border: '1px solid var(--accent-danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                color: 'var(--accent-danger)',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-sender">Sender Identity (Signed via RSA-2048)</label>
              <input
                id="pay-sender"
                type="text"
                className="form-control"
                placeholder="Enter sender name or identity"
                value={formData.sender}
                onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pay-receiver">Receiver Identity</label>
              <input
                id="pay-receiver"
                type="text"
                className="form-control"
                placeholder="Enter receiver name or wallet"
                value={formData.receiver}
                onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-amount">Amount</label>
                <input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control font-mono"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-currency">Currency</label>
                <select
                  id="pay-currency"
                  className="form-control"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.925rem', marginTop: '0.35rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spin-animation" /> Creating Transaction & Generating Signatures...
                </>
              ) : (
                <>
                  <Lock size={16} /> Create & Sign Cryptographic Transaction
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cryptographic Proofs & Security Output */}
        <div className="crypto-card">
          <div className="card-header-flex">
            <h2 className="card-title">
              <ShieldCheck size={18} color="var(--accent-success)" /> Security Information
            </h2>
            {createdTransaction && (
              <span className={`badge ${createdTransaction.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                {createdTransaction.status || 'PENDING'}
              </span>
            )}
          </div>

          {!createdTransaction ? (
            <div
              style={{
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-card)',
                color: 'var(--text-muted)',
              }}
            >
              <KeyRound size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                Security values will be generated after transaction creation.
              </div>
              <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
                Fill in the payment parameters on the left and click <strong>Create & Sign</strong> to generate the real SHA-256 digest, HMAC tag, RSA signature, timestamp, and nonce.
              </p>
            </div>
          ) : (
            <div>
              {transferInfo && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid var(--accent-success-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-success)" />
                    <span>
                      Deducted <strong>₹{transferInfo.deducted?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> from sender account.
                    </span>
                  </div>
                  {typeof transferInfo.senderBalance === 'number' && (
                    <div style={{ fontSize: '0.775rem', color: '#93c5fd' }}>
                      New Balance: <strong>₹{transferInfo.senderBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID */}
              <CryptoValueDisplay
                label="Transaction ID"
                value={createdTransaction.transactionId}
                badgeColor="blue"
                description="Unique ledger identifier generated by server"
                truncateLength={36}
              />

              {/* Timestamp & Nonce Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <CryptoValueDisplay
                  label="Timestamp"
                  value={createdTransaction.timestamp}
                  algorithm="Monotonic Epoch"
                  badgeColor="blue"
                />
                <CryptoValueDisplay
                  label="Nonce"
                  value={createdTransaction.nonce}
                  algorithm="128-bit CSPRNG"
                  badgeColor="warning"
                  truncateLength={16}
                />
              </div>

              {/* SHA-256 Digest */}
              <CryptoValueDisplay
                label="SHA-256 Hash Digest"
                value={createdTransaction.sha256Hash || createdTransaction.transactionHash}
                algorithm="FIPS PUB 180-4"
                badgeColor="blue"
                description="Deterministic canonical payload hash ensuring message integrity."
                truncateLength={32}
              />

              {/* HMAC-SHA-256 */}
              <CryptoValueDisplay
                label="HMAC-SHA-256 Authentication Tag"
                value={createdTransaction.hmac || createdTransaction.hmacSignature}
                algorithm="RFC 2104"
                badgeColor="success"
                description="Secret-key message authentication code verifying gateway origin."
                truncateLength={32}
              />

              {/* RSA-2048 Digital Signature */}
              <CryptoValueDisplay
                label="RSA-2048 Digital Signature"
                value={createdTransaction.digitalSignature || createdTransaction.rsaSignature}
                algorithm="PKCS#1 v2.2"
                badgeColor="purple"
                description="Asymmetric sender signature proving origin and non-repudiation."
                truncateLength={36}
              />

              {/* Process / Execute Transaction Action Panel */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1.1rem',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
                    Payment Processing & Anti-Replay Engine
                  </div>
                  <span className="badge badge-blue">Atomic CAS Lock</span>
                </div>

                {createdTransaction.status === 'COMPLETED' ? (
                  <div
                    style={{
                      background: 'var(--accent-success-bg)',
                      border: '1px solid var(--accent-success-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      color: 'var(--accent-success)',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Transaction Completed:</strong> Nonce <code className="font-mono">{createdTransaction.nonce?.substring(0, 10)}...</code> has been consumed and locked against replay.
                    </span>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => handleProcessTransaction()}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.875rem' }}
                      disabled={processing}
                      type="button"
                    >
                      <Zap size={15} />
                      {processing ? 'Processing Transaction...' : 'Process & Finalize Transaction'}
                    </button>
                  </div>
                )}

                {processError && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      background: 'var(--accent-danger-bg)',
                      border: '1px solid var(--accent-danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      color: 'var(--accent-danger)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>Rejection Alert:</div>
                    <div>{processError.message}</div>
                  </div>
                )}
              </div>

              {/* Quick Jump Action Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <Link
                  to={`/verify?txId=${createdTransaction.transactionId}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.8rem', textAlign: 'center' }}
                >
                  <FileCheck2 size={14} /> Verify Security
                </Link>
                <Link
                  to={`/simulation`}
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: '0.8rem', textAlign: 'center' }}
                >
                  <ShieldAlert size={14} /> Attack Simulation
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MakePaymentPage;
