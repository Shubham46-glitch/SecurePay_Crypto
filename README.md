# Secure Digital Payment System Using Cryptographic Integrity and Authentication Mechanisms

> **Academic Project for Cryptography & Security Course**  
> *A comprehensive fintech payment simulator demonstrating real-world mathematical cryptography, integrity protection, message authentication, non-repudiation, and anti-replay defenses.*

---

## 🔐 Core Cryptographic Pillars

| Mechanism | Implementation | Governing Standard | Purpose |
|---|---|---|---|
| **Integrity Hashing** | SHA-256 with Canonical Serialization | FIPS PUB 180-4 | Detects any in-transit tampering of amount, receiver, nonce, or timestamp. |
| **Message Authentication** | HMAC-SHA-256 with Shared Secrets | RFC 2104 | Mutual gateway authentication; confirms message originated from authorized nodes. |
| **Digital Signatures** | RSA-2048 (RSASSA-PKCS1-v1_5 / PSS) | PKCS #1 v2.2 | Sender authenticity and legally binding non-repudiation. |
| **Replay Defense** | Monotonic Nonces + 300s TTL Window | Anti-Replay Engine | Prevents adversary duplication and re-transmission of past valid transactions. |
| **Confidentiality** | AES-256-GCM Authenticated Encryption | NIST SP 800-38D | Optional encryption of sensitive transaction metadata. |

---

## 📁 Architecture Overview

```
d:\Cryptogrphy PROJECT\
├── backend/
│   ├── src/
│   │   ├── config/             # DB Connection (MongoDB/Mongoose with resilient offline fallback)
│   │   ├── crypto/             # Pure Node.js crypto module implementations
│   │   │   ├── sha256.js       # Canonical serialization + SHA-256 hashing
│   │   │   ├── hmac.js         # HMAC-SHA-256 generator + timing-safe validator
│   │   │   ├── rsa.js          # RSA 2048-bit key generation, signing, and verification
│   │   │   ├── nonce.js        # Nonce generator and sliding-window replay tracker
│   │   │   ├── aes.js          # AES-256-GCM encryption & decryption
│   │   │   └── index.js        # Modular crypto exports
│   │   ├── models/             # Mongoose Schemas (User, Transaction, SecurityLog)
│   │   ├── controllers/        # Express handlers (Auth, Payment, Verify, Simulation, Security)
│   │   ├── routes/             # REST API endpoints
│   │   ├── middleware/         # JWT Auth, error handler
│   │   └── server.js           # Server entry point on port 5000
│   ├── .env
│   └── package.json
└── frontend/                   # React 18 + Webpack 5 (No Vite)
    ├── public/                 # HTML5 template (Inter + JetBrains Mono)
    ├── src/
    │   ├── components/         # Navbar, Sidebar, Layout, CryptoBadge, TransactionModal, etc.
    │   ├── context/            # AuthContext & Session state
    │   ├── pages/              # 9 Target Views
    │   │   ├── LandingPage.jsx              # Project overview & 5 pillars
    │   │   ├── LoginPage.jsx                # Sign in & Quick-Fill Demo
    │   │   ├── RegisterPage.jsx             # Keypair generation registration
    │   │   ├── DashboardPage.jsx            # Telemetry metrics & recent packets
    │   │   ├── MakePaymentPage.jsx          # Live cryptographic wire packet generator
    │   │   ├── TransactionHistoryPage.jsx   # Ledger & audit inspector
    │   │   ├── TransactionVerificationPage.jsx # Multi-point mathematical verifier
    │   │   ├── AttackSimulationPage.jsx     # MITM tampering & avalanche effect sandbox
    │   │   └── SecurityDashboardPage.jsx    # Key management & audit trail
    │   ├── services/           # Axios API client
    │   ├── styles/             # Modern Fintech Slate/Navy Design System
    │   ├── App.jsx             # React Router configuration
    │   └── index.jsx           # React DOM root
    ├── webpack.config.js       # Webpack 5 configuration with proxy
    └── package.json
```

---

## 🚀 How to Run Locally

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend Application (Port 3000)
```bash
cd frontend
npm install
npm start
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🧪 Demo Credentials
- **Email:** `alice@crypto.bank`
- **Password:** `Alice@1234`
*(You can also register a new cryptographic identity with auto-provisioned RSA 2048-bit keys or use the "Quick-Fill Demo" button on the Login page).*
