const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// All order routes are protected
router.use(authMiddleware);

router.get('/', orderController.getOrders);
router.get('/user/orders', orderController.getOrders); // Explicitly for profile view
router.get('/:id', orderController.getOrderDetails);

// Admin-only routes
router.put('/:id', adminMiddleware, orderController.updateOrder);
router.delete('/:id', adminMiddleware, orderController.deleteOrder);

// Specific order actions
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/return', orderController.returnOrder);

module.exports = router;
