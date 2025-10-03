const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jti: { type: String, required: true, unique: true, index: true },
  ip: { type: String },
  userAgent: { type: String },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false },
  revokedReason: { 
    type: String, 
    enum: ['logout', 'inactivity', 'expired', 'security', 'admin'],
    default: null 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
}, { timestamps: true });

// Compound index for inactive session queries
sessionSchema.index({ revoked: 1, lastActivity: 1 });

module.exports = mongoose.model('Session', sessionSchema);
