const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    storeName: { type: String, default: "GenziKart Store" },
    storeEmail: { type: String, default: "helpgenzikart@gmail.com" },
    currency: { type: String, default: "INR" },
    taxRate: { type: Number, default: 12 },
    whatsappNumber: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
