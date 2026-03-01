const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   GET api/reviews/all
// @desc    Get latest approved reviews across all products (for homepage carousel)
// @access  Public
router.get('/all', reviewController.getAllReviews);

// @route   POST api/reviews/:productId
// @desc    Create a review for a product
// @access  Private
router.post('/:productId', authMiddleware, reviewController.createReview);

// @route   GET api/reviews/:productId
// @desc    Get all approved reviews for a product
// @access  Public
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;
