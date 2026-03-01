const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true }, // Used for Gravatar, hidden in responses
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
    area: { type: String, trim: true },
    state: { type: String, trim: true },
    status: { type: String, default: 'approved' }, // Defaulting to approved for now as requested
    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

// Prevent duplicate reviews for same product by same user
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
