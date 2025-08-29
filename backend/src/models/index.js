const { createDBConnection, dbRun, dbGet, dbAll } = require('../utils/dbUtils');
const { hashPassword, comparePassword, generateToken, getTokenExpiry } = require('../utils/authUtils');

module.exports = {
  User: {
    create: async (userData) => {
      const db = createDBConnection();
      try {
        const hashedPassword = await hashPassword(userData.password);
        const result = await dbRun(
          db,
          'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
          [userData.email, hashedPassword, userData.first_name, userData.last_name]
        );
        return { id: result.id, ...userData, password: undefined };
      } finally {
        db.close();
      }
    },

    findByEmail: async (email) => {
      const db = createDBConnection();
      try {
        return await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email]);
      } finally {
        db.close();
      }
    },

    findById: async (id) => {
      const db = createDBConnection();
      try {
        return await dbGet(db, 'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?', [id]);
      } finally {
        db.close();
      }
    },

    verifyPassword: async (userId, password) => {
      const db = createDBConnection();
      try {
        const user = await dbGet(db, 'SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) return false;
        return await comparePassword(password, user.password);
      } finally {
        db.close();
      }
    }
  },

  Session: {
    create: async (userId, token, req) => {
      const db = createDBConnection();
      try {
        const expiresAt = getTokenExpiry();
        await dbRun(
          db,
          'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
          [userId, token, req.ip, req.headers['user-agent'], expiresAt]
        );
        return true;
      } finally {
        db.close();
      }
    },

    findByToken: async (token) => {
      const db = createDBConnection();
      try {
        return await dbGet(
          db,
          'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
          [token]
        );
      } finally {
        db.close();
      }
    },

    delete: async (token) => {
      const db = createDBConnection();
      try {
        await dbRun(db, 'DELETE FROM sessions WHERE token = ?', [token]);
        return true;
      } finally {
        db.close();
      }
    },

    deleteAllForUser: async (userId) => {
      const db = createDBConnection();
      try {
        await dbRun(db, 'DELETE FROM sessions WHERE user_id = ?', [userId]);
        return true;
      } finally {
        db.close();
      }
    }
  }
};