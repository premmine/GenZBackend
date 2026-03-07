const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   GET api/reviews
// @desc    Get latest approved reviews across all products
// @access  Public
router.get('/', reviewController.getAllReviews);

// @route   GET api/reviews/all
// @desc    Get latest approved reviews across all products (for homepage carousel)
// @access  Public
router.get('/all', reviewController.getAllReviews);

const adminMiddleware = require('../middlewares/adminMiddleware');

// @route   GET api/reviews/admin
// @desc    Get ALL reviews (Admin only)
// @access  Private/Admin
router.get('/admin', authMiddleware, adminMiddleware, reviewController.getAdminReviews);

// @route   PUT api/reviews/:id
// @desc    Update a review (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, reviewController.updateReview);

// @route   DELETE api/reviews/:id
// @desc    Delete a review (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, reviewController.deleteReview);

// @route   GET api/reviews/:productId
// @desc    Create a review for a product
// @access  Private
router.post('/:productId', authMiddleware, reviewController.createReview);

// @route   GET api/reviews/:productId
// @desc    Get all approved reviews for a product
// @access  Public
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;
