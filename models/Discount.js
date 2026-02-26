const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // percentage, fixed, bogo
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    usage: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Discount', DiscountSchema);
