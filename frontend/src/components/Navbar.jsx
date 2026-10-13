import React from 'react';
import { ShieldCheck, Wallet, LogOut, Menu, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-secondary"
          style={{ padding: '0.45rem', display: 'none' }}
          aria-label="Toggle navigation menu"
          id="mobile-nav-toggle"
        >
          <Menu size={18} />
        </button>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.025rem', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              SecurePay <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 800 }}>CRYPTO</span>
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
              Integrity & Authentication Simulator
            </div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Wallet Balance Display */}
        {user && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
            className="d-none-sm"
          >
            <Wallet size={15} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1, letterSpacing: '0.04em' }}>
                SIMULATED BALANCE
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{(user.balance || 50000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* User Identity / Auth Control */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }} className="d-none-sm">
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout / Reset Session"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.775rem' }}
            >
              <LogOut size={14} />
              <span className="d-none-sm">Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
