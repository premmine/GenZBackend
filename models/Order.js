const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true }, // Ord-001 format
    customer: { type: String, required: true },
    email: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            image: { type: String }
        }
    ],
    total: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    payment: { type: String, default: 'pending' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    shippingAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    trackingInfo: {
        estimatedDelivery: String,
        courierPartner: { type: String, default: 'Genzi Logistics' },
        trackingNumber: { type: String, default: () => 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase() }
    },
    timeline: [
        {
            status: String,
            time: { type: Date, default: Date.now },
            message: String
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
