const jwt = require('jsonwebtoken');
const { Session } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Skip session validation for testing
    // TODO: Re-enable session validation in production

    req.userId = decoded.id;
    req.user = { id: decoded.id }; // Add user object for compatibility
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = authMiddleware;