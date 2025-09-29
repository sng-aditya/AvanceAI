const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dhanService = require('../services/dhanService');
const Order = require('../models/Order');

// In-memory throttle for sync
let lastSyncTs = 0;
const SYNC_COOLDOWN_MS = 3000;

// Place order
router.post('/place', auth, async (req, res) => {
  try {
    const { 
      symbol, 
      quantity, 
      orderType, 
      priceType, 
      limitPrice,
      exchangeSegment = 'NSE_EQ',
      productType = 'INTRADAY',
      validity = 'DAY'
    } = req.body;

    // Validate required fields
    if (!symbol || !quantity || !orderType || !priceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, quantity, orderType, priceType'
      });
    }

    // Get security ID
    const securityId = dhanService.getSecurityId(symbol);
    if (!securityId) {
      return res.status(400).json({
        success: false,
        error: `Symbol ${symbol} not supported`
      });
    }

    const priceTypeUpper = String(priceType).toUpperCase();
    const orderTypeUpper = String(orderType).toUpperCase();
    const orderData = {
      symbol,
      quantity: parseInt(quantity),
      orderType: orderTypeUpper,
      priceType: priceTypeUpper,
      limitPrice: priceTypeUpper === 'LIMIT' ? parseFloat(limitPrice) : 0,
      exchangeSegment,
      productType,
      validity,
      securityId,
      userId: req.user.id
    };

  console.log('[OrderPlacement] Payload:', orderData);
  const result = await dhanService.placeOrder(orderData);
  console.log('[OrderPlacement] Service result:', JSON.stringify(result));

    if (result.success) {
      // Persist order snapshot
      await Order.create({
        user: req.userId,
        symbol: orderData.symbol,
        securityId: orderData.securityId,
        quantity: orderData.quantity,
        orderType: orderData.orderType,
        priceType: orderData.priceType,
        limitPrice: orderData.limitPrice,
        exchangeSegment: orderData.exchangeSegment,
        productType: orderData.productType,
        validity: orderData.validity,
        status: 'PENDING',
        dhanOrderId: result.data?.orderId || result.orderId,
        externalOrderId: result.data?.orderId || result.orderId, // Keep for compatibility
        rawResponse: result
      });
      console.log('[OrderPlacement] Snapshot persisted for orderId:', result.data?.orderId || result.orderId);
      res.json(result);
    } else {
      console.warn('[OrderPlacement] Failed result returned to client');
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Sync pending orders (updates local statuses)
router.post('/sync', auth, async (req, res) => {
  const now = Date.now();
  if (now - lastSyncTs < SYNC_COOLDOWN_MS) {
    return res.json({ success: true, skipped: true, reason: 'cooldown' });
  }
  lastSyncTs = now;
  try {
    const pending = await Order.find({ user: req.userId, status: { $in: ['PENDING','TRANSIT'] } }).lean();
    if (!pending.length) {
      return res.json({ success: true, updated: 0 });
    }
    let updated = 0;
    for (const p of pending) {
      const orderId = p.dhanOrderId || p.externalOrderId;
      if (!orderId) continue;
      const remote = await dhanService.getOrderDetails(orderId, req.userId);
      if (remote && remote.success && remote.data) {
        const data = remote.data;
        // Attempt to map generic fields
        const newStatus = (data.orderStatus || data.status || p.status || '').toUpperCase();
        const executedQty = (data.filledQty ?? data.executedQuantity ?? (typeof data.remainingQuantity === 'number' && typeof data.quantity === 'number'
          ? (data.quantity - data.remainingQuantity) : undefined)) ?? p.executedQuantity;
        const patch = {
          status: newStatus,
          executedQuantity: executedQty,
          executedPrice: data.averageTradedPrice || data.averagePrice || data.executedPrice || p.executedPrice,
          rejectionReason: data.rejectionReason || data.reason || data.omsErrorDescription || p.rejectionReason,
          errorCode: data.errorCode || data.omsErrorCode || p.errorCode,
          failureReason: data.failureReason || p.failureReason,
          lastSyncedAt: new Date()
        };
        if (newStatus !== p.status) {
          console.log(`[OrderSync] Status change ${p.externalOrderId}: ${p.status} -> ${newStatus}`);
          if (['REJECTED','CANCELLED','EXECUTED','COMPLETE'].includes(newStatus)) {
            // Could emit event / further processing hook here
          }
        }
        await Order.updateOne({ _id: p._id }, { $set: patch });
        updated++;
      }
    }
    res.json({ success: true, updated });
  } catch (err) {
    console.error('Order sync error:', err);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// Get order history with active polling
router.get('/history', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
    
    // Active polling for orders with dhanOrderId that are still pending
    const pendingOrders = orders.filter(order => 
      order.dhanOrderId && 
      ['PENDING', 'TRANSIT', 'IN_TRANSIT'].includes(order.status?.toUpperCase())
    );
    
    // Poll pending orders for status updates
    
    let updatedCount = 0;
    for (const order of pendingOrders) {
      try {
        const response = await dhanService.getOrderDetails(order.dhanOrderId, req.userId);
        
        if (response && response.success && response.data) {
          const dhanData = Array.isArray(response.data) ? response.data[0] : response.data;
          // Extract order data from API response
          
          // Extract status from Dhan API response
          const newStatus = (dhanData.orderStatus || dhanData.status || 'PENDING').toUpperCase();
          const executedQty = dhanData.filledQty || dhanData.executedQuantity || 0;
          const executedPrice = dhanData.averageTradedPrice || dhanData.averagePrice || dhanData.executedPrice;
          const rejectionReason = dhanData.rejectionReason || dhanData.reason || dhanData.omsErrorDescription;
          const errorCode = dhanData.errorCode || dhanData.omsErrorCode;
          
          // Check if status has changed
          
          // Update database if status changed
          if (newStatus !== order.status) {
            const updateData = {
              status: newStatus,
              executedQuantity: executedQty,
              lastSyncedAt: new Date()
            };
            
            if (executedPrice) updateData.executedPrice = executedPrice;
            if (rejectionReason) updateData.rejectionReason = rejectionReason;
            if (errorCode) updateData.errorCode = errorCode;
            
            await Order.updateOne({ _id: order._id }, { $set: updateData });
            updatedCount++;
          }
        }
      } catch (error) {
        // Silently handle individual order polling errors
      }
    }
    
    // Fetch updated orders from database
    const updatedOrders = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
    
    // Format orders for frontend
    const formattedOrders = updatedOrders.map(order => ({
      orderId: order.dhanOrderId || order.externalOrderId || order._id.toString(),
      symbol: order.symbol,
      quantity: order.quantity,
      orderType: order.orderType,
      priceType: order.priceType,
      price: order.limitPrice || 0,
      status: order.status || 'PENDING',
      timestamp: order.createdAt,
      updatedAt: order.updatedAt,
      productType: order.productType,
      exchangeSegment: order.exchangeSegment,
      executedQuantity: order.executedQuantity || 0,
      executedPrice: order.executedPrice,
      rejectionReason: order.rejectionReason,
      errorCode: order.errorCode,
      lastSyncedAt: order.lastSyncedAt
    }));
    
    // Return formatted orders with updated statuses
    
    res.json({ 
      success: true, 
      data: formattedOrders,
      meta: {
        total: formattedOrders.length,
        pendingPolled: pendingOrders.length,
        statusUpdated: updatedCount
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific order details
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const local = await Order.findOne({ 
      user: req.userId, 
      $or: [{ dhanOrderId: orderId }, { externalOrderId: orderId }] 
    }).lean();
    const remote = await dhanService.getOrderDetails(orderId, req.userId);

    let combined = local || {};
    if (remote && remote.success && remote.data) {
      const r = remote.data;
      const newStatus = (r.orderStatus || r.status || combined.status || 'PENDING').toUpperCase();
      const executedQty = (r.filledQty ?? r.executedQuantity ?? (typeof r.remainingQuantity === 'number' && typeof r.quantity === 'number'
        ? (r.quantity - r.remainingQuantity) : undefined)) ?? combined.executedQuantity;
      const newCombined = {
        ...combined,
        orderId: orderId,
        symbol: combined.symbol || r.tradingSymbol || r.symbol,
        quantity: combined.quantity || r.quantity || r.qty,
        transactionType: (combined.transactionType || r.transactionType || combined.orderType || '').toUpperCase(),
        orderType: (combined.orderType || r.transactionType || '').toUpperCase(),
        priceType: (combined.priceType || r.orderType || '').toUpperCase(),
        status: newStatus,
        executedQuantity: executedQty,
        executedPrice: r.averageTradedPrice || r.averagePrice || r.executedPrice || combined.executedPrice,
        rejectionReason: r.rejectionReason || r.reason || r.omsErrorDescription || combined.rejectionReason,
        errorCode: r.errorCode || r.omsErrorCode || combined.errorCode,
        failureReason: r.failureReason || combined.failureReason,
        exchangeSegment: r.exchangeSegment || combined.exchangeSegment,
        productType: r.productType || combined.productType,
        createTime: r.createTime || combined.createTime || combined.timestamp || (local && local.createdAt),
        updateTime: r.updateTime || r.exchangeTime || combined.updateTime || combined.updatedAt,
        averageTradedPrice: r.averageTradedPrice,
        filledQty: r.filledQty,
        updatedAt: new Date().toISOString()
      };
      // Persist updates if we have a local doc and something changed
      if (local) {
        const diff = {};
        if (local.status !== newCombined.status) diff.status = newCombined.status;
        if (local.executedQuantity !== newCombined.executedQuantity) diff.executedQuantity = newCombined.executedQuantity;
        if (local.executedPrice !== newCombined.executedPrice) diff.executedPrice = newCombined.executedPrice;
        if (local.rejectionReason !== newCombined.rejectionReason) diff.rejectionReason = newCombined.rejectionReason;
        if (local.errorCode !== newCombined.errorCode) diff.errorCode = newCombined.errorCode;
        if (local.failureReason !== newCombined.failureReason) diff.failureReason = newCombined.failureReason;
        if (Object.keys(diff).length) {
          diff.lastSyncedAt = new Date();
          console.log(`[OrderDetail] Persisting updates for ${orderId}:`, Object.keys(diff));
          await Order.updateOne({ _id: local._id }, { $set: diff });
        }
      }
      combined = newCombined;
    }

    const includeRemote = process.env.NODE_ENV !== 'production';
    res.json({ success: true, data: combined, local: !!local, ...(includeRemote ? { remote } : {}) });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;