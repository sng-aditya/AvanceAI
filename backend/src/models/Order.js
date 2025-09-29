const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  symbol: { type: String, required: true },
  securityId: { type: String, required: true },
  quantity: { type: Number, required: true },
  orderType: { type: String, enum: ['BUY', 'SELL'], required: true },
  priceType: { type: String, enum: ['MARKET', 'LIMIT'], required: true },
  limitPrice: { type: Number, default: 0 },
  exchangeSegment: { type: String, default: 'NSE_EQ' },
  productType: { type: String, default: 'INTRADAY' },
  validity: { type: String, default: 'DAY' },
  status: { type: String, default: 'PENDING' },
  dhanOrderId: { type: String }, // Dhan API order ID
  externalOrderId: { type: String }, // Legacy field for compatibility
  executedQuantity: { type: Number, default: 0 },
  executedPrice: { type: Number },
  rejectionReason: { type: String },
  errorCode: { type: String },
  failureReason: { type: String },
  lastSyncedAt: { type: Date },
  rawResponse: { type: Object },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
