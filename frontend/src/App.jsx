import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MakePaymentPage from './pages/MakePaymentPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import TransactionVerificationPage from './pages/TransactionVerificationPage';
import AttackSimulationPage from './pages/AttackSimulationPage';
import SecurityDashboardPage from './pages/SecurityDashboardPage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/payment" element={<MakePaymentPage />} />
            <Route path="/history" element={<TransactionHistoryPage />} />
            <Route path="/verify" element={<TransactionVerificationPage />} />
            <Route path="/simulation" element={<AttackSimulationPage />} />
            <Route path="/security" element={<SecurityDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
