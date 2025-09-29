const jwt = require('jsonwebtoken');
const { Session, User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');

    if (!decoded.jti) {
      return res.status(401).json({ message: 'Token missing jti' });
    }

    // Check session existence & validity
    const session = await Session.findOne({ jti: decoded.jti, revoked: false });
    if (!session) {
      return res.status(401).json({ message: 'Session not found or revoked' });
    }
    if (session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Load user
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.userId = decoded.id;
    req.user = { id: decoded.id, email: user.email };
    req.token = token;
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = authMiddleware;