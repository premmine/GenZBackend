const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Update Status (Admin)
router.patch('/:orderId/status', authMiddleware, adminMiddleware, shippingController.updateShippingStatus);

// Get Label (Admin)
router.get('/:orderId/label', authMiddleware, adminMiddleware, shippingController.getShippingLabel);

// Get Tracking (Public)
router.get('/track/:trackingId', shippingController.getTrackingInfo);

module.exports = router;
