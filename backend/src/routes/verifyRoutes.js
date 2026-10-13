const express = require('express');
const router = express.Router();
const { inspectTransaction } = require('../controllers/verifyController');

router.post('/inspect', inspectTransaction);

module.exports = router;
