const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Secure Digital Payment System (Cryptography Simulator)',
    timestamp: new Date().toISOString(),
    cryptoEngine: {
      integrity: 'SHA-256',
      authentication: 'HMAC-SHA-256',
      digitalSignature: 'RSA-2048 (PKCS#1 v1.5)',
      replayDefense: 'Nonce + Timestamp Window',
      confidentiality: 'AES-256-GCM',
    },
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/verify', require('./routes/verifyRoutes'));
app.use('/api/simulation', require('./routes/simulationRoutes'));
app.use('/api/attacks', require('./routes/simulationRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));
app.use('/api/dashboard', require('./routes/securityRoutes'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🔐 Cryptographic Payment Simulator API running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🛡️  Crypto Engine Active: SHA-256 | HMAC | RSA-2048 | Nonce`);
  console.log(`======================================================\n`);
});
