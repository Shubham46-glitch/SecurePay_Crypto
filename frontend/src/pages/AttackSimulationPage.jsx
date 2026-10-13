import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  AlertOctagon,
  Flame,
  Activity,
} from 'lucide-react';
import { simulationService, transactionService } from '../services/api';

const AttackSimulationPage = () => {
  // Attack Mode: 'TAMPER' | 'REPLAY' | 'FORGERY'
  const [activeTab, setActiveTab] = useState('TAMPER');

  // Selected Transaction from Live MongoDB Ledger
  const [selectedTxId, setSelectedTxId] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Attack 1: Tampering Inputs
  const [tamperedField, setTamperedField] = useState('amount');
  const [tamperedAmount, setTamperedAmount] = useState('');
  const [tamperedReceiver, setTamperedReceiver] = useState('');

  // Attack 3: Forgery Inputs
  const [forgedSender, setForgedSender] = useState('');
  const [forgedReceiver, setForgedReceiver] = useState('');
  const [forgedAmount, setForgedAmount] = useState('');

  // Execution States
  const [executing, setExecuting] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch actual live transactions from MongoDB
  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const res = await transactionService.getAll({ limit: 8 });
      if (res.success && res.transactions?.length > 0) {
        setRecentTransactions(res.transactions);
        if (!selectedTxId && res.transactions[0]) {
          handleSelectTransaction(res.transactions[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load recent transactions for attack sandbox', e);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleSelectTransaction = (tx) => {
    setSelectedTxId(tx.transactionId);
    setSelectedTx(tx);
    setTamperedAmount(String(Number(tx.amount) * 2));
    setTamperedReceiver(tx.receiver ? `${tx.receiver}_altered` : 'unauthorized_recipient');
    setForgedSender('Impersonated Attacker');
    setForgedReceiver(tx.receiver || tx.receiverName || '');
    setForgedAmount(String(tx.amount));
    setAttackResult(null);
    setError('');
  };

  // 1. Launch Tampering Attack
  const handleTamperAttack = async () => {
    if (!selectedTxId || executing) return;

    setExecuting(true);
    setAttackResult(null);
    setError('');

    try {
      const res = await simulationService.tamper({
        transactionId: selectedTxId,
        tamperedAmount: tamperedField === 'amount' || tamperedField === 'both' ? parseFloat(tamperedAmount) : undefined,
        tamperedReceiver: tamperedField === 'receiver' || tamperedField === 'both' ? tamperedReceiver : undefined,
      });

      if (res.success) {
        setAttackResult(res);
      } else {
        setError(res.message || 'Tampering simulation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error executing tampering simulation.');
    } finally {
      setExecuting(false);
    }
  };

  // 2. Launch Replay Attack
  const handleReplayAttack = async () => {
    if (!selectedTxId || executing) return;

    setExecuting(true);
    setAttackResult(null);
    setError('');

    try {
      const res = await simulationService.replay({
        transactionId: selectedTxId,
      });

      if (res.success) {
        setAttackResult(res);
      } else {
        setError(res.message || 'Replay simulation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error executing replay simulation.');
    } finally {
      setExecuting(false);
    }
  };

  // 3. Launch Forgery Attack
  const handleForgeryAttack = async () => {
    if (!selectedTxId || executing) return;

    setExecuting(true);
    setAttackResult(null);
    setError('');

    try {
      const res = await simulationService.forge({
        transactionId: selectedTxId,
        forgedSender,
        forgedReceiver,
        forgedAmount: parseFloat(forgedAmount),
      });

      if (res.success) {
        setAttackResult(res);
      } else {
        setError(res.message || 'Forgery simulation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error executing forgery simulation.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attack Simulation Laboratory</h1>
          <p className="page-subtitle">
            Controlled adversary sandbox: Demonstrate Tampering, Replay Attacks, and Signature Forgery against live cryptographic defenses
          </p>
        </div>
      </div>

      {/* Attack Mode Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('TAMPER'); setAttackResult(null); setError(''); }}
          className="btn"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.8rem 1.25rem',
            background: activeTab === 'TAMPER' ? 'var(--accent-danger-bg)' : 'var(--bg-surface)',
            border: `1px solid ${activeTab === 'TAMPER' ? 'var(--accent-danger-border)' : 'var(--border-card)'}`,
            color: activeTab === 'TAMPER' ? 'var(--accent-danger)' : 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          <Flame size={16} /> 1. Transaction Tampering
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('REPLAY'); setAttackResult(null); setError(''); }}
          className="btn"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.8rem 1.25rem',
            background: activeTab === 'REPLAY' ? 'var(--accent-warning-bg)' : 'var(--bg-surface)',
            border: `1px solid ${activeTab === 'REPLAY' ? 'var(--accent-warning-border)' : 'var(--border-card)'}`,
            color: activeTab === 'REPLAY' ? 'var(--accent-warning)' : 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          <RefreshCw size={16} /> 2. Replay Attack
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('FORGERY'); setAttackResult(null); setError(''); }}
          className="btn"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.8rem 1.25rem',
            background: activeTab === 'FORGERY' ? 'var(--accent-purple-bg)' : 'var(--bg-surface)',
            border: `1px solid ${activeTab === 'FORGERY' ? 'var(--accent-purple-border)' : 'var(--border-card)'}`,
            color: activeTab === 'FORGERY' ? '#a78bfa' : 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          <KeyRound size={16} /> 3. Transaction Forgery
        </button>
      </div>

      {/* Main Grid: Control Panel + Live Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
        {/* Left Column: Attack Sandbox Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="crypto-card">
            {/* Tab 1 Explainer */}
            {activeTab === 'TAMPER' && (
              <div>
                <div className="card-header-flex">
                  <h2 className="card-title">
                    <Flame size={18} color="var(--accent-danger)" /> Transaction Tampering
                  </h2>
                  <span className="badge badge-danger">MITM Alteration</span>
                </div>
                <div style={{ background: 'var(--accent-danger-bg)', border: '1px solid var(--accent-danger-border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>What this attack demonstrates:</strong> A Man-in-the-Middle adversary intercepts and modifies transaction fields in transit. SHA-256 and HMAC instantly detect the altered hash.
                </div>
              </div>
            )}

            {/* Tab 2 Explainer */}
            {activeTab === 'REPLAY' && (
              <div>
                <div className="card-header-flex">
                  <h2 className="card-title">
                    <RefreshCw size={18} color="var(--accent-warning)" /> Replay Attack
                  </h2>
                  <span className="badge badge-warning">Double-Spend Attempt</span>
                </div>
                <div style={{ background: 'var(--accent-warning-bg)', border: '1px solid var(--accent-warning-border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#fcd34d' }}>
                  <strong>What this attack demonstrates:</strong> An eavesdropper captures a previously processed valid payment and replays it. The anti-replay guard traps the re-used CSPRNG nonce.
                </div>
              </div>
            )}

            {/* Tab 3 Explainer */}
            {activeTab === 'FORGERY' && (
              <div>
                <div className="card-header-flex">
                  <h2 className="card-title">
                    <KeyRound size={18} color="var(--accent-purple)" /> Transaction Forgery
                  </h2>
                  <span className="badge badge-purple">Impersonation</span>
                </div>
                <div style={{ background: 'var(--accent-purple-bg)', border: '1px solid var(--accent-purple-border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#d8b4fe' }}>
                  <strong>What this attack demonstrates:</strong> An attacker modifies sender identity or payload without Alice's RSA-2048 private key. Asymmetric verification mathematically rejects the signature.
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'var(--accent-danger-bg)',
                  border: '1px solid var(--accent-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: 'var(--accent-danger)',
                  fontSize: '0.825rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Select Target Transaction */}
            <div className="form-group">
              <label className="form-label">Select Transaction from Ledger</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', marginBottom: '1rem' }}>
                {recentTransactions.map((tx) => (
                  <button
                    key={tx._id || tx.transactionId}
                    type="button"
                    onClick={() => handleSelectTransaction(tx)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.55rem 0.75rem',
                      background: selectedTxId === tx.transactionId ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card-subtle)',
                      border: `1px solid ${selectedTxId === tx.transactionId ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <span className="font-mono" style={{ fontSize: '0.775rem', fontWeight: 600, color: '#60a5fa' }}>
                        {tx.transactionId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        {tx.sender || tx.senderName} ({tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : '₹'}{Number(tx.amount).toFixed(2)})
                      </span>
                    </div>
                    <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {tx.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Attack Inputs per Mode */}
            {activeTab === 'TAMPER' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Select Field to Tamper</label>
                  <select
                    className="form-control"
                    value={tamperedField}
                    onChange={(e) => setTamperedField(e.target.value)}
                  >
                    <option value="amount">Amount Only</option>
                    <option value="receiver">Receiver Only</option>
                    <option value="both">Both Amount & Receiver</option>
                  </select>
                </div>

                {(tamperedField === 'amount' || tamperedField === 'both') && (
                  <div className="form-group">
                    <label className="form-label">Enter Tampered Amount (Original: {selectedTx?.currency === 'USD' ? '$' : selectedTx?.currency === 'EUR' ? '€' : '₹'}{selectedTx?.amount || '0.00'})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control font-mono"
                      value={tamperedAmount}
                      onChange={(e) => setTamperedAmount(e.target.value)}
                    />
                  </div>
                )}

                {(tamperedField === 'receiver' || tamperedField === 'both') && (
                  <div className="form-group">
                    <label className="form-label">Enter Tampered Receiver Wallet</label>
                    <input
                      type="text"
                      className="form-control"
                      value={tamperedReceiver}
                      onChange={(e) => setTamperedReceiver(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTamperAttack}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '0.8rem', marginTop: '0.25rem' }}
                  disabled={executing || !selectedTxId}
                >
                  {executing ? (
                    <>
                      <RefreshCw size={15} className="spin-animation" /> Simulating Tampering Attack...
                    </>
                  ) : (
                    <>
                      <Flame size={15} /> Simulate Tampering
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'REPLAY' && (
              <div>
                <div style={{ background: 'var(--bg-card-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Replay Target Nonce: <strong className="font-mono" style={{ color: '#fbbf24' }}>{selectedTx?.nonce || 'N/A'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Current Ledger Status: <strong style={{ color: selectedTx?.status === 'COMPLETED' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{selectedTx?.status || 'PENDING'}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReplayAttack}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#d97706', borderColor: '#d97706' }}
                  disabled={executing || !selectedTxId}
                >
                  {executing ? (
                    <>
                      <RefreshCw size={15} className="spin-animation" /> Replaying Transaction Packet...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={15} /> Replay Transaction
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'FORGERY' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Modify Attacker-Controlled Sender Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={forgedSender}
                    onChange={(e) => setForgedSender(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modify Attacker-Controlled Receiver</label>
                  <input
                    type="text"
                    className="form-control"
                    value={forgedReceiver}
                    onChange={(e) => setForgedReceiver(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modify Forged Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control font-mono"
                    value={forgedAmount}
                    onChange={(e) => setForgedAmount(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleForgeryAttack}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                  disabled={executing || !selectedTxId}
                >
                  {executing ? (
                    <>
                      <RefreshCw size={15} className="spin-animation" /> Testing RSA Signature Forgery...
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} /> Simulate Forgery
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Attack Mitigation Results */}
        <div className="crypto-card">
          <div className="card-header-flex">
            <h2 className="card-title">
              <ShieldAlert size={18} color="var(--accent-danger)" /> Threat Defense Telemetry
            </h2>
            {attackResult && (
              <span className="badge badge-danger">
                🚨 ATTACK DETECTED & TRAPPED
              </span>
            )}
          </div>

          {!attackResult ? (
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
              <Bug size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Awaiting Attack Execution
              </div>
              <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
                Select a transaction on the left and trigger an attack simulation to observe live defense mechanisms trapping the violation.
              </p>
            </div>
          ) : (
            <div>
              {/* Defense Status Alert Banner */}
              <div
                style={{
                  background: 'var(--accent-danger-bg)',
                  border: '1px solid var(--accent-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <AlertOctagon size={30} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                    🚨 ATTACK DETECTED & TRAPPED
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {attackResult.message}
                  </div>
                </div>
              </div>

              {/* Cryptographic Subsystem Defense Breakdown */}
              {attackResult.checks && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {attackResult.checks.sha256 && (
                    <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#ffffff' }}>SHA-256 Integrity Layer</span>
                        <span className={`badge ${attackResult.checks.sha256.verified ? 'badge-success' : 'badge-danger'}`}>
                          {attackResult.checks.sha256.status || (attackResult.checks.sha256.verified ? 'PASSED' : 'FAILED')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attackResult.checks.sha256.message}</p>
                    </div>
                  )}

                  {attackResult.checks.hmac && (
                    <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#ffffff' }}>HMAC-SHA-256 Authentication</span>
                        <span className={`badge ${attackResult.checks.hmac.verified ? 'badge-success' : 'badge-danger'}`}>
                          {attackResult.checks.hmac.status || (attackResult.checks.hmac.verified ? 'PASSED' : 'FAILED')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attackResult.checks.hmac.message}</p>
                    </div>
                  )}

                  {attackResult.checks.rsaSignature && (
                    <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#ffffff' }}>RSA-2048 Digital Signature</span>
                        <span className={`badge ${attackResult.checks.rsaSignature.verified ? 'badge-success' : 'badge-danger'}`}>
                          {attackResult.checks.rsaSignature.status || (attackResult.checks.rsaSignature.verified ? 'PASSED' : 'FAILED')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attackResult.checks.rsaSignature.message}</p>
                    </div>
                  )}

                  {attackResult.checks.nonceCheck && (
                    <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#ffffff' }}>Nonce Anti-Replay Guard</span>
                        <span className="badge badge-danger">CONSUMED / BLOCKED</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attackResult.checks.nonceCheck.message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* View Dashboard Button */}
              <Link
                to="/security"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.825rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Activity size={15} color="var(--accent-primary)" />
                View Updated Security Dashboard Metrics <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttackSimulationPage;
