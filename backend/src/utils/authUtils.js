const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
// Force 3 hour expiry unless overridden explicitly
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3h';

function getSessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 3); // 3 hours session validity
  return expiresAt;
}

module.exports = {
  hashPassword: async (password) => bcrypt.hash(password, 12),
  comparePassword: async (candidatePassword, hash) => bcrypt.compare(candidatePassword, hash),
  generateToken: (payload, options = {}) => {
    const jti = uuidv4();
    // Only embed jti in payload; don't also pass jwtid option to avoid duplication error
    const token = jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
    return { token, jti };
  },
  verifyToken: (token) => jwt.verify(token, JWT_SECRET),
  getSessionExpiryDate,
};