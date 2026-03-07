// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/notify', productController.subscribeToNotification);

// Protected routes (Admin only/Authenticated)
router.post('/', authMiddleware, productController.addProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;