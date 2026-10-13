import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ShieldCheck, Info } from 'lucide-react';

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      <div className="main-content">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="page-wrapper">
          <div className="academic-notice-banner">
            <Info size={18} color="#60a5fa" style={{ flexShrink: 0 }} />
            <div>
              <strong>Academic Project Simulator:</strong> Demonstrating how cryptographic integrity (SHA-256), gateway authentication (HMAC-SHA-256), digital signatures (RSA-2048), and anti-replay (Nonce + Monotonic Timestamp) secure digital transactions.
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
