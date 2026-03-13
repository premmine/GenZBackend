const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true }, // Ord-001 format
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: String, required: true },
    email: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            image: { type: String },
            isDigital: { type: Boolean, default: false }
        }
    ],
    subtotal: { type: Number },
    shippingCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    codAmount: { type: Number, default: 0 },
    adminNote: { type: String, default: '' },

    paymentMethod: { type: String, enum: ['COD', 'razorpay', 'UPI', 'Online'], default: 'COD' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    transactionId: { type: String },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

    orderStatus: {
        type: String,
        enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Placed'
    },
    // Legacy status for compatibility
    status: { type: String },

    shippingAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    billingAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },

    courierName: { type: String, default: 'Genzi Logistics' },
    trackingId: { type: String },
    estimatedDeliveryDate: { type: String },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },

    statusHistory: [
        {
            status: String,
            updatedAt: { type: Date, default: Date.now },
            message: String,
            updatedBy: { type: String, default: 'System' }
        }
    ],
    // Legacy timeline
    timeline: [
        {
            status: String,
            time: { type: Date, default: Date.now },
            message: String
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

OrderSchema.index({ userId: 1 });
OrderSchema.index({ email: 1 });
OrderSchema.index({ id: 1 }, { unique: true });
OrderSchema.index({ trackingId: 1 });

// Pre-save hook for status synchronization and data normalization
OrderSchema.pre('save', async function () {
    // 1. Synchronize Status Fields
    // If orderStatus is being used/modified, ensure legacy status matches
    if (this.orderStatus) {
        const targetStatus = this.orderStatus.toLowerCase();
        if (this.status !== targetStatus) {
            this.status = targetStatus;
        }
    } else if (this.status) {
        // Fallback: if only legacy status is provided, update orderStatus
        const statusMap = {
            'placed': 'Placed',
            'confirmed': 'Confirmed',
            'packed': 'Packed',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'returned': 'Returned'
        };
        const capitalized = statusMap[this.status.toLowerCase()];
        if (capitalized) {
            this.orderStatus = capitalized;
        }
    }

    // 2. Normalize Enums to prevent validation errors
    if (this.paymentStatus && typeof this.paymentStatus === 'string') {
        const pStatusMap = {
            'pending': 'Pending',
            'paid': 'Paid',
            'failed': 'Failed',
            'refunded': 'Refunded'
        };
        const lowerPStatus = this.paymentStatus.toLowerCase();
        if (pStatusMap[lowerPStatus]) this.paymentStatus = pStatusMap[lowerPStatus];
    }

    if (this.paymentMethod && typeof this.paymentMethod === 'string') {
        const pMethodMap = {
            'cod': 'COD',
            'razorpay': 'razorpay',
            'upi': 'UPI',
            'online': 'Online'
        };
        const lowerPMethod = this.paymentMethod.toLowerCase();
        if (pMethodMap[lowerPMethod]) this.paymentMethod = pMethodMap[lowerPMethod];
    }

    // 3. Fallback for totalAmount calculation
    if (!this.totalAmount || isNaN(this.totalAmount)) {
        const subtotal = (this.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        this.totalAmount = subtotal + (this.shippingCharge || 0) - (this.discountAmount || 0);
    }
});

module.exports = mongoose.model('Order', OrderSchema);
