const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');
const crypto = require('crypto');
const notificationController = require('./notificationController');

/**
 * Generate Gravatar URL from email
 */
const getGravatarUrl = (email) => {
    const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

/**
 * Create a new review
 * POST /api/reviews/:productId
 */
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment, area, state } = req.body;
        const userId = req.user.id; // From authMiddleware

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Please provide a rating between 1 and 5' });
        }
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ error: 'Please provide a comment' });
        }
        if (comment.length > 500) {
            return res.status(400).json({ error: 'Comment must be less than 500 characters' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for duplicate review
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Create review
        const review = new Review({
            userId,
            productId,
            name: user.name,
            email: user.email,
            rating,
            comment: comment.trim(),
            area: area ? area.trim() : '',
            state: state ? state.trim() : '',
            isApproved: true // Defaulted to true as per request logic
        });

        await review.save();

        // Update product rating (optional but recommended)
        const reviews = await Review.find({ productId, isApproved: true });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        product.rating = Math.round(avgRating * 10) / 10;
        product.reviewsCount = reviews.length;
        await product.save();

        // Trigger Admin Notification
        await notificationController.createNotificationInternal({
            title: "New Product Review",
            message: `${product.name} received a ${rating}-star review from ${user.name}`,
            type: "review",
            name: user.name,
            referenceId: review._id,
            email: user.email,
            phone: user.phone,
            priority: "medium"
        });

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Server error while submitting review' });
    }
};

/**
 * Get reviews for a product
 * GET /api/reviews/:productId
 */
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId, isApproved: true })
            .sort({ createdAt: -1 })
            .lean();

        // Collect unique emails to fetch all users in one query
        const emails = [...new Set(reviews.map(r => r.email).filter(Boolean))];
        const users = await User.find({ email: { $in: emails } }).select('email image').lean();
        const userImageMap = {};
        users.forEach(u => { userImageMap[u.email] = u.image || null; });

        const formattedReviews = reviews.map(review => ({
            name: review.name,
            // Use saved profile image if available, else fall back to Gravatar
            avatar: userImageMap[review.email] || getGravatarUrl(review.email),
            rating: review.rating,
            comment: review.comment,
            area: review.area,
            state: review.state,
            date: review.date,
            createdAt: review.createdAt
        }));

        res.json(formattedReviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Server error while fetching reviews' });
    }
};

/**
 * Get latest approved reviews across ALL products (for homepage carousel)
 * GET /api/reviews/all
 */
exports.getAllReviews = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const reviews = await Review.find({ isApproved: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Batch-fetch user images
        const emails = [...new Set(reviews.map(r => r.email).filter(Boolean))];
        const users = emails.length
            ? await User.find({ email: { $in: emails } }).select('email image').lean()
            : [];
        const userImageMap = {};
        users.forEach(u => { userImageMap[u.email] = u.image || null; });

        const formatted = reviews.map(r => ({
            name: r.name || 'Customer',
            avatar: r.email
                ? (userImageMap[r.email] || getGravatarUrl(r.email))
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || 'C')}&background=fb923c&color=fff`,
            rating: r.rating,
            comment: r.comment,
            date: r.date || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '')
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ error: 'Server error while fetching reviews' });
    }
};

/**
 * Get ALL reviews (Admin only)
 * GET /api/reviews/admin
 */
exports.getAdminReviews = async (req, res) => {
    try {
        // Fetch ALL reviews without filtering by isApproved
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({ error: 'Server error while fetching reviews' });
    }
};

/**
 * Update a review (Admin only)
 * PUT /api/reviews/:id
 */
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        const { isApproved, isFeatured, status } = req.body;

        if (isApproved !== undefined) review.isApproved = isApproved;
        if (isFeatured !== undefined) review.isFeatured = isFeatured;
        if (status !== undefined) review.status = status;

        await review.save();

        // Recalculate product rating if approval changed
        if (isApproved !== undefined) {
            const reviews = await Review.find({ productId: review.productId, isApproved: true });
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            await Product.findByIdAndUpdate(review.productId, {
                rating: Math.round(avgRating * 10) / 10,
                reviewsCount: reviews.length
            });
        }

        res.json({ message: 'Review updated successfully', review });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete a review (Admin only)
 * DELETE /api/reviews/:id
 */
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        const productId = review.productId;
        await Review.findByIdAndDelete(req.params.id);

        // Recalculate product rating
        const reviews = await Review.find({ productId, isApproved: true });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewsCount: reviews.length
        });

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
