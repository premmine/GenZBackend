const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },

    shippingAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },

    items: [
        {
            productName: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            total: { type: Number, required: true }
        }
    ],

    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' },
    invoicePdfPath: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Index for email lookup
InvoiceSchema.index({ customerEmail: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
