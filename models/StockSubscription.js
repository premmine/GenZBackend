const mongoose = require('mongoose');

const StockSubscriptionSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.StockSubscription || mongoose.model('StockSubscription', StockSubscriptionSchema);
