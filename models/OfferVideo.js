const mongoose = require('mongoose');

const offerVideoSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    videoUrl: { type: String, required: true },
    title: { type: String, required: true },
    offerText: { type: String, required: true },
    discountPercentage: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('OfferVideo', offerVideoSchema);
