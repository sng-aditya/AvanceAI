const { User, Session } = require('../models');
const { hashPassword, comparePassword, generateToken, getSessionExpiryDate } = require('../utils/authUtils');

module.exports = {
  register: async (req, res, next) => {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      const passwordHash = await hashPassword(password);
      const user = await User.create({ email, passwordHash, first_name, last_name });

      const { token, jti } = generateToken({ id: user._id.toString() });
      await Session.create({
        user: user._id,
        jti,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: getSessionExpiryDate()
      });

      res.status(201).json({
        token,
        user: user.toPublic()
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const { token, jti } = generateToken({ id: user._id.toString() });
      await Session.create({
        user: user._id,
        jti,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: getSessionExpiryDate()
      });

      res.json({ token, user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
      if (decoded.jti) {
        await Session.findOneAndUpdate({ jti: decoded.jti }, { revoked: true });
      }
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user.toPublic());
    } catch (err) {
      next(err);
    }
  }
};