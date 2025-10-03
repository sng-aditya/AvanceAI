const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../utils/validators');

// Register route with validation middleware
router.post('/register', validateRegister, authController.register);

// Login route with validation middleware
router.post('/login', validateLogin, authController.login);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

// Heartbeat endpoint to keep session alive
router.post('/heartbeat', authMiddleware, (req, res) => {
  // The auth middleware already updated lastActivity
  res.json({ 
    success: true,
    sessionActive: true,
    expiresAt: req.session.expiresAt,
    lastActivity: req.session.lastActivity
  });
});

module.exports = router;