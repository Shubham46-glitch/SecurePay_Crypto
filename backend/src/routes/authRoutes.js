const express = require('express');
const router = express.Router();
const { register, login, getProfile, regenerateKeys } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/regenerate-keys', protect, regenerateKeys);

module.exports = router;
