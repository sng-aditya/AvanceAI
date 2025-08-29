const { User, Session } = require('../models');
const { generateToken } = require('../utils/authUtils');

module.exports = {
  register: async (req, res, next) => {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create user
      const user = await User.create({ email, password, first_name, last_name });

      // Generate token
      const token = generateToken({ id: user.id });

      // Create session
      await Session.create(user.id, token, req);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await User.verifyPassword(user.id, password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({ id: user.id });

      // Create session
      await Session.create(user.id, token, req);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      await Session.delete(token);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
};