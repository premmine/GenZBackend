const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// All order routes are protected
router.use(authMiddleware);

router.get('/', orderController.getOrders);
router.get('/user/orders', orderController.getOrders); // Explicitly for profile view
router.get('/:id', orderController.getOrderDetails);
router.post('/', orderController.addOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

// Specific order actions
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/return', orderController.returnOrder);

module.exports = router;
