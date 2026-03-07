const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Get specific invoice (Admin or Owner)
router.get('/:id', authMiddleware, invoiceController.getInvoice);

// Download PDF (Admin or Owner)
router.get('/:id/download', authMiddleware, invoiceController.downloadInvoice);

// View PDF Inline (Admin or Owner)
router.get('/:id/view', authMiddleware, invoiceController.viewInvoice);

// Resend Email (Admin only)
router.post('/:id/resend', authMiddleware, adminMiddleware, invoiceController.resendInvoice);

module.exports = router;
