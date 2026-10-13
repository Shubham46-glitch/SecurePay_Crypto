import React, { useState } from 'react';
import { X, Lock, Key, ShieldCheck, Clock, CheckCircle2, Copy, Zap, ShieldAlert, Check } from 'lucide-react';
import CryptoBadge from './CryptoBadge';
import { transactionService } from '../services/api';

const TransactionModal = ({ transaction: initialTx, onClose, onUpdated }) => {
  const [transaction, setTransaction] = useState(initialTx);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  if (!transaction) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleProcess = async (options = {}) => {
    setProcessing(true);
    setProcessResult(null);
    setProcessError(null);

    try {
      const res = await transactionService.process(transaction.transactionId, options);
      if (res.success) {
        setProcessResult(res);
        const updated = {
          ...transaction,
          status: 'COMPLETED',
          processedAt: res.processedAt,
          consumedAt: res.consumedAt,
        };
        setTransaction(updated);
        if (onUpdated) onUpdated(updated);
      } else {
        setProcessError(res);
      }
    } catch (err) {
      const errData = err.response?.data || {
        success: false,
        reason: 'PROCESS_ERROR',
        message: err.message || 'Failed to process transaction',
      };
      setProcessError(errData);
    } finally {
      setProcessing(false);
    }
  };

  const txHash = transaction.transactionHash || transaction.sha256Hash || '';
  const hmacSig = transaction.hmac || transaction.hmacSignature || '';
  const rsaSig = transaction.digitalSignature || transaction.rsaSignature || '';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '740px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 id="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Cryptographic Audit Inspector</h2>
              <CryptoBadge status={transaction.status} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Transaction ID: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{transaction.transactionId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
            aria-label="Close inspector modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Core Properties Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            background: 'var(--bg-card-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>SENDER</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{transaction.senderName || transaction.sender || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECEIVER</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{transaction.receiverName || transaction.receiver}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>AMOUNT</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
              {transaction.currency === 'USD' ? '$' : transaction.currency === 'EUR' ? '€' : '₹'}{Number(transaction.amount).toFixed(2)} {transaction.currency || 'INR'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIMESTAMP</div>
            <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
              {new Date(transaction.timestamp || transaction.createdAt).toLocaleTimeString()}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>CSPRNG NONCE</div>
            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fbbf24', wordBreak: 'break-all' }}>
              {transaction.nonce}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROCESSED STATUS</div>
            <div style={{ fontSize: '0.785rem', color: transaction.processedAt ? 'var(--accent-success)' : 'var(--text-muted)', fontWeight: 600 }}>
              {transaction.processedAt ? `Processed (${new Date(transaction.processedAt).toLocaleTimeString()})` : 'Pending Processing'}
            </div>
          </div>
        </div>

        {/* Real Replay Protection Action Box */}
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#38bdf8' }}>
              <Zap size={15} /> Anti-Replay Processor
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Status: <strong style={{ color: transaction.status === 'COMPLETED' ? '#34d399' : '#fbbf24' }}>{transaction.status}</strong>
            </span>
          </div>

          {processResult && (
            <div
              style={{
                background: 'var(--accent-success-bg)',
                border: '1px solid var(--accent-success-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.8rem',
                marginBottom: '0.6rem',
                fontSize: '0.8rem',
                color: 'var(--accent-success)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>✓ Transaction Processed: Nonce consumed at {new Date(processResult.processedAt).toLocaleTimeString()}</span>
            </div>
          )}

          {processError && (
            <div
              style={{
                background: 'var(--accent-danger-bg)',
                border: '1px solid var(--accent-danger-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.8rem',
                marginBottom: '0.6rem',
                fontSize: '0.8rem',
                color: 'var(--accent-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldAlert size={16} />
              <span>{processError.reason === 'REPLAY_ATTACK_DETECTED' ? '🚨 Replay Attack Detected: ' : '✗ Error: '} {processError.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleProcess()}
              className="btn btn-primary btn-sm"
              disabled={processing}
            >
              <Check size={14} />
              {processing ? 'Processing...' : (transaction.status === 'COMPLETED' ? 'Re-Process (Test Replay Attack)' : 'Process Transaction')}
            </button>
            <button
              onClick={() => handleProcess({ simulateExpired: true })}
              className="btn btn-secondary btn-sm"
              disabled={processing}
            >
              <Clock size={13} /> Test Stale Expiry
            </button>
          </div>
        </div>

        {/* Cryptographic Hashes & Signatures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>Canonical Serialized Payload</label>
              <button
                onClick={() => copyToClipboard(transaction.canonicalPayload || '', 'payload')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.15rem 0.45rem', fontSize: '0.675rem' }}
                type="button"
              >
                <Copy size={11} /> {copiedKey === 'payload' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="crypto-hash-box" style={{ fontSize: '0.725rem' }}>
              {transaction.canonicalPayload || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>1. SHA-256 Digest (Integrity)</label>
              <button
                onClick={() => copyToClipboard(txHash, 'sha')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.15rem 0.45rem', fontSize: '0.675rem' }}
                type="button"
              >
                <Copy size={11} /> {copiedKey === 'sha' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="crypto-hash-box" style={{ color: '#38bdf8', fontSize: '0.775rem' }}>
              {txHash}
            </div>
          </div>

          {hmacSig && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>2. HMAC-SHA-256 (Gateway Authentication)</label>
                <button
                  onClick={() => copyToClipboard(hmacSig, 'hmac')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.675rem' }}
                  type="button"
                >
                  <Copy size={11} /> {copiedKey === 'hmac' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="crypto-hash-box" style={{ color: '#c084fc', fontSize: '0.775rem' }}>
                {hmacSig}
              </div>
            </div>
          )}

          {rsaSig && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>3. RSA-2048 Digital Signature (Non-Repudiation)</label>
                <button
                  onClick={() => copyToClipboard(rsaSig, 'rsa')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.675rem' }}
                  type="button"
                >
                  <Copy size={11} /> {copiedKey === 'rsa' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="crypto-hash-box" style={{ color: '#34d399', fontSize: '0.725rem' }}>
                {rsaSig}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
