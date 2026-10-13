import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Lock,
  KeyRound,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { paymentService } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';
import TransactionModal from '../components/TransactionModal';
import { Link } from 'react-router-dom';

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.warn('Transaction ledger fetch error', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const copyHash = (txt) => {
    navigator.clipboard.writeText(txt);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction Ledger & Integrity Log</h1>
          <p className="page-subtitle">
            Cryptographic ledger recording all transaction payloads, SHA-256 digests, HMAC codes, and RSA digital signatures
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchTransactions}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} /> Refresh
          </button>
          <Link to="/payment" className="btn btn-primary" style={{ padding: '0.5rem 0.85rem' }}>
            <Send size={14} /> New Transaction
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="crypto-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by TX ID, receiver, or SHA-256 hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          >
            <option value="ALL">All Transactions</option>
            <option value="SUCCESS">Verified (Success)</option>
            <option value="REJECTED">Rejected / Tampered</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="crypto-card">
        <div className="table-responsive">
          <table className="crypto-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Sender → Receiver</th>
                <th>Amount</th>
                <th>Timestamp</th>
                <th>SHA-256 Digest</th>
                <th>HMAC / RSA</th>
                <th>Verification</th>
                <th style={{ textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <tr key={idx}>
                    <td className="font-mono" style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                      {tx.transactionId}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{tx.sender || tx.senderName}</span>
                      <span style={{ color: 'var(--accent-primary)', margin: '0 0.35rem' }}>→</span>
                      <strong style={{ color: '#ffffff' }}>{tx.receiver || tx.receiverName}</strong>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : '₹'}{Number(tx.amount).toFixed(2)} {tx.currency || 'INR'}
                    </td>
                    <td style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                      {new Date(tx.timestamp || tx.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: '#38bdf8' }}>
                        {(tx.sha256Hash || '').substring(0, 10)}...
                      </span>
                      <button
                        onClick={() => copyHash(tx.sha256Hash || '')}
                        title="Copy SHA-256"
                        style={{ marginLeft: '0.4rem', color: 'var(--text-muted)' }}
                      >
                        <Copy size={11} />
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span
                          title="HMAC Auth"
                          style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            background: tx.verificationBreakdown?.hmacValid !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: tx.verificationBreakdown?.hmacValid !== false ? '#34d399' : '#f87171',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          HMAC
                        </span>
                        <span
                          title="RSA Digital Signature"
                          style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            background: tx.verificationBreakdown?.rsaValid !== false ? 'rgba(167, 139, 250, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: tx.verificationBreakdown?.rsaValid !== false ? '#a78bfa' : '#f87171',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          RSA
                        </span>
                      </div>
                    </td>
                    <td>
                      <CryptoBadge status={tx.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No transactions match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
};

export default TransactionHistoryPage;
