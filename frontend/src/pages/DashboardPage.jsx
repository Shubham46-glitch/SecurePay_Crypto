import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Activity,
  Send,
  Bug,
  FileCheck2,
  RefreshCw,
  ExternalLink,
  Lock,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { dashboardService } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';
import TransactionModal from '../components/TransactionModal';
import SecurityIndicator from '../components/SecurityIndicator';

const DashboardPage = () => {
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    rejectedTransactions: 0,
    pendingTransactions: 0,
    securityScore: 100,
    attacks: { tampering: 0, replay: 0, forgery: 0, total: 0 },
    verification: { sha256Passed: 0, sha256Failed: 0, hmacPassed: 0, hmacFailed: 0, rsaPassed: 0, rsaFailed: 0 },
    recentTransactions: [],
    recentSecurityEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await dashboardService.getSecuritySummary();
      if (summaryRes && summaryRes.success) {
        setSummary(summaryRes);
      }
    } catch (err) {
      console.warn('Dashboard metrics fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all ledger transactions, security logs, and metrics to clean zero state for live demonstration?')) {
      return;
    }
    setLoading(true);
    try {
      await dashboardService.reset();
      await fetchDashboardData();
    } catch (err) {
      console.warn('Reset error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalTx = summary.totalTransactions ?? 0;
  const successTx = summary.successfulTransactions ?? 0;
  const rejectedTx = summary.rejectedTransactions ?? 0;
  const securityScore = summary.securityScore ?? 100;
  const recentTransactions = summary.recentTransactions || [];
  const recentLogs = summary.recentSecurityEvents || [];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cryptographic Operations Dashboard</h1>
          <p className="page-subtitle">
            Real-time telemetry on transaction integrity, authentication validations, and security events
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SecurityIndicator level={rejectedTx > 0 ? 'WARNING' : 'HIGH'} title="Integrity Guard Active" />
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className="metric-value">{totalTx}</div>
            <div className="metric-label">Total Transactions</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: '#10b981' }}>{successTx}</div>
            <div className="metric-label">Cryptographically Verified</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: '#ef4444' }}>{rejectedTx}</div>
            <div className="metric-label">Rejected / Tampered</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="metric-value">{securityScore}%</div>
            <div className="metric-label">Security Resilience Score</div>
          </div>
        </div>
      </div>

      {/* Quick Launch Action Bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #131c31 0%, #0e1424 100%)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
            Interactive Cryptography Laboratories
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Test SHA-256 canonical hashing, HMAC verification, RSA signatures, or simulate MITM tampering attacks.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/payment" className="btn btn-primary btn-sm">
            <Send size={14} /> Make Payment
          </Link>
          <Link to="/simulation" className="btn btn-danger btn-sm">
            <Bug size={14} /> Attack Simulator
          </Link>
          <Link to="/verify" className="btn btn-secondary btn-sm">
            <FileCheck2 size={14} /> Security Verification
          </Link>
          <Link to="/security" className="btn btn-secondary btn-sm">
            <ShieldAlert size={14} /> Security Center
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Transactions & Security Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Transactions Table */}
        <div className="crypto-card">
          <div className="card-header-flex">
            <h2 className="card-title">
              <Activity size={18} color="var(--accent-primary)" /> Recent Payment Packets
            </h2>
            <Link to="/history" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              View All <ExternalLink size={13} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="crypto-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx, idx) => (
                    <tr
                      key={tx._id || tx.transactionId || idx}
                      onClick={() => setSelectedTx(tx)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view cryptographic inspector"
                    >
                      <td className="font-mono" style={{ fontSize: '0.775rem', color: '#93c5fd', fontWeight: 600 }}>
                        {tx.transactionId}
                      </td>
                      <td>{tx.receiver || tx.receiverName}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : '₹'}{Number(tx.amount).toFixed(2)} {tx.currency || 'INR'}
                      </td>
                      <td>
                        <CryptoBadge status={tx.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No transactions recorded yet. Launch a payment simulator to generate live proofs!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Events & Audit Logs */}
        <div className="crypto-card">
          <div className="card-header-flex">
            <h2 className="card-title">
              <ShieldCheck size={18} color="var(--accent-success)" /> Security Audit Trail
            </h2>
            <Link to="/security" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              Full Audit <ExternalLink size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentLogs.length > 0 ? (
              recentLogs.slice(0, 5).map((log, idx) => (
                <div
                  key={log._id || log.logId || idx}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {log.severity === 'CRITICAL' || log.severity === 'HIGH' ? (
                      <AlertTriangle size={15} color="var(--accent-danger)" />
                    ) : log.severity === 'MEDIUM' ? (
                      <AlertTriangle size={15} color="var(--accent-warning)" />
                    ) : (
                      <CheckCircle size={15} color="var(--accent-success)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff' }}>
                        {log.eventType}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'Recent'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.765rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                      {log.details}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No security events logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTx && (
        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
};

export default DashboardPage;
