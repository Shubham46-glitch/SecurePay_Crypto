const express = require('express');
const router = express.Router();
const {
  getSecurityDashboardMetrics,
  getSecurityAuditLogs,
  resetDemoState,
} = require('../controllers/securityController');

router.get('/metrics', getSecurityDashboardMetrics);
router.get('/dashboard-summary', getSecurityDashboardMetrics);
router.get('/security-summary', getSecurityDashboardMetrics);
router.get('/logs', getSecurityAuditLogs);
router.post('/reset', resetDemoState);

module.exports = router;
