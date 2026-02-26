const Review = require('../models/Review');

exports.getReviews = async (req, res) => {
    try {
        const { productId } = req.query;
        let query = {};
        if (productId) query.product = productId;

        const reviews = await Review.find(query).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const review = new Review(req.body);
        const newReview = await review.save();

        // Update Product stats
        const Product = require('../models/Product');
        const reviews = await Review.find({ product: req.body.product });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(req.body.product, {
            rating: parseFloat(avgRating.toFixed(1)),
            reviewsCount: reviews.length
        });

        res.status(201).json(newReview);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const updated = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: "Review Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
