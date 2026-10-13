import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crypto_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
  regenerateKeys: async () => {
    const res = await api.post('/auth/regenerate-keys');
    return res.data;
  },
};

export const transactionService = {
  create: async (data) => {
    const res = await api.post('/transactions', data);
    return res.data;
  },
  process: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/process`, options);
    return res.data;
  },
  processTransaction: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/process`, options);
    return res.data;
  },
  verifySecurity: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/verify-security`, options);
    return res.data;
  },
  verifyIntegrity: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/verify-integrity`, options);
    return res.data;
  },
  verifyHmac: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/verify-hmac`, options);
    return res.data;
  },
  verifySignature: async (transactionId, options = {}) => {
    const res = await api.post(`/transactions/${transactionId}/verify-signature`, options);
    return res.data;
  },
  getAll: async (params) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
};

// Aliased paymentService for backward compatibility across modules
export const paymentService = {
  prepare: async (data) => {
    return transactionService.create(data);
  },
  execute: async (data) => {
    return transactionService.create(data);
  },
  process: async (transactionId, options = {}) => {
    return transactionService.process(transactionId, options);
  },
  verifySecurity: async (transactionId, options = {}) => {
    return transactionService.verifySecurity(transactionId, options);
  },
  getAll: async (params) => {
    return transactionService.getAll(params);
  },
  getById: async (id) => {
    return transactionService.getById(id);
  },
};

export const verifyService = {
  inspect: async (payload) => {
    const res = await api.post('/verify/inspect', payload);
    return res.data;
  },
  verifySecurity: async (transactionId, options) => {
    return transactionService.verifySecurity(transactionId, options);
  },
  verifyIntegrity: async (transactionId, options) => {
    return transactionService.verifyIntegrity(transactionId, options);
  },
  verifyHmac: async (transactionId, options) => {
    return transactionService.verifyHmac(transactionId, options);
  },
  verifySignature: async (transactionId, options) => {
    return transactionService.verifySignature(transactionId, options);
  },
};

export const simulationService = {
  tamper: async (data) => {
    const res = await api.post('/attacks/tamper', data);
    return res.data;
  },
  replay: async (data) => {
    const res = await api.post('/attacks/replay', data);
    return res.data;
  },
  forge: async (data) => {
    const res = await api.post('/attacks/forge', data);
    return res.data;
  },
  simulate: async (data) => {
    const res = await api.post('/attacks/attack', data);
    return res.data;
  },
};

export const securityService = {
  getMetrics: async () => {
    const res = await api.get('/security/metrics');
    return res.data;
  },
  getSecuritySummary: async () => {
    const res = await api.get('/dashboard/security-summary');
    return res.data;
  },
  getLogs: async (params) => {
    const res = await api.get('/security/logs', { params });
    return res.data;
  },
  reset: async () => {
    const res = await api.post('/security/reset');
    return res.data;
  },
};

export const dashboardService = {
  getSecuritySummary: async () => {
    const res = await api.get('/dashboard/security-summary');
    return res.data;
  },
  getMetrics: async () => {
    const res = await api.get('/dashboard/security-summary');
    return res.data;
  },
  reset: async () => {
    const res = await api.post('/security/reset');
    return res.data;
  },
};

export default api;
