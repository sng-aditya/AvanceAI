const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

module.exports = {
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 12);
  },

  comparePassword: async (candidatePassword, hash) => {
    return await bcrypt.compare(candidatePassword, hash);
  },

  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  },

  getTokenExpiry: () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    return expiresAt;
  }
};