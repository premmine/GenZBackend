const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['order', 'review', 'ticket', 'contact'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false // Optional reference to the specific order/review/etc
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    email: String,
    phone: String,
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-delete after 30 days (TTL Index)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', NotificationSchema);
